from __future__ import annotations

import time

from fastapi import APIRouter, HTTPException, Response, status

from app.api.deps import SESSION_COOKIE_NAME
from app.core.config import get_settings
from app.core.security import get_session_serializer
from app.core.telegram import TelegramUser, TelegramInitDataError
from app.schemas.auth import AuthUserResponse, TelegramAuthRequest, TelegramAuthResponse
from app.services.auth_service import authenticate_telegram, build_session_payload
from app.services.tracking_service import notify_miniapp_open

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/telegram", response_model=TelegramAuthResponse)
def auth_telegram(payload: TelegramAuthRequest, response: Response) -> TelegramAuthResponse:
    source = "telegram"
    if payload.init_data:
        try:
            result = authenticate_telegram(payload.init_data)
        except TelegramInitDataError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
        user = result.user
    elif settings.is_dev and payload.dev_user:
        source = "development"
        user = TelegramUser(id=payload.dev_user.id, username=payload.dev_user.username, first_name=payload.dev_user.first_name)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="initData is required")

    notify_miniapp_open(payload.start_param, user)

    serializer = get_session_serializer()
    session_payload = build_session_payload(user, source=source)
    token = serializer.dumps(session_payload)
    max_age = 60 * 60 * 24 * 7
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=max_age,
        httponly=True,
        secure=not settings.is_dev,
        samesite="lax",
        path="/",
    )
    return TelegramAuthResponse(
        user=AuthUserResponse(id=user.id, username=user.username, firstName=user.first_name),
        sessionExpiresAt=int(time.time()) + max_age,
    )
