from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.api.deps import get_session
from app.schemas.payments import (
    CheckoutOptionsRequest,
    CheckoutOptionsResponse,
    CheckoutRequest,
    CheckoutResponse,
    InvoiceStatusResponse,
    PaymentMethod,
)
from app.services import payment_gateway

router = APIRouter(tags=["payments"])
logger = logging.getLogger(__name__)

INVOICE_CACHE: dict[str, InvoiceStatusResponse] = {}


def _normalize_methods(raw: list[dict[str, Any]] | None) -> list[PaymentMethod]:
    methods: list[PaymentMethod] = []
    for item in raw or []:
        try:
            methods.append(
                PaymentMethod(
                    id=item.get("id"),
                    paymentMethod=str(item.get("payment_method") or "").strip() or "unknown",
                    label=str(item.get("payment_method") or "").strip().capitalize() or "Pay",
                    requiresCode=bool(item.get("requires_code")),
                    priceCents=item.get("price_cents"),
                    details=item.get("method_details") if isinstance(item.get("method_details"), dict) else None,
                )
            )
        except Exception:
            continue
    return methods


def _invoice_urls(data: dict[str, Any] | None) -> tuple[str | None, str | None]:
    if not isinstance(data, dict):
        return None, None
    invoice_url = (data.get("invoice_url") or data.get("provider_invoice_url") or "").strip() or None
    provider_url = (data.get("provider_invoice_url") or "").strip() or None
    return invoice_url, provider_url


def _normalize_status(value: str | None) -> str:
    raw = (value or "").strip().lower()
    if raw == "paid":
        return "paid"
    if raw in {"cancelled", "canceled"}:
        return "cancelled"
    return "pending"


@router.post("/payments/checkout-options", response_model=CheckoutOptionsResponse)
def checkout_options(payload: CheckoutOptionsRequest, session: dict = Depends(get_session)) -> CheckoutOptionsResponse:
    flow_id = session.get("start_param") or session.get("flow_id")
    item: dict[str, Any] = {"product_id": payload.product_id, "quantity": max(1, payload.quantity)}
    if payload.unit_price_cents is not None:
        item["unit_price_cents"] = int(payload.unit_price_cents)
    if payload.clip_id:
        item["clip_id"] = payload.clip_id
    if payload.template_values:
        item["template_values"] = payload.template_values
    if payload.order_values:
        item["order_values"] = payload.order_values
    if payload.meta_data:
        item["meta_data"] = payload.meta_data
    items = [item]
    try:
        options = payment_gateway.invoice_options(items=items, flow_id=flow_id)
    except payment_gateway.PaymentSystemError as exc:
        logger.warning("checkout options error: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="payment options unavailable") from exc

    methods = _normalize_methods(options.get("payment_methods") if isinstance(options, dict) else None)
    totals = options.get("totals") if isinstance(options, dict) else None
    return CheckoutOptionsResponse(flowId=flow_id, paymentMethods=methods, totals=totals)


@router.post("/payments/checkout", response_model=CheckoutResponse)
def checkout(payload: CheckoutRequest, session: dict = Depends(get_session)) -> CheckoutResponse:
    flow_id = session.get("start_param") or session.get("flow_id")
    chat_id = session.get("telegram_user_id")
    application_id = session.get("start_param")

    if not chat_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    item: dict[str, Any] = {"product_id": payload.product_id, "quantity": max(1, payload.quantity)}
    if payload.unit_price_cents is not None:
        item["unit_price_cents"] = int(payload.unit_price_cents)
    if payload.clip_id:
        item["clip_id"] = payload.clip_id
    if payload.template_values:
        item["template_values"] = payload.template_values
    if payload.order_values:
        item["order_values"] = payload.order_values
    if payload.meta_data:
        item["meta_data"] = payload.meta_data
    items = [item]
    try:
        order = payment_gateway.create_order(
            items=items,
            chat_id=int(chat_id),
            application_id=application_id,
            flow_id=flow_id,
        )
        invoice = payment_gateway.create_invoice(
            order_id=int(order.get("id")),
            payment_method=payload.payment_method,
            chat_id=int(chat_id),
            application_id=application_id,
            flow_id=flow_id,
        )
    except payment_gateway.PaymentSystemError as exc:
        logger.warning("checkout error: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="checkout unavailable") from exc

    invoice_url, provider_url = _invoice_urls(invoice)
    invoice_payload = invoice.get("invoice") if isinstance(invoice, dict) else None
    invoice_id_value = None
    if isinstance(invoice_payload, dict):
        invoice_id_value = invoice_payload.get("invoice_id") or invoice_payload.get("id")
    if not invoice_id_value and isinstance(invoice, dict):
        invoice_id_value = invoice.get("invoice_id") or invoice.get("invoiceId") or invoice.get("id")

    return CheckoutResponse(
        orderId=int(order.get("id")),
        invoiceId=str(invoice_id_value or ""),
        paymentUrl=invoice_url,
        providerInvoiceUrl=provider_url,
        paymentMethod=payload.payment_method,
        totals=None,
    )


@router.get("/payments/invoices/{invoice_id}", response_model=InvoiceStatusResponse)
def invoice_status(invoice_id: str) -> InvoiceStatusResponse:
    cached = INVOICE_CACHE.get(invoice_id)
    if cached:
        return cached

    try:
        invoice = payment_gateway.get_invoice(invoice_id)
    except payment_gateway.PaymentSystemError as exc:
        logger.warning("invoice status error: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="invoice unavailable") from exc

    invoice_url, provider_url = _invoice_urls(invoice)
    status_value = invoice.get("status") if isinstance(invoice, dict) else None
    result = InvoiceStatusResponse(
        invoiceId=invoice_id,
        status=_normalize_status(status_value),
        paymentUrl=invoice_url,
        providerInvoiceUrl=provider_url,
    )
    INVOICE_CACHE[invoice_id] = result
    return result


@router.post("/payments/webhook")
def payment_webhook(
    payload: dict,
    x_internal_token: str | None = Header(default=None, alias="X-Internal-Token"),
) -> dict:
    if not payment_gateway.settings.payment_system_api_token:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="token not configured")
    if not x_internal_token or x_internal_token.strip() != payment_gateway.settings.payment_system_api_token.strip():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    # On webhook, immediately refresh invoice status to shorten client wait.
    invoice_id = str(payload.get("invoice_id") or payload.get("invoiceId") or payload.get("id") or "").strip()
    if not invoice_id:
        logger.info("payment webhook received without invoice_id: keys=%s", list(payload.keys()))
        return {"ok": True, "refreshed": False}
    try:
        invoice = payment_gateway.get_invoice(invoice_id)
        invoice_url, provider_url = _invoice_urls(invoice)
        status_value = invoice.get("status") if isinstance(invoice, dict) else None
        result = InvoiceStatusResponse(
            invoiceId=invoice_id,
            status=_normalize_status(status_value),
            paymentUrl=invoice_url,
            providerInvoiceUrl=provider_url,
        )
        INVOICE_CACHE[invoice_id] = result
        logger.info("payment webhook refreshed invoice %s -> %s", invoice_id, result.status)
        return {"ok": True, "refreshed": True, "status": result.status}
    except payment_gateway.PaymentSystemError as exc:
        logger.warning("payment webhook refresh failed for %s: %s", invoice_id, exc)
        return {"ok": False, "refreshed": False}
