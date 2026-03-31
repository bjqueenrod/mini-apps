from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TierItemResponse(BaseModel):
    id: str
    name: str
    short_description: str | None = Field(default=None, alias='shortDescription')
    description: str | None = None
    product_id: str | None = Field(default=None, alias='productId')
    duration_days: int | None = Field(default=None, alias='durationDays')
    tasks_per_day: int | None = Field(default=None, alias='tasksPerDay')
    price: float | None = None
    price_label: str | None = Field(default=None, alias='priceLabel')
    is_unlimited_tasks: bool = Field(alias='isUnlimitedTasks')
    badge: str | None = None
    bot_buy_url: str | None = Field(default=None, alias='botBuyUrl')

    model_config = ConfigDict(populate_by_name=True)


class TierListResponse(BaseModel):
    items: list[TierItemResponse]
    total: int

    model_config = ConfigDict(populate_by_name=True)
