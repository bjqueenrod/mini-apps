from __future__ import annotations

from urllib.parse import quote

from app.core.config import get_settings


def _bot_username() -> str:
    settings = get_settings()
    return settings.bot_username.strip().lstrip('@') or 'mistressbjqueenbot'


def build_bot_start_url(start_param: str) -> str:
    return f"https://t.me/{_bot_username()}?start={quote(start_param, safe='_-')}"


def build_clip_stream_url(clip_id: str) -> str:
    return build_bot_start_url(f"stream_{clip_id}")


def build_clip_download_url(clip_id: str) -> str:
    return build_bot_start_url(f"download_{clip_id}")


def build_tier_buy_url(product_id: str) -> str:
    return build_bot_start_url(f"buy_{product_id}")
