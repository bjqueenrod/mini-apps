from __future__ import annotations

from urllib.parse import quote, urlencode

from app.core.config import get_settings


def _bot_username() -> str:
    settings = get_settings()
    return settings.bot_username.strip().lstrip('@') or 'mistressbjqueenbot'


def build_bot_start_url(start_param: str) -> str:
    return f"https://t.me/{_bot_username()}?start={quote(start_param, safe='_-')}"


def _build_tracked_redirect_url(slug: str | None, payload: str | None = None) -> str | None:
    settings = get_settings()
    base_url = settings.normalized_tracking_links_base_url
    normalized_slug = (slug or '').strip().strip('/')
    if not base_url or not normalized_slug:
        return None
    url = f"{base_url}/r/{quote(normalized_slug, safe='')}"
    normalized_payload = (payload or '').strip()
    if not normalized_payload:
        return url
    return f"{url}?{urlencode({'payload': normalized_payload})}"


def build_clip_stream_url(clip_id: str) -> str:
    start_param = f"stream_{clip_id}"
    return _build_tracked_redirect_url(get_settings().tracking_clip_stream_slug, start_param) or build_bot_start_url(start_param)


def build_clip_download_url(clip_id: str) -> str:
    start_param = f"download_{clip_id}"
    return _build_tracked_redirect_url(get_settings().tracking_clip_download_slug, start_param) or build_bot_start_url(start_param)


def build_tier_buy_url(product_id: str) -> str:
    start_param = f"buy_{product_id}"
    return _build_tracked_redirect_url(get_settings().tracking_product_buy_slug, start_param) or build_bot_start_url(start_param)
