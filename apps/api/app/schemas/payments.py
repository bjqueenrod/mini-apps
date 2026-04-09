from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class CheckoutOptionsRequest(BaseModel):
    product_id: str = Field(alias="productId")
    quantity: int = 1
    mode: str | None = None
    unit_price_cents: int | None = Field(default=None, alias="unitPriceCents")
    clip_id: str | None = Field(default=None, alias="clipId")
    template_values: dict[str, Any] | None = Field(default=None, alias="templateValues")
    order_values: dict[str, Any] | None = Field(default=None, alias="orderValues")
    meta_data: dict[str, Any] | None = Field(default=None, alias="metaData")
    order_id: int | None = Field(default=None, alias="orderId")


class PaymentMethod(BaseModel):
    id: int | None = None
    payment_method: str = Field(alias="paymentMethod")
    label: str
    requires_code: bool = Field(default=False, alias="requiresCode")
    instructions: str | None = None
    tribute_code: str | None = Field(default=None, alias="tributeCode")
    price_cents: int | None = Field(default=None, alias="priceCents")
    details: dict[str, Any] | None = None

    class Config:
        populate_by_name = True


class CheckoutOptionsResponse(BaseModel):
    flow_id: str | None = Field(default=None, alias="flowId")
    payment_methods: list[PaymentMethod] = Field(default_factory=list, alias="paymentMethods")
    totals: dict[str, Any] | None = None

    class Config:
        populate_by_name = True


class CheckoutRequest(BaseModel):
    product_id: str = Field(alias="productId")
    payment_method: str = Field(alias="paymentMethod")
    quantity: int = 1
    mode: str | None = None
    unit_price_cents: int | None = Field(default=None, alias="unitPriceCents")
    clip_id: str | None = Field(default=None, alias="clipId")
    template_values: dict[str, Any] | None = Field(default=None, alias="templateValues")
    order_values: dict[str, Any] | None = Field(default=None, alias="orderValues")
    meta_data: dict[str, Any] | None = Field(default=None, alias="metaData")
    order_id: int | None = Field(default=None, alias="orderId")


class CheckoutResponse(BaseModel):
    order_id: int = Field(alias="orderId")
    invoice_id: str = Field(alias="invoiceId")
    payment_url: str | None = Field(default=None, alias="paymentUrl")
    provider_invoice_url: str | None = Field(default=None, alias="providerInvoiceUrl")
    payment_method: str = Field(alias="paymentMethod")
    payment_code: str | None = Field(default=None, alias="paymentCode")
    instructions: str | None = None
    totals: dict[str, Any] | None = None

    class Config:
        populate_by_name = True


class InvoiceStatusResponse(BaseModel):
    invoice_id: str = Field(alias="invoiceId")
    status: str
    payment_url: str | None = Field(default=None, alias="paymentUrl")
    provider_invoice_url: str | None = Field(default=None, alias="providerInvoiceUrl")

    class Config:
        populate_by_name = True
