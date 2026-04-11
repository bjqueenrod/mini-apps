from __future__ import annotations

from app.api import deps
from app.db.session import engine


def test_currency_preference_round_trip_for_telegram_session(client) -> None:
    app = __import__("app.main", fromlist=["app"]).app

    app.dependency_overrides[deps.get_session] = lambda: {
        "telegram_user_id": 123456,
        "source": "telegram",
    }
    try:
        post_response = client.post("/api/preferences/currency", json={"currency": "usd"})
        get_response = client.get("/api/preferences/currency")
    finally:
        app.dependency_overrides.clear()

    assert post_response.status_code == 200
    assert post_response.json()["currency"] == "USD"
    assert get_response.status_code == 200
    assert get_response.json()["currency"] == "USD"

    with engine.begin() as conn:
        row = conn.exec_driver_sql(
            "SELECT currency FROM user_preferences WHERE user_id = ?",
            (123456,),
        ).first()
    assert row is not None
    assert row[0] == "USD"


def test_currency_preference_requires_telegram_session(client) -> None:
    app = __import__("app.main", fromlist=["app"]).app

    app.dependency_overrides[deps.get_session] = lambda: {
        "telegram_user_id": 123456,
        "source": "development",
    }
    try:
        response = client.post("/api/preferences/currency", json={"currency": "gbp"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
