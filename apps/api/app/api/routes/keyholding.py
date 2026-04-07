from __future__ import annotations

from fastapi import APIRouter

from app.schemas.keyholding import (
    KeyholdingOptionListResponse,
    KeyholdingTierListResponse,
)
from app.services.keyholding_service import fetch_keyholding_options, fetch_keyholding_tiers

router = APIRouter(tags=["keyholding"])


@router.get("/keyholding/tiers", response_model=KeyholdingTierListResponse)
def keyholding_tiers() -> KeyholdingTierListResponse:
    data = fetch_keyholding_tiers()
    return KeyholdingTierListResponse(**data)


@router.get("/keyholding/options", response_model=KeyholdingOptionListResponse)
def keyholding_options() -> KeyholdingOptionListResponse:
    data = fetch_keyholding_options()
    return KeyholdingOptionListResponse(**data)
