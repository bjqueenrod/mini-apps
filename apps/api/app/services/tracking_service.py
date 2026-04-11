from __future__ import annotations

import logging
import re

import httpx

from app.core.config import get_settings
from app.core.telegram import TelegramUser

logger = logging.getLogger(__name__)
settings = get_settings()
TRACKED_START_PARAM_PATTERN = re.compile(
    r"^(?:"
    r"l_[0-9a-z]+(?:__[A-Za-z0-9_-]{1,64})?"
    r"|"
    r"clips(?:_[A-Za-z0-9_-]{1,64})?__l_[0-9a-z]+(?:__[A-Za-z0-9_-]{1,64})?"
    r")$"
)


def is_tracked_start_param(start_param: str | None) -> bool:
    normalized = (start_param or "").strip()
    return bool(TRACKED_START_PARAM_PATTERN.fullmatch(normalized))


def notify_miniapp_open(start_param: str | None, user: TelegramUser) -> bool:
    normalized_start_param = (start_param or "").strip()
    cms_api_url = settings.normalized_cms_api_url
    cms_api_token = settings.cms_api_token.strip()

    if not is_tracked_start_param(normalized_start_param):
        return False
    if not cms_api_url or not cms_api_token:
        logger.warning(
            "Tracked mini-app open not sent: CMS_API_URL or CMS_API_TOKEN is empty (user_id=%s start_param=%s)",
            user.id,
            normalized_start_param,
        )
        return False

    url = f"{cms_api_url}/internal/tracking/miniapp-open"
    try:
        response = httpx.post(
            url,
            json={
                "telegram_user_id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "deep_link_param": normalized_start_param,
                "start_param": normalized_start_param,
            },
            headers={"X-Internal-Token": cms_api_token},
            timeout=settings.cms_tracking_timeout_seconds,
            follow_redirects=True,
        )
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as exc:
        snippet = (exc.response.text or "")[:800].replace("\n", " ")
        logger.warning(
            "CMS miniapp-open HTTP error user_id=%s start_param=%s url=%s status=%s body=%s",
            user.id,
            normalized_start_param,
            url,
            exc.response.status_code,
            snippet,
        )
        return False
    except httpx.HTTPError as exc:
        logger.warning(
            "Failed to notify CMS about tracked mini-app open for user_id=%s start_param=%s url=%s: %s",
            user.id,
            normalized_start_param,
            url,
            exc,
        )
        return False
