from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class PaymentSystemError(Exception):
    """Wrapper for upstream payment-system errors."""


def _api_base_url() -> str:
    return settings.payment_system_api_url.strip().rstrip("/")


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    if settings.payment_system_api_token:
        headers["Authorization"] = f"Bearer {settings.payment_system_api_token}"
    return headers


def invoice_options(
    *,
    items: list[dict[str, Any]] | None = None,
    order_id: int | None = None,
    flow_id: str | None = None,
) -> dict[str, Any]:
    base = _api_base_url()
    if not base:
        raise PaymentSystemError("PAYMENT_SYSTEM_API_URL is not configured")
    payload: dict[str, Any] = {}
    if order_id is not None:
        payload["order_id"] = order_id
    if items is not None:
        payload["items"] = items
    if flow_id:
        payload["flow_id"] = flow_id
    if not payload.get("items") and payload.get("order_id") is None:
        raise PaymentSystemError("order_id or items is required")
    try:
        response = httpx.post(
            f"{base}/api/invoices/options",
            json=payload,
            headers=_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        logger.warning("Invoice options request failed: %s", exc)
        raise PaymentSystemError("unable to load payment options") from exc


def create_order(
    *,
    items: list[dict[str, Any]],
    chat_id: int | None = None,
    application_id: str | None = None,
    flow_id: str | None = None,
) -> dict[str, Any]:
    base = _api_base_url()
    if not base:
        raise PaymentSystemError("PAYMENT_SYSTEM_API_URL is not configured")
    payload: dict[str, Any] = {
        "items": items,
        "chat_id": chat_id,
        "application_id": application_id,
        "flow_id": flow_id,
    }
    try:
        response = httpx.post(
            f"{base}/api/orders",
            json=payload,
            headers=_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        data = response.json()
        item = data.get("item") if isinstance(data, dict) else None
        if not isinstance(item, dict):
            raise PaymentSystemError("order payload missing")
        return item
    except httpx.HTTPError as exc:
        logger.warning("Create order failed: %s", exc)
        raise PaymentSystemError("unable to create order") from exc


def create_invoice(
    *,
    order_id: int,
    payment_method: str,
    chat_id: int | None = None,
    application_id: str | None = None,
    flow_id: str | None = None,
) -> dict[str, Any]:
    base = _api_base_url()
    if not base:
        raise PaymentSystemError("PAYMENT_SYSTEM_API_URL is not configured")
    payload: dict[str, Any] = {
        "order_id": order_id,
        "payment_method": payment_method,
        "chat_id": chat_id,
        "application_id": application_id,
        "flow_id": flow_id,
    }
    try:
        response = httpx.post(
            f"{base}/api/invoices",
            json=payload,
            headers=_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        logger.warning("Create invoice failed: %s", exc)
        raise PaymentSystemError("unable to create invoice") from exc


def get_invoice(invoice_id: str) -> dict[str, Any]:
    base = _api_base_url()
    if not base:
        raise PaymentSystemError("PAYMENT_SYSTEM_API_URL is not configured")
    try:
        response = httpx.get(
            f"{base}/api/invoices/{invoice_id}",
            headers=_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        logger.warning("Get invoice failed: %s", exc)
        raise PaymentSystemError("unable to load invoice") from exc
