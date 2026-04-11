from __future__ import annotations

import logging
import re
import time

import httpx

from app.core.config import get_settings
from app.core.telegram import TelegramUser

logger = logging.getLogger(__name__)

# Suppress duplicate CMS miniapp-open posts when the client calls track-open before /auth/telegram.
_MINIAPP_NOTIFY_DEDUPE_SECONDS = 60.0
_recent_successful_miniapp_notify: dict[tuple[int, str], float] = {}


def clear_miniapp_open_notify_dedupe() -> None:
    """Reset dedupe state (for tests)."""
    _recent_successful_miniapp_notify.clear()


def _prune_miniapp_notify_dedupe(now: float) -> None:
    if len(_recent_successful_miniapp_notify) <= 512:
        return
    cutoff = now - _MINIAPP_NOTIFY_DEDUPE_SECONDS
    dead = [k for k, t in _recent_successful_miniapp_notify.items() if t < cutoff]
    for key in dead[:256]:
        _recent_successful_miniapp_notify.pop(key, None)


# Match plain l_<id> and mini-app startapp prefixes (clips_BJQ…__l_<id>, keyholding__l_<id>, …).
TRACKED_START_PARAM_PATTERN = re.compile(
    r"^(?:"
    r"l_[0-9a-z]+(?:__[A-Za-z0-9_-]{1,64})?"
    r"|"
    r"[A-Za-z0-9_]{1,64}__l_[0-9a-z]+(?:__[A-Za-z0-9_-]{1,64})?"
    r")$"
)


def is_tracked_start_param(start_param: str | None) -> bool:
    normalized = (start_param or "").strip()
    return bool(TRACKED_START_PARAM_PATTERN.fullmatch(normalized))


def resolve_effective_start_param(
    signed_start_param: str | None,
    client_start_param: str | None,
) -> str | None:
    """Pick the start_param used for sessions and CMS open tracking.

    Signed initData is authoritative when it carries a full tracked value. Some Telegram
    clients omit or shorten start_param in initData while the same launch still sends
    the full value via tgWebAppStartParam on the client — prefer the client copy when
    the signed value is present but not a tracked deep link and the client value is.
    """
    signed = (signed_start_param or "").strip() or None
    client = (client_start_param or "").strip() or None
    if not signed:
        return client
    if not client:
        return signed
    if signed == client:
        return signed
    signed_tracked = is_tracked_start_param(signed)
    client_tracked = is_tracked_start_param(client)
    if client_tracked and not signed_tracked:
        return client
    if signed_tracked and not client_tracked:
        return signed
    return signed


def notify_miniapp_open(start_param: str | None, user: TelegramUser) -> bool:
    cfg = get_settings()
    normalized_start_param = (start_param or "").strip()
    cms_api_url = cfg.normalized_cms_api_url
    cms_api_token = cfg.cms_api_token.strip()

    if not is_tracked_start_param(normalized_start_param):
        return False
    if not cms_api_url or not cms_api_token:
        logger.warning(
            "Tracked mini-app open not sent: CMS_API_URL or CMS_API_TOKEN is empty (user_id=%s start_param=%s)",
            user.id,
            normalized_start_param,
        )
        return False

    dedupe_key = (int(user.id), normalized_start_param)
    now = time.monotonic()
    prev = _recent_successful_miniapp_notify.get(dedupe_key)
    if prev is not None and (now - prev) < _MINIAPP_NOTIFY_DEDUPE_SECONDS:
        return True

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
            timeout=cfg.cms_tracking_timeout_seconds,
            follow_redirects=True,
        )
        response.raise_for_status()
        _recent_successful_miniapp_notify[dedupe_key] = time.monotonic()
        _prune_miniapp_notify_dedupe(_recent_successful_miniapp_notify[dedupe_key])
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
