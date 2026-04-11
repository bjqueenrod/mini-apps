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


def _session_user_fields(session: dict) -> tuple[str | None, str | None]:
    if str(session.get("source") or "").strip().lower() != "telegram":
        return None, None
    username = str(session.get("username") or "").strip() or None
    first_name = str(session.get("first_name") or "").strip() or None
    return username, first_name


def _normalize_methods(raw: list[dict[str, Any]] | None) -> list[PaymentMethod]:
    methods: list[PaymentMethod] = []
    for item in raw or []:
        try:
            instruction_templates = item.get("instruction_templates")
            checkout_default = None
            if isinstance(instruction_templates, dict):
                checkout_default = str(instruction_templates.get("checkout_default") or "").strip() or None
            methods.append(
                PaymentMethod(
                    id=item.get("id"),
                    paymentMethod=str(item.get("payment_method") or "").strip() or "unknown",
                    label=str(item.get("payment_method") or "").strip().capitalize() or "Pay",
                    requiresCode=bool(item.get("requires_code")),
                    instructions=(item.get("instructions") or None),
                    tributeCode=(item.get("tribute_code") or item.get("tributeCode") or None),
                    instructionTemplates={"checkoutDefault": checkout_default} if checkout_default else None,
                    details=item.get("method_details") if isinstance(item.get("method_details"), dict) else None,
                    pricing=item.get("pricing") if isinstance(item.get("pricing"), dict) else None,
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
    if payload.mode:
        item["mode"] = payload.mode
    if payload.unit_price_pence is not None:
        item["unit_price_pence"] = int(payload.unit_price_pence)
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
        if payload.order_id:
            options = payment_gateway.invoice_options(order_id=int(payload.order_id), flow_id=flow_id)
        else:
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
    invoice_currency = (payload.currency or "").strip().upper()
    if invoice_currency not in {"GBP", "USD"}:
        invoice_currency = None

    if not chat_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    item: dict[str, Any] = {"product_id": payload.product_id, "quantity": max(1, payload.quantity)}
    if payload.mode:
        item["mode"] = payload.mode
    if payload.unit_price_pence is not None:
        item["unit_price_pence"] = int(payload.unit_price_pence)
    if payload.clip_id:
        item["clip_id"] = payload.clip_id
    if payload.template_values:
        item["template_values"] = payload.template_values
    if payload.order_values:
        item["order_values"] = payload.order_values
    if payload.meta_data:
        item["meta_data"] = payload.meta_data
    items = [item]
    order_id_value = int(payload.order_id) if payload.order_id else None
    selected_method: dict[str, Any] | None = None
    username, first_name = _session_user_fields(session)

    def _select_payment_method(options: dict[str, Any] | None) -> tuple[dict[str, Any] | None, str, bool]:
        selected: dict[str, Any] | None = None
        methods = options.get("payment_methods") if isinstance(options, dict) else None
        if isinstance(methods, list):
            for method in methods:
                if not isinstance(method, dict):
                    continue
                slug = (method.get("payment_method") or "").strip().lower()
                if slug == payload.payment_method:
                    if slug in {"paypal", "throne"}:
                        method["requires_code"] = True
                    elif slug == "crypto":
                        method["requires_code"] = False
                    selected = method
                    break
        code = (
            str(
                selected.get("code")
                or selected.get("tribute_code")
                or selected.get("tributeCode")
                or ""
            ).strip()
            if selected
            else ""
        )
        requires_code = bool(selected.get("requires_code")) if isinstance(selected, dict) else False
        return selected, code, requires_code

    try:
        if order_id_value:
            order = {"id": order_id_value}
        else:
            order = payment_gateway.create_order(
                items=items,
                chat_id=int(chat_id),
                username=username,
                first_name=first_name,
                application_id=application_id,
                flow_id=flow_id,
                clip_mode=payload.mode,
            )
        options = payment_gateway.invoice_options(order_id=int(order.get("id")), flow_id=flow_id)
        selected_method, code_value, requires_code = _select_payment_method(options)
        if requires_code and not code_value:
            raise payment_gateway.PaymentSystemError("missing payment code for selected method")
    except payment_gateway.PaymentSystemError as exc:
        logger.warning("checkout error: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc) or "checkout unavailable") from exc

    try:
        invoice = payment_gateway.create_invoice(
            order_id=int(order.get("id")),
            payment_method=payload.payment_method,
            chat_id=int(chat_id),
            username=username,
            first_name=first_name,
            application_id=application_id,
            flow_id=flow_id,
            invoice_currency=invoice_currency,
            code=code_value or None,
        )
    except payment_gateway.PaymentSystemError as exc:
        error_text = str(exc).strip().lower()
        if "payment code conflict" in error_text or "payment_code_conflict" in error_text:
            try:
                retry_options = payment_gateway.invoice_options(order_id=int(order.get("id")), flow_id=flow_id)
                retry_method, retry_code_value, retry_requires_code = _select_payment_method(retry_options)
                if retry_method:
                    selected_method = retry_method
                if retry_requires_code and not retry_code_value:
                    raise payment_gateway.PaymentSystemError("missing payment code for selected method")
                invoice = payment_gateway.create_invoice(
                    order_id=int(order.get("id")),
                    payment_method=payload.payment_method,
                    chat_id=int(chat_id),
                    username=username,
                    first_name=first_name,
                    application_id=application_id,
                    flow_id=flow_id,
                    invoice_currency=invoice_currency,
                    code=retry_code_value or None,
                )
                code_value = retry_code_value
            except payment_gateway.PaymentSystemError as retry_exc:
                logger.warning("checkout retry error: %s", retry_exc)
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(retry_exc) or "checkout unavailable") from retry_exc
        else:
            logger.warning("checkout error: %s", exc)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc) or "checkout unavailable") from exc

    invoice_url, provider_url = _invoice_urls(invoice)
    invoice_payload = invoice.get("invoice") if isinstance(invoice, dict) else None
    invoice_id_value = None
    if isinstance(invoice_payload, dict):
        invoice_id_value = invoice_payload.get("invoice_id") or invoice_payload.get("id")
    if not invoice_id_value and isinstance(invoice, dict):
        invoice_id_value = invoice.get("invoice_id") or invoice.get("invoiceId") or invoice.get("id")

    instruction_templates = selected_method.get("instruction_templates") if isinstance(selected_method, dict) else {}
    checkout_instructions = None
    if isinstance(instruction_templates, dict):
        checkout_instructions = str(instruction_templates.get("checkout_default") or "").strip() or None

    return CheckoutResponse(
        orderId=int(order.get("id")),
        invoiceId=str(invoice_id_value or ""),
        paymentUrl=invoice_url,
        providerInvoiceUrl=provider_url,
        paymentMethod=payload.payment_method,
        paymentCode=code_value or None,
        instructions=checkout_instructions,
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
        detail = str(exc).strip() or "invoice unavailable"
        if "not found" in detail.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail) from exc
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc

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
