from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qsl


class TelegramInitDataError(ValueError):
    pass


@dataclass(slots=True)
class TelegramUser:
    id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language_code: str | None = None
    allows_write_to_pm: bool | None = None


@dataclass(slots=True)
class TelegramAuthResult:
    auth_date: int
    query_id: str | None
    user: TelegramUser
    start_param: str | None = None



def _build_data_check_string(items: list[tuple[str, str]]) -> str:
    filtered = [(key, value) for key, value in items if key != "hash"]
    filtered.sort(key=lambda pair: pair[0])
    return "\n".join(f"{key}={value}" for key, value in filtered)



def validate_init_data(init_data: str, bot_token: str) -> TelegramAuthResult:
    if not init_data.strip():
        raise TelegramInitDataError("initData is required")
    if not bot_token.strip():
        raise TelegramInitDataError("TELEGRAM_BOT_TOKEN is not configured")

    items = parse_qsl(init_data, keep_blank_values=True)
    payload = dict(items)
    their_hash = payload.get("hash")
    if not their_hash:
        raise TelegramInitDataError("hash is missing from initData")

    data_check_string = _build_data_check_string(items)
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, their_hash):
        raise TelegramInitDataError("initData signature is invalid")

    user_raw = payload.get("user")
    if not user_raw:
        raise TelegramInitDataError("Telegram user payload is missing")
    try:
        user_payload: dict[str, Any] = json.loads(user_raw)
    except json.JSONDecodeError as exc:
        raise TelegramInitDataError("Telegram user payload is invalid JSON") from exc

    try:
        user = TelegramUser(
            id=int(user_payload["id"]),
            username=user_payload.get("username"),
            first_name=user_payload.get("first_name"),
            last_name=user_payload.get("last_name"),
            language_code=user_payload.get("language_code"),
            allows_write_to_pm=user_payload.get("allows_write_to_pm"),
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise TelegramInitDataError("Telegram user payload is incomplete") from exc

    try:
        auth_date = int(payload.get("auth_date") or 0)
    except ValueError as exc:
        raise TelegramInitDataError("auth_date is invalid") from exc

    start_raw = payload.get("start_param")
    start_param: str | None = None
    if start_raw is not None:
        normalized_start = str(start_raw).strip()
        if normalized_start:
            start_param = normalized_start

    return TelegramAuthResult(
        auth_date=auth_date,
        query_id=payload.get("query_id"),
        user=user,
        start_param=start_param,
    )
