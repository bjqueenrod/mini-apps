from __future__ import annotations

from typing import Any


def test_analytics_events_forward_to_cms_with_session(client, monkeypatch) -> None:
    captured: dict[str, Any] = {}

    class _Response:
        def raise_for_status(self) -> None:
            return None

    def _fake_post(url: str, *, json: dict[str, Any], headers: dict[str, str], timeout: float):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        captured["timeout"] = timeout
        return _Response()

    monkeypatch.setattr("app.services.analytics_service.httpx.post", _fake_post)
    monkeypatch.setattr("app.services.analytics_service.settings.cms_api_url", "https://cms.example")
    monkeypatch.setattr("app.services.analytics_service.settings.cms_internal_task_token", "test-internal-token")

    auth_response = client.post(
        "/api/auth/telegram",
        json={"devUser": {"id": 42, "username": "tester", "firstName": "Test"}, "startParam": "l_1__buy_26"},
    )
    assert auth_response.status_code == 200

    response = client.post(
        "/api/analytics/events",
        json={
            "eventName": "entry_started",
            "screen": "clips_home",
            "receivedStartParam": "l_1__buy_26",
            "properties": {"entry_path": "/clips", "is_telegram": False},
        },
    )

    assert response.status_code == 202
    assert response.json() == {"accepted": True}
    assert captured["url"] == "https://cms.example/internal/analytics/events"
    assert captured["headers"] == {"X-Internal-Token": "test-internal-token"}

    event = captured["json"]["events"][0]
    assert event["event_name"] == "entry_started"
    assert event["subject_telegram_user_id"] == 42
    assert event["surface"] == "telegram_mini_app"
    assert event["screen"] == "clips_home"
    assert event["received_start_param"] == "l_1__buy_26"
    assert event["properties"]["entry_path"] == "/clips"
    assert event["dedupe_key"].startswith("miniapp:42:entry_started:")


def test_analytics_events_require_session(client) -> None:
    response = client.post("/api/analytics/events", json={"eventName": "screen_viewed", "screen": "clips_home"})

    assert response.status_code == 401


def test_analytics_events_return_unaccepted_when_cms_is_not_configured(client, monkeypatch) -> None:
    monkeypatch.setattr("app.services.analytics_service.settings.cms_api_url", "")
    monkeypatch.setattr("app.services.analytics_service.settings.cms_internal_task_token", "")

    auth_response = client.post("/api/auth/telegram", json={"devUser": {"id": 7, "username": "tester"}})
    assert auth_response.status_code == 200

    response = client.post("/api/analytics/events", json={"eventName": "interaction_triggered", "actionKey": "clip_select"})

    assert response.status_code == 202
    assert response.json() == {"accepted": False}
