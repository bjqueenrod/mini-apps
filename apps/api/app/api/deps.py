from __future__ import annotations

from typing import Generator

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_session_serializer
from app.db.session import SessionLocal


SESSION_COOKIE_NAME = "clip_session"


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_optional_session(session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME)) -> dict | None:
    if not session_token:
        return None
    serializer = get_session_serializer()
    try:
        return serializer.loads(session_token, max_age=60 * 60 * 24 * 7)
    except Exception:
        return None


def get_session(session: dict | None = Depends(get_optional_session)) -> dict:
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return session
