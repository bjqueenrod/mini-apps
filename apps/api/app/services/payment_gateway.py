from __future__ import annotations

import json
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


def _response_error_message(response: httpx.Response, fallback: str) -> str:
    try:
        payload = response.json()
    except Exception:
        payload = None

    if isinstance(payload, dict):
        for key in ("detail", "error", "message"):
            value = payload.get(key)
            if value:
                return str(value)

    text = (response.text or "").strip()
    if text:
      try:
            parsed = json.loads(text)
      except Exception:
            return text
      if isinstance(parsed, dict):
            for key in ("detail", "error", "message"):
                value = parsed.get(key)
                if value:
                    return str(value)
      return text

    return fallback


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
    except httpx.HTTPStatusError as exc:
        logger.warning("Invoice options request failed: %s", exc)
        message = _response_error_message(exc.response, "unable to load payment options")
        raise PaymentSystemError(message) from exc
    except httpx.HTTPError as exc:
        logger.warning("Invoice options request failed: %s", exc)
        raise PaymentSystemError("unable to load payment options") from exc


def create_order(
    *,
    items: list[dict[str, Any]],
    chat_id: int | None = None,
    username: str | None = None,
    first_name: str | None = None,
    application_id: str | None = None,
    flow_id: str | None = None,
    clip_mode: str | None = None,
) -> dict[str, Any]:
    base = _api_base_url()
    if not base:
        raise PaymentSystemError("PAYMENT_SYSTEM_API_URL is not configured")
    # Clip-specific order endpoint (required by payment-system for clip sales)
    clip_id = None
    if len(items) == 1:
        clip_id = items[0].get("clip_id") or items[0].get("clipId")

    if clip_id and clip_mode:
        payload: dict[str, Any] = {
            "mode": clip_mode,
            "chat_id": chat_id,
            "username": username,
            "first_name": first_name,
            "application_id": application_id,
            "flow_id": flow_id,
        }
        try:
            response = httpx.post(
                f"{base}/api/clips/{clip_id}/order",
                json=payload,
                headers=_headers(),
                timeout=settings.payment_system_timeout_seconds,
            )
            response.raise_for_status()
            data = response.json()
            item = data.get("item") if isinstance(data, dict) else None
            if not isinstance(item, dict):
                raise PaymentSystemError("clip order payload missing")
            return item
        except httpx.HTTPStatusError as exc:
            logger.warning("Create clip order failed: %s", exc)
            message = _response_error_message(exc.response, "unable to create clip order")
            raise PaymentSystemError(message) from exc
        except httpx.HTTPError as exc:
            logger.warning("Create clip order failed: %s", exc)
            raise PaymentSystemError("unable to create clip order") from exc

    payload: dict[str, Any] = {
        "items": items,
        "chat_id": chat_id,
        "username": username,
        "first_name": first_name,
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
    except httpx.HTTPStatusError as exc:
        logger.warning("Create order failed: %s", exc)
        message = _response_error_message(exc.response, "unable to create order")
        raise PaymentSystemError(message) from exc
    except httpx.HTTPError as exc:
        logger.warning("Create order failed: %s", exc)
        raise PaymentSystemError("unable to create order") from exc


def create_invoice(
    *,
    order_id: int,
    payment_method: str,
    chat_id: int | None = None,
    username: str | None = None,
    first_name: str | None = None,
    application_id: str | None = None,
    flow_id: str | None = None,
    code: str | None = None,
) -> dict[str, Any]:
    base = _api_base_url()
    if not base:
        raise PaymentSystemError("PAYMENT_SYSTEM_API_URL is not configured")
    payload: dict[str, Any] = {
        "order_id": order_id,
        "payment_method": payment_method,
        "chat_id": chat_id,
        "username": username,
        "first_name": first_name,
        "application_id": application_id,
        "flow_id": flow_id,
    }
    if code:
        payload["code"] = code
    try:
        response = httpx.post(
            f"{base}/api/invoices",
            json=payload,
            headers=_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        logger.warning("Create invoice failed: %s", exc)
        message = _response_error_message(exc.response, "unable to create invoice")
        raise PaymentSystemError(message) from exc
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
    except httpx.HTTPStatusError as exc:
        logger.warning("Get invoice failed: %s", exc)
        message = _response_error_message(exc.response, "unable to load invoice")
        raise PaymentSystemError(message) from exc
    except httpx.HTTPError as exc:
        logger.warning("Get invoice failed: %s", exc)
        raise PaymentSystemError("unable to load invoice") from exc
