from __future__ import annotations

import hashlib
import hmac
import json
import urllib.parse

from app.core.telegram import validate_init_data



def _build_init_data(bot_token: str) -> str:
    user_json = json.dumps({"id": 123, "username": "queen", "first_name": "Queen"}, separators=(",", ":"))
    pairs = [
        ("auth_date", "1711111111"),
        ("query_id", "AAEAAAE"),
        ("user", user_json),
    ]
    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(pairs))
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    signature = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
    return urllib.parse.urlencode(pairs + [("hash", signature)])



def test_validate_init_data_success() -> None:
    result = validate_init_data(_build_init_data("test-token"), "test-token")
    assert result.user.id == 123
    assert result.user.username == "queen"



def test_auth_telegram_dev_mode(client) -> None:
    response = client.post("/api/auth/telegram", json={"devUser": {"id": 99, "username": "dev"}})
    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["id"] == 99
    assert "clip_session=" in response.headers.get("set-cookie", "")


def test_auth_telegram_tracked_start_param_notifies_cms(client, monkeypatch) -> None:
    calls: list[tuple[str | None, int]] = []

    def _capture(start_param: str | None, user) -> None:
        calls.append((start_param, user.id))

    monkeypatch.setattr("app.api.routes.auth.notify_miniapp_open", _capture)

    response = client.post(
        "/api/auth/telegram",
        json={"initData": _build_init_data("test-token"), "startParam": "l_1z"},
    )

    assert response.status_code == 200
    assert calls == [("l_1z", 123)]


def test_auth_telegram_ignores_missing_start_param(client, monkeypatch) -> None:
    calls: list[tuple[str | None, int]] = []

    def _capture(start_param: str | None, user) -> None:
        calls.append((start_param, user.id))

    monkeypatch.setattr("app.api.routes.auth.notify_miniapp_open", _capture)

    response = client.post(
        "/api/auth/telegram",
        json={"initData": _build_init_data("test-token")},
    )

    assert response.status_code == 200
    assert calls == [(None, 123)]
