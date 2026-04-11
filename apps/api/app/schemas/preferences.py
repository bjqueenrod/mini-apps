from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


CurrencyCode = Literal["GBP", "USD"]


class CurrencyPreferenceResponse(BaseModel):
    currency: CurrencyCode = "GBP"

    model_config = ConfigDict(populate_by_name=True)


class CurrencyPreferenceRequest(BaseModel):
    currency: str

    model_config = ConfigDict(populate_by_name=True)
