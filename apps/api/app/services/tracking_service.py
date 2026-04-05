from __future__ import annotations

import logging
import re

import httpx

from app.core.config import get_settings
from app.core.telegram import TelegramUser

logger = logging.getLogger(__name__)
settings = get_settings()
TRACKED_START_PARAM_PATTERN = re.compile(r"^l_[0-9a-z]+$")


def is_tracked_start_param(start_param: str | None) -> bool:
    normalized = (start_param or "").strip()
    return bool(TRACKED_START_PARAM_PATTERN.fullmatch(normalized))


def notify_miniapp_open(start_param: str | None, user: TelegramUser) -> bool:
    normalized_start_param = (start_param or "").strip()
    cms_api_url = settings.normalized_cms_api_url
    cms_internal_task_token = settings.cms_internal_task_token.strip()

    if not is_tracked_start_param(normalized_start_param):
        return False
    if not cms_api_url or not cms_internal_task_token:
        return False

    try:
        response = httpx.post(
            f"{cms_api_url}/internal/tracking/miniapp-open",
            json={
                "telegram_user_id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "deep_link_param": normalized_start_param,
                "start_param": normalized_start_param,
            },
            headers={"X-Internal-Token": cms_internal_task_token},
            timeout=settings.cms_tracking_timeout_seconds,
        )
        response.raise_for_status()
        return True
    except httpx.HTTPError as exc:
        logger.warning(
            "Failed to notify CMS about tracked mini-app open for user_id=%s start_param=%s: %s",
            user.id,
            normalized_start_param,
            exc,
        )
        return False
