from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(record)
    if 'active' in normalized:
        normalized['active'] = bool(normalized['active'])
    return normalized


def _request_headers() -> dict[str, str]:
    headers = {'Accept': 'application/json'}
    if settings.payment_system_api_token:
        headers['Authorization'] = f'Bearer {settings.payment_system_api_token}'
    return headers


def _request_url(path: str) -> str | None:
    api_url = settings.payment_system_api_url.strip().rstrip('/')
    if not api_url:
        return None
    return f'{api_url}{path}'


def _extract_item(payload: Any) -> dict[str, Any] | None:
    if not isinstance(payload, dict):
        return None

    item = payload.get('item')
    if isinstance(item, dict):
        return _normalize_record(item)

    if any(key in payload for key in ('pricing', 'price_pence', 'pricePence', 'price_label', 'priceLabel')):
        return _normalize_record(payload)

    return None


def list_payment_products(active_only: bool = False) -> list[dict[str, Any]]:
    request_url = _request_url('/api/payment-products')
    if request_url is None:
        return []

    try:
        response = httpx.get(
            request_url,
            headers=_request_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning('Unable to load payment products from payment system: %s', exc)
        return []

    items = payload.get('items')
    if not isinstance(items, list):
        return []

    normalized = [_normalize_record(item) for item in items if isinstance(item, dict)]
    if active_only:
        return [item for item in normalized if item.get('active')]
    return normalized


def get_payment_product(product_id: int | str) -> dict[str, Any] | None:
    try:
        product_id_int = int(product_id)
    except (TypeError, ValueError):
        return None

    request_url = _request_url(f'/api/payment-products/{product_id_int}')
    if request_url is None:
        return None

    try:
        response = httpx.get(
            request_url,
            headers=_request_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning('Unable to load payment product %s from payment system: %s', product_id_int, exc)
        return None

    return _extract_item(payload)


def get_clip_pricing(clip_id: str) -> dict[str, Any] | None:
    clip_id = str(clip_id).strip()
    if not clip_id:
        return None

    request_url = _request_url(f'/api/clips/{clip_id}/pricing')
    if request_url is None:
        return None

    try:
        response = httpx.get(
            request_url,
            headers=_request_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning('Unable to load clip pricing %s from payment system: %s', clip_id, exc)
        return None

    return _extract_item(payload)
