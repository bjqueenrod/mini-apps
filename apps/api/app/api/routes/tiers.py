from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.tiers import TierItemResponse, TierListResponse
from app.services.tier_service import get_featured_tiers, get_tier_detail, list_tiers

router = APIRouter(tags=['tiers'])


@router.get('/tiers', response_model=TierListResponse)
def tiers(db: Session = Depends(get_db)) -> TierListResponse:
    return TierListResponse(**list_tiers(db))


@router.get('/tiers/featured', response_model=TierListResponse)
def featured_tiers(db: Session = Depends(get_db)) -> TierListResponse:
    return TierListResponse(**get_featured_tiers(db))


@router.get('/tiers/{tier_id}', response_model=TierItemResponse)
def tier_detail(tier_id: str, db: Session = Depends(get_db)) -> TierItemResponse:
    item = get_tier_detail(db, tier_id)
    if item is None:
        raise HTTPException(status_code=404, detail='tier not found')
    return TierItemResponse(**item)
