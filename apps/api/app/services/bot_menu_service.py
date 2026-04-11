from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _bot_api_base_url() -> str:
    return settings.bot_api_url.strip().rstrip("/")


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    if settings.internal_task_token:
        headers["X-Internal-Token"] = settings.internal_task_token
    return headers


def refresh_currency_menu(*, telegram_user_id: int, currency: str) -> None:
    base = _bot_api_base_url()
    token = settings.internal_task_token.strip()
    if not base or not token:
        return
    payload: dict[str, Any] = {
        "telegram_user_id": int(telegram_user_id),
        "currency": str(currency or "").strip().upper(),
    }
    try:
        response = httpx.post(
            f"{base}/api/telegram/menu/currency",
            json=payload,
            headers=_headers(),
            timeout=settings.bot_api_timeout_seconds,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "Failed to refresh bot currency menu user_id=%s status=%s: %s",
            telegram_user_id,
            getattr(exc.response, "status_code", None),
            exc,
        )
    except httpx.HTTPError as exc:
        logger.warning("Failed to refresh bot currency menu user_id=%s: %s", telegram_user_id, exc)
