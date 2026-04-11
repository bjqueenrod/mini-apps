from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_session
from app.schemas.preferences import CurrencyPreferenceRequest, CurrencyPreferenceResponse
from app.services.bot_menu_service import refresh_currency_menu

router = APIRouter(prefix="/preferences", tags=["preferences"])
logger = logging.getLogger(__name__)

ALLOWED_CURRENCY_CODES = {"GBP", "USD"}
CREATE_USER_PREFERENCES_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id BIGINT PRIMARY KEY,
    currency VARCHAR(3) DEFAULT 'GBP'
)
"""


def _normalize_currency(currency: str | None) -> str:
    code = str(currency or "").strip().upper()
    return code if code in ALLOWED_CURRENCY_CODES else "GBP"


def _ensure_user_preferences_table(db: Session) -> None:
    bind = db.get_bind()
    if bind is None:
        return
    with bind.begin() as connection:
        connection.execute(text(CREATE_USER_PREFERENCES_TABLE_SQL))


def _normalize_user_id(user_id: int | str | None) -> int:
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="telegram_user_id is required")
    try:
        return int(user_id)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="telegram_user_id must be numeric") from exc


def _resolve_currency_user_id(session: dict | None, telegram_user_id: int | None) -> int:
    if session and session.get("source") == "telegram":
        return _normalize_user_id(session.get("telegram_user_id"))
    if telegram_user_id is not None:
        return _normalize_user_id(telegram_user_id)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Telegram session or telegram_user_id is required.",
    )


def _load_currency_preference(db: Session, user_id: int) -> str:
    _ensure_user_preferences_table(db)
    row = db.execute(
        text("SELECT currency FROM user_preferences WHERE user_id = :user_id LIMIT 1"),
        {"user_id": user_id},
    ).mappings().first()
    return _normalize_currency(row["currency"] if row and row.get("currency") is not None else None)


def _save_currency_preference(db: Session, user_id: int, currency: str) -> str:
    code = _normalize_currency(currency)
    _ensure_user_preferences_table(db)
    existing = db.execute(
        text("SELECT 1 FROM user_preferences WHERE user_id = :user_id LIMIT 1"),
        {"user_id": user_id},
    ).first()
    if existing:
        db.execute(
            text("UPDATE user_preferences SET currency = :currency WHERE user_id = :user_id"),
            {"user_id": user_id, "currency": code},
        )
    else:
        db.execute(
            text("INSERT INTO user_preferences (user_id, currency) VALUES (:user_id, :currency)"),
            {"user_id": user_id, "currency": code},
        )
    db.commit()
    return code


@router.get("/currency", response_model=CurrencyPreferenceResponse)
def get_currency_preference(
    session: dict | None = Depends(get_optional_session),
    telegram_user_id: int | None = Query(default=None, alias="telegram_user_id"),
    db: Session = Depends(get_db),
) -> CurrencyPreferenceResponse:
    logger.info(
        "Currency preference request method=GET session_source=%s query_telegram_user_id=%s",
        session.get("source") if session else None,
        telegram_user_id,
    )
    user_id = _resolve_currency_user_id(session, telegram_user_id)
    logger.info(
        "Currency preference lookup source=%s query_telegram_user_id=%s resolved_user_id=%s",
        session.get("source") if session else None,
        telegram_user_id,
        user_id,
    )
    currency = _load_currency_preference(db, user_id)
    logger.info("Loaded currency preference user_id=%s currency=%s", user_id, currency)
    return CurrencyPreferenceResponse(currency=currency)


@router.post("/currency", response_model=CurrencyPreferenceResponse)
def set_currency_preference(
    payload: CurrencyPreferenceRequest,
    session: dict | None = Depends(get_optional_session),
    telegram_user_id: int | None = Query(default=None, alias="telegram_user_id"),
    db: Session = Depends(get_db),
) -> CurrencyPreferenceResponse:
    logger.info(
        "Currency preference request method=POST session_source=%s query_telegram_user_id=%s currency=%s",
        session.get("source") if session else None,
        telegram_user_id,
        payload.currency,
    )
    user_id = _resolve_currency_user_id(session, telegram_user_id)
    logger.info(
        "Currency preference save source=%s query_telegram_user_id=%s resolved_user_id=%s currency=%s",
        session.get("source") if session else None,
        telegram_user_id,
        user_id,
        payload.currency,
    )
    currency = _save_currency_preference(db, user_id, payload.currency)
    logger.info("Saved currency preference user_id=%s currency=%s", user_id, currency)
    refresh_currency_menu(telegram_user_id=user_id, currency=currency)
    return CurrencyPreferenceResponse(currency=currency)
