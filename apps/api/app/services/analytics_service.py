from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.schemas.analytics import MiniAppAnalyticsEventRequest

logger = logging.getLogger(__name__)
settings = get_settings()


def _build_dedupe_key(event_name: str, telegram_user_id: int) -> str:
    return f"miniapp:{telegram_user_id}:{event_name}:{uuid4().hex}"


def forward_analytics_event(event: MiniAppAnalyticsEventRequest, session: dict) -> bool:
    cms_api_url = settings.normalized_cms_api_url
    cms_api_token = settings.cms_api_token.strip()
    telegram_user_id = int(session.get("telegram_user_id") or 0)

    if not cms_api_url or not cms_api_token or not telegram_user_id:
        return False

    occurred_at = event.occurred_at or datetime.now(timezone.utc)
    payload = {
        "events": [
            {
                "event_name": event.event_name,
                "occurred_at": occurred_at.isoformat(),
                "subject_telegram_user_id": telegram_user_id,
                "surface": "telegram_mini_app",
                "screen": event.screen,
                "flow_id": event.flow_id,
                "action_key": event.action_key,
                "dedupe_key": event.dedupe_key or _build_dedupe_key(event.event_name, telegram_user_id),
                "received_start_param": event.received_start_param,
                "properties": event.properties,
            }
        ]
    }

    try:
        response = httpx.post(
            f"{cms_api_url}/internal/analytics/events",
            json=payload,
            headers={"X-Internal-Token": cms_api_token},
            timeout=settings.cms_tracking_timeout_seconds,
        )
        response.raise_for_status()
        logger.debug(
            "Forwarded mini-app analytics event=%s telegram_user_id=%s screen=%s action_key=%s flow_id=%s",
            event.event_name,
            telegram_user_id,
            event.screen,
            event.action_key,
            event.flow_id,
        )
        return True
    except httpx.HTTPError as exc:
        logger.warning(
            "Failed to forward mini-app analytics event=%s telegram_user_id=%s: %s",
            event.event_name,
            telegram_user_id,
            exc,
        )
        return False
