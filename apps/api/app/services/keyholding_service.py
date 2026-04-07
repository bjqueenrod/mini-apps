from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import get_settings


def _client_headers(token: str | None) -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}".strip()
    return headers


def _validate_config(base_url: str | None, token: str | None) -> None:
    if not base_url or not base_url.strip():
        raise HTTPException(status_code=500, detail="Keyholding API base URL not configured")
    if not token or not token.strip():
        raise HTTPException(status_code=500, detail="Keyholding API token not configured")


def _get(endpoint: str) -> dict[str, Any]:
    settings = get_settings()
    base_url = settings.keyholding_api_base_url.strip().rstrip("/") if settings.keyholding_api_base_url else ""
    token = settings.keyholding_api_token.strip() if settings.keyholding_api_token else ""
    _validate_config(base_url, token)
    url = f"{base_url}{endpoint}"
    try:
        with httpx.Client(timeout=8.0) as client:
            response = client.get(url, headers=_client_headers(token))
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        text = exc.response.text
        status = exc.response.status_code
        raise HTTPException(status_code=status, detail=f"Upstream keyholding API error ({status}): {text}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Unable to reach keyholding API: {exc}") from exc

    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail="Invalid keyholding API response")
    if data.get("ok") is False:
        raise HTTPException(status_code=502, detail=str(data.get("error") or "Keyholding API returned error"))
    return data


def fetch_keyholding_tiers() -> dict[str, Any]:
    data = _get("/api/keyholding/tiers")
    items = data.get("tiers") or data.get("items") or []
    count = data.get("count")
    parsed_items = []
    for item in items:
        if not isinstance(item, dict):
            continue
        price_value = item.get("price_value") or item.get("priceValue")
        parsed_items.append(
            {
                "id": str(item.get("id") or item.get("slug") or "tier"),
                "slug": item.get("slug") or None,
                "name": item.get("name") or "Tier",
                "desc": item.get("desc") or None,
                "duration": item.get("duration") or None,
                "idealFor": item.get("ideal_for") or item.get("idealFor") or None,
                "includes": item.get("includes") or [],
                "price": price_value if isinstance(price_value, (int, float)) else None,
                "priceLabel": item.get("price_label") or item.get("priceLabel") or item.get("price") or None,
                "pricePerWeek": item.get("price_per_week") or item.get("pricePerWeek") or None,
                "priceValue": price_value if isinstance(price_value, (int, float)) else None,
                "paymentProductId": item.get("payment_product_id") or item.get("paymentProductId") or None,
                "badge": item.get("badge") or item.get("ideal_for") or item.get("idealFor") or None,
                "durationWeeksOptions": item.get("duration_weeks_options")
                or item.get("durationWeeksOptions")
                or [],
                "maxQuantity": item.get("max_quantity") or item.get("maxQuantity") or None,
            }
        )

    return {
        "items": parsed_items,
        "total": count if isinstance(count, int) else len(parsed_items),
    }


def fetch_keyholding_options() -> dict[str, Any]:
    data = _get("/api/keyholding/options")
    items = data.get("options") or data.get("items") or []
    count = data.get("count")
    return {
        "items": [
            {
                "id": str(item.get("id") or item.get("slug") or "option"),
                "slug": item.get("slug") or "",
                "label": item.get("label") or "Option",
                "tooltip": item.get("tooltip") or None,
                "availabilityType": item.get("availability_type") or item.get("availabilityType") or None,
                "availabilityTiers": item.get("availability_tiers") or item.get("availabilityTiers") or [],
                "requiresLockboxPhoto": bool(item.get("requires_lockbox_photo") or item.get("requiresLockboxPhoto")),
                "priceLabel": item.get("price_label") or item.get("priceLabel") or None,
                "priceCents": item.get("price_cents") or item.get("priceCents") or None,
                "paymentProductId": item.get("payment_product_id") or item.get("paymentProductId") or None,
                "order": item.get("order"),
            }
            for item in items
            if isinstance(item, dict)
        ],
        "total": count if isinstance(count, int) else len(items),
    }
