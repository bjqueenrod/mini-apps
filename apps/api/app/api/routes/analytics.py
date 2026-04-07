from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import get_session
from app.schemas.analytics import MiniAppAnalyticsEventRequest, MiniAppAnalyticsResponse
from app.services.analytics_service import forward_analytics_event

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/events", response_model=MiniAppAnalyticsResponse, status_code=status.HTTP_202_ACCEPTED)
def analytics_events(
    payload: MiniAppAnalyticsEventRequest,
    session: dict = Depends(get_session),
) -> MiniAppAnalyticsResponse:
    return MiniAppAnalyticsResponse(accepted=forward_analytics_event(payload, session))
