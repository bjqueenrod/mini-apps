from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.clips import ClipItemResponse, ClipListResponse, ClipQueryParams
from app.services.clip_service import get_clip_detail, get_new_clips, get_top_seller_clips, search_clips
from app.services.rate_limit import enforce_rate_limit

router = APIRouter(tags=["clips"])


@router.get("/clips", response_model=ClipListResponse)
def list_clips(
    request: Request,
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    tags: str | None = Query(default=None),
    sort: str = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
) -> ClipListResponse:
    enforce_rate_limit(f"clips:{request.client.host if request.client else 'unknown'}")
    params = ClipQueryParams(q=q, category=category, tags=tags, sort=sort, page=page, limit=limit)
    data = search_clips(db, params)
    return ClipListResponse(**data)


@router.get("/clips/top-sellers", response_model=ClipListResponse)
def top_seller_clips(db: Session = Depends(get_db)) -> ClipListResponse:
    data = get_top_seller_clips(db)
    return ClipListResponse(**data)


@router.get("/clips/new", response_model=ClipListResponse)
def new_clips(db: Session = Depends(get_db)) -> ClipListResponse:
    data = get_new_clips(db, limit=10)
    return ClipListResponse(**data)


@router.get("/clips/{clip_id}", response_model=ClipItemResponse)
def clip_detail(clip_id: str, db: Session = Depends(get_db)) -> ClipItemResponse:
    item = get_clip_detail(db, clip_id)
    if not item:
        raise HTTPException(status_code=404, detail="clip not found")
    return ClipItemResponse(**item)
