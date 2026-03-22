# Clip Search Mini App

Telegram Mini App for browsing, searching, filtering, and previewing a paid clip library. The frontend is a React/Vite Mini App and the backend is a FastAPI service that reads the existing `clips` table, validates Telegram init data, and serves only safe preview metadata.

## Structure

- `apps/web`: Telegram Mini App frontend
- `apps/api`: FastAPI backend
- `../payment-system`: upstream clip admin/schema changes for `bunny_stream_preview_id`

## Features

- Telegram-aware mobile-first UI with browser fallback banner
- Search, filters, sort, load-more pagination, recent searches
- Bunny Stream player preview on the clip detail sheet
- Exact Telegram bot deep links for stream/download purchase actions
- FastAPI API with server-side Telegram init data validation
- Flexible clip field mapping centered on the real payment-system schema

## Environment

Copy [.env.example](/Users/guywatson/Projects/clip-search-mini-app/.env.example) and provide real values. In production on Railway, set these in the service Variables tab. The backend reads its values from [`apps/api/app/core/config.py`](/Users/guywatson/Projects/clip-search-mini-app/apps/api/app/core/config.py), and the frontend reads `VITE_*` values at build time.

### Backend Env Reference

| Variable | Required | Example | Purpose | Railway notes |
| --- | --- | --- | --- | --- |
| `PORT` | No | `8000` | Port FastAPI binds to. Railway injects this automatically. | Usually do not set manually on Railway. |
| `APP_ENV` | Yes | `development` or `production` | Controls local dev behavior, including whether mock Telegram auth is allowed. | Set to `production` on Railway. |
| `DATABASE_URL` | Yes | `mysql+pymysql://user:password@host:3306/database` | SQLAlchemy connection string for your existing MySQL database. | Point this at the same MySQL instance that contains the `clips` table. |
| `TELEGRAM_BOT_TOKEN` | Yes | `123456:ABC...` | Used only on the backend to validate Telegram Mini App `initData` before trusting user identity. | Must match the exact bot that opens this Mini App from the menu button. Never expose it in the frontend. |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Public web origin used for CORS and cookie settings. | Set this to your Railway HTTPS Mini App URL or custom domain. |
| `SESSION_SECRET` | Yes | `long-random-secret` | Secret used to sign the session cookie after Telegram auth succeeds. | Use a long random value and rotate carefully because rotation invalidates active sessions. |
| `CORS_ALLOWED_ORIGINS` | Yes | `http://localhost:5173,https://miniapp.example.com` | Comma-separated list of allowed browser origins for API requests. | Include your Railway domain and any custom domain you attach. |
| `BUNNY_STREAM_LIBRARY_ID` | Yes | `123456` | Bunny Stream library ID used to resolve preview metadata. | Use the library that contains your preview videos. |
| `BUNNY_STREAM_API_KEY` | Yes | `bunny-stream-api-key` | Backend-only API key used to fetch Bunny Stream video metadata. | Keep this secret; it should never be exposed to the client. |
| `BUNNY_STREAM_CDN_HOST` | Yes | `https://vz-yourpullzone.b-cdn.net` | CDN host used to build public-safe thumbnail and preview asset URLs. | Use your actual Bunny Stream pull zone host. |
| `BUNNY_STREAM_EMBED_TOKEN_KEY` | Yes | `embed-token-key` | Secret/token key used to generate Bunny Stream player embed URLs. | Keep this secret on Railway; it stays server-side. |
| `BUNNY_PREVIEW_COLLECTION_ID` | Yes | `281a5ee9-db7e-41a2-bce0-97e16a7fd7b9` | Bunny collection ID used by the upstream admin flow to find preview videos. | This is the collection your preview picker and auto-match logic will search. |

### Frontend Env Reference

| Variable | Required | Example | Purpose | Railway notes |
| --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000/api` | API base URL used by the frontend during local dev and browser testing. | For single-service Railway deploys, set this to `/api` or leave it aligned with your build strategy. |
| `VITE_APP_NAME` | No | `Mistress BJ Queen Clips` | Display name used in the Mini App shell and browser metadata. | Safe to change without backend impact. |

### Recommended Railway Values

For a typical single-service Railway deployment:

- `APP_ENV=production`
- `FRONTEND_URL=https://<your-railway-domain>`
- `CORS_ALLOWED_ORIGINS=https://<your-railway-domain>`
- `VITE_API_BASE_URL=/api`

If you later add a custom domain, update both `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to match that public origin.

### Local Dev Tips

- Keep `APP_ENV=development` locally so browser fallback and mock auth remain available.
- Point `DATABASE_URL` at a safe development or read-only database if you do not want to use production data locally.
- `TELEGRAM_BOT_TOKEN` is still required for real Telegram Mini App testing, but browser-only local testing can use the development fallback path.
- If Bunny preview metadata is not configured yet, the app still works, but clips without `bunny_stream_preview_id` will show fallback preview states instead of the player.

## Local Development

### API

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Web

```bash
corepack enable
pnpm install
pnpm dev:web
```

The Vite dev server runs on `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

## Telegram Browser Fallback

Outside Telegram, the app shows a `Telegram preview mode` banner and can still browse the safe public catalog. In `development`, posting to `/api/auth/telegram` with a `devUser` payload creates a mock session for local testing.

## Bunny Preview Flow

The Mini App does not use Telegram `file_id` for previews. Instead it expects `clips.bunny_stream_preview_id` to point at a Bunny Stream preview video. The backend uses Bunny metadata plus the configured CDN host to generate:

- `thumbnailUrl`
- `previewWebpUrl`
- `previewEmbedUrl`

The frontend uses the Bunny Stream player in the clip detail view.

## Paid Delivery Safety

The Mini App never exposes paid stream or download URLs. Purchase actions deep-link back into the Telegram bot using your existing format:

- `https://t.me/mistressbjqueenbot?start=stream_<ID>`
- `https://t.me/mistressbjqueenbot?start=download_<ID>`

## Telegram Setup

1. Deploy the app on HTTPS.
2. Set the bot menu button to open the Mini App URL.
3. Ensure `TELEGRAM_BOT_TOKEN` matches the bot serving the menu button.
4. The frontend posts Telegram `initData` to `/api/auth/telegram`.
5. The backend validates `initData` before issuing a signed session cookie.

## Railway Deployment

This repo is designed for a single Railway service.

1. Create a new Railway service from this repo.
2. Add the environment variables from `.env.example`.
3. `railway.json` starts the app with `uvicorn` and points the health check at `/api/health`.
4. Railway builds the React frontend, then runs FastAPI via the root `Dockerfile`.
5. Set your public domain as the Mini App URL in BotFather.

## Upstream `payment-system` Changes

This implementation also updates `../payment-system` so clip admin can manage `bunny_stream_preview_id`.

- `db.py` adds the schema column.
- `app.py` accepts/saves the field.
- clip admin UI loads preview videos from Bunny collection `281a5ee9-db7e-41a2-bce0-97e16a7fd7b9`.
- add/edit forms try to auto-match preview videos by filename and still allow manual override.

## Notes

- The data mapping is centralized in `apps/api/app/db/clip_mapping.py`.
- Alembic is included for future app-owned migrations, but this service treats the existing `clips` table as externally managed.
