FROM node:22-bookworm-slim AS web-builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter ./apps/web... --frozen-lockfile=false
COPY apps/web ./apps/web
# GA4 measurement ID is public (client-side); override at build time if needed.
ARG VITE_GA_MEASUREMENT_ID=G-1KNSC32BX5
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
# Vite inlines VITE_* at `vite build` — runtime container env does not change the bundle.
# Pass this at image build time (same as VITE_GA_MEASUREMENT_ID).
ARG VITE_CLIP_LIBRARY_CHANNEL_URL=
ENV VITE_CLIP_LIBRARY_CHANNEL_URL=$VITE_CLIP_LIBRARY_CHANNEL_URL
RUN pnpm --dir apps/web build

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api ./apps/api
COPY --from=web-builder /app/apps/web/dist ./apps/web/dist
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port ${PORT:-8000}"]
