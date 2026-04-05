# Mistress BJQueen Multi Mini App

Telegram Mini App suite served from a single Railway service. The frontend is one React/Vite SPA mounted by path, and the backend is one FastAPI service that validates Telegram init data, serves both Mini Apps, and reads the existing MySQL tables.

## Mini Apps

- `/`: chooser page for all available Mini Apps
- `/clips`: Clip Store Mini App
- `/clips/:clipId`: clip detail sheet route
- `/tasks`: Custom Obedience Tasks sales Mini App
- `/tasks/:tierId`: task package detail sheet route

## Structure

- `apps/web`: shared Telegram Mini App frontend
- `apps/api`: shared FastAPI backend
- one Railway service, one repo, one domain, multiple Mini Apps by path

## Features

- Shared Telegram auth and signed session flow
- Shared dark/plum design system across both Mini Apps
- Shared Telegram/iPhone-safe bot handoff helper
- Clip Store preserved under `/clips`
- Custom Obedience Tasks sales page added under `/tasks`
- Railway-friendly single-service deployment

## API

### Existing clip endpoints

- `GET /api/health`
- `POST /api/auth/telegram`
- `GET /api/clips`
- `GET /api/clips/new`
- `GET /api/clips/top-sellers`
- `GET /api/clips/{id}`

### New task-tier endpoints

- `GET /api/tiers`
- `GET /api/tiers/featured`
- `GET /api/tiers/{id}`

The task endpoints read from `premium_tiers`, with field mapping centralized in [`apps/api/app/services/tier_service.py`](/Users/guywatson/Projects/clip-search-mini-app/apps/api/app/services/tier_service.py) and [`apps/api/app/db/tier_mapping.py`](/Users/guywatson/Projects/clip-search-mini-app/apps/api/app/db/tier_mapping.py). If a tier row does not store its own price, the API resolves the linked payment product by `product_id` or `payment_product_id` using `PAYMENT_SYSTEM_API_URL` and `PAYMENT_SYSTEM_API_TOKEN`.

## Environment

Copy [.env.example](/Users/guywatson/Projects/clip-search-mini-app/.env.example) and set real values.

### Backend env vars

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `8000` | Port FastAPI binds to. Railway usually injects this. |
| `APP_ENV` | Yes | `development` or `production` | Enables dev-only browser fallback behavior locally. |
| `DATABASE_URL` | Yes | `mysql+pymysql://user:password@host:3306/database` | SQLAlchemy connection string for the shared MySQL database. |
| `TELEGRAM_BOT_TOKEN` | Yes | `123456:ABC...` | Validates Telegram Mini App `initData` server-side. |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Public frontend origin used for cookie/CORS configuration. |
| `SESSION_SECRET` | Yes | `long-random-secret` | Signs the Telegram session cookie. |
| `CORS_ALLOWED_ORIGINS` | Yes | `http://localhost:5173,https://mini.example.com` | Comma-separated allowed origins. |
| `BOT_USERNAME` | Yes | `mistressbjqueenbot` | Bot username used to build all bot handoff deep links. |
| `CMS_API_URL` | Tracking only | `https://telegram-cms.mistressbjqueen.com` | Base URL for the CMS service that receives internal mini-app attribution events. |
| `CMS_INTERNAL_TASK_TOKEN` | Tracking only | `change-me` | Shared secret sent as `X-Internal-Token` when the mini-app API relays tracked `startapp` opens to the CMS. |
| `CMS_TRACKING_TIMEOUT_SECONDS` | No | `4` | Timeout for the CMS mini-app tracking relay request. |
| `FEATURED_TIER_PRODUCT_IDS` | No | `26,23,21` | Manual ordered list of featured `product_id` values for `/tasks`. Leave empty to hide the featured task carousel. |
| `PAYMENT_SYSTEM_API_URL` | Tasks prices only | `https://payments.example.com` | Base URL for the payment-system API used to resolve package prices from `product_id`. |
| `PAYMENT_SYSTEM_API_TOKEN` | Tasks prices only | `change-me` | Bearer token for the payment-system API. |
| `PAYMENT_SYSTEM_TIMEOUT_SECONDS` | No | `4` | Timeout when resolving payment product prices. |
| `BUNNY_STREAM_LIBRARY_ID` | Yes for `/clips` previews | `123456` | Bunny Stream library ID for clip previews. |
| `BUNNY_STREAM_API_KEY` | Yes for `/clips` previews | `bunny-stream-api-key` | Backend-only Bunny metadata key. |
| `BUNNY_STREAM_CDN_HOST` | Yes for `/clips` previews | `https://vz-yourpullzone.b-cdn.net` | Bunny CDN host used to build safe preview asset URLs. |
| `BUNNY_STREAM_EMBED_TOKEN_KEY` | Yes for `/clips` previews | `embed-token-key` | Bunny embed token key for preview player URLs. |
| `BUNNY_PREVIEW_COLLECTION_ID` | No | `281a5ee9-db7e-41a2-bce0-97e16a7fd7b9` | Upstream preview collection ID used by clip admin tooling. |

