from __future__ import annotations

import time

from app.core.config import get_settings
from app.core.telegram import TelegramAuthResult, TelegramUser, validate_init_data


settings = get_settings()



def authenticate_telegram(init_data: str) -> TelegramAuthResult:
    return validate_init_data(init_data, settings.telegram_bot_token)



def build_session_payload(user: TelegramUser, source: str, start_param: str | None = None) -> dict:
    return {
        "telegram_user_id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "source": source,
        "issued_at": int(time.time()),
        "start_param": (start_param or "").strip() or None,
    }
