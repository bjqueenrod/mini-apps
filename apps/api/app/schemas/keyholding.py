from __future__ import annotations

from pydantic import BaseModel, Field


class KeyholdingTierResponse(BaseModel):
    id: str
    slug: str | None = None
    name: str
    desc: str | None = None
    duration: str | None = None
    ideal_for: str | None = Field(default=None, alias="idealFor")
    includes: list[str] = Field(default_factory=list)
    price: str | float | None = None
    price_label: str | float | None = Field(default=None, alias="priceLabel")
    price_per_week: str | float | None = Field(default=None, alias="pricePerWeek")
    price_value: float | None = Field(default=None, alias="priceValue")
    payment_product_id: int | None = Field(default=None, alias="paymentProductId")
    badge: str | None = None
    duration_weeks_options: list[int] = Field(default_factory=list, alias="durationWeeksOptions")
    max_quantity: int | None = Field(default=None, alias="maxQuantity")


class KeyholdingTierListResponse(BaseModel):
    items: list[KeyholdingTierResponse]
    total: int


class KeyholdingOptionResponse(BaseModel):
    id: str
    slug: str
    label: str
    tooltip: str | None = None
    availability_type: str | None = Field(default=None, alias="availabilityType")
    availability_tiers: list[str] = Field(default_factory=list, alias="availabilityTiers")
    requires_lockbox_photo: bool = Field(default=False, alias="requiresLockboxPhoto")
    price_label: str | None = Field(default=None, alias="priceLabel")
    price_cents: int | None = Field(default=None, alias="priceCents")
    payment_product_id: int | None = Field(default=None, alias="paymentProductId")
    order: int | None = None


class KeyholdingOptionListResponse(BaseModel):
    items: list[KeyholdingOptionResponse]
    total: int