### Frontend env vars

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | `/api` | API base URL used by the frontend. |
| `VITE_APP_NAME` | No | `Mistress BJQueen Mini Apps` | Display name for browser metadata and shared app labeling. |

## Local development

### API

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r apps/api/requirements.txt
uvicorn app.main:app --app-dir apps/api --reload --port 8000
```

### Web

```bash
corepack enable
pnpm install
pnpm --dir apps/web dev
```

Then open:

- [http://localhost:5173/](http://localhost:5173/) for the chooser page
- [http://localhost:5173/clips](http://localhost:5173/clips) for Clip Store
- [http://localhost:5173/tasks](http://localhost:5173/tasks) for Custom Obedience Tasks

## Telegram setup

You can point different Telegram web app buttons or links at different paths on the same domain.

Examples:

- `https://your-domain.example.com/clips`
- `https://your-domain.example.com/tasks`

Both Mini Apps share the same Telegram auth/session logic.

If Telegram launches the Mini App with a tracked `startapp` payload shaped like `l_<base36_id>`, the backend relays that open to the CMS after Telegram auth succeeds. This keeps attribution server-side and does not affect existing non-tracked Mini App launches.

## Bot handoff

All purchases still happen in the bot.

### Clip Store deep links

- `https://t.me/<BOT_USERNAME>?start=stream_<CLIP_ID>`
- `https://t.me/<BOT_USERNAME>?start=download_<CLIP_ID>`

### Task package deep links

- `https://t.me/<BOT_USERNAME>?start=buy_<PRODUCT_ID>`

Shared bot-link generation lives in [`apps/api/app/utils/bot_links.py`](/Users/guywatson/Projects/clip-search-mini-app/apps/api/app/utils/bot_links.py), and shared frontend Telegram handoff lives in [`apps/web/src/app/telegram.ts`](/Users/guywatson/Projects/clip-search-mini-app/apps/web/src/app/telegram.ts).

## Railway deployment

This repo stays a single Railway service.

1. Deploy the repo as one service.
2. Set the environment variables from `.env.example`.
3. Use one public HTTPS domain.
4. Open different Mini Apps by path, for example `/clips` and `/tasks`.
5. Point Railway health checks to `/api/health`.

This gives you one service, one origin, and multiple Telegram Mini Apps by path.

## Notes

- Clip Store behavior remains under `/clips`.
- Custom Obedience Tasks uses the `premium_tiers` table.
- Tracked `startapp` payloads are forwarded to the CMS only when `CMS_API_URL` and `CMS_INTERNAL_TASK_TOKEN` are configured.
- If `FEATURED_TIER_PRODUCT_IDS` is empty, the featured task carousel is hidden.
- If Bunny preview settings are missing, `/clips` still works but preview assets fall back gracefully.
