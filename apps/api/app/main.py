from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes.auth import router as auth_router
from app.api.routes.clips import router as clips_router
from app.api.routes.health import router as health_router
from app.api.routes.tiers import router as tiers_router
from app.core.config import get_settings
from app.core.logging import configure_logging

settings = get_settings()
configure_logging()
app = FastAPI(title='Clip Search Mini App API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins or ['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.include_router(health_router, prefix='/api')
app.include_router(auth_router, prefix='/api')
app.include_router(clips_router, prefix='/api')
app.include_router(tiers_router, prefix='/api')

DIST_DIR = Path(__file__).resolve().parents[3] / 'apps' / 'web' / 'dist'

if DIST_DIR.exists():
    assets_dir = DIST_DIR / 'assets'
    if assets_dir.exists():
        app.mount('/assets', StaticFiles(directory=assets_dir), name='assets')

    @app.get('/')
    def serve_root() -> FileResponse:
        return FileResponse(DIST_DIR / 'index.html')

    @app.get('/{full_path:path}')
    def spa_fallback(full_path: str) -> FileResponse:
        candidate = DIST_DIR / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / 'index.html')
