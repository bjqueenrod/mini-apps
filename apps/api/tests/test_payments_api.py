from __future__ import annotations

from app.api import deps
from app.main import app


def test_checkout_forwards_username_and_first_name_to_create_order(client, monkeypatch) -> None:
    from app.services import payment_gateway

    captured: dict[str, str | None] = {}

    def fake_create_order(**kwargs):
        captured["username"] = kwargs.get("username")
        captured["first_name"] = kwargs.get("first_name")
        return {"id": 123}

    monkeypatch.setattr(payment_gateway, "create_order", fake_create_order)
    monkeypatch.setattr(
        payment_gateway,
        "invoice_options",
        lambda **kwargs: {
            "payment_methods": [
                {
                    "id": -1,
                    "payment_method": "paypal",
                    "requires_code": True,
                    "tribute_code": "MBJQ-KEY-TEST",
                    "instruction_templates": {"checkout_default": "Use {code}"},
                    "method_details": {},
                }
            ]
        },
    )
    monkeypatch.setattr(
        payment_gateway,
        "create_invoice",
        lambda **kwargs: {
            "invoice": {"invoice_id": "inv_123"},
            "invoice_url": "https://example.com/invoice",
            "provider_invoice_url": "https://example.com/provider",
        },
    )
    app.dependency_overrides[deps.get_session] = lambda: {
        "telegram_user_id": 123456,
        "username": None,
        "first_name": "Alice",
        "start_param": "flow-1",
        "flow_id": "flow-1",
    }
    try:
        response = client.post(
            "/api/payments/checkout",
            json={
                "productId": "BJQ0001",
                "paymentMethod": "paypal",
                "quantity": 1,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["username"] is None
    assert captured["first_name"] == "Alice"


def test_checkout_uses_tribute_code_when_selected_method_requires_code(client, monkeypatch) -> None:
    from app.services import payment_gateway

    captured: dict[str, str | None] = {}

    monkeypatch.setattr(payment_gateway, "create_order", lambda **kwargs: {"id": 123})
    monkeypatch.setattr(
        payment_gateway,
        "invoice_options",
        lambda **kwargs: {
            "payment_methods": [
                {
                    "id": -1,
                    "payment_method": "paypal",
                    "requires_code": True,
                    "tribute_code": "MBJQ-KEY-TEST",
                    "instruction_templates": {"checkout_default": "Use {code}"},
                    "method_details": {},
                }
            ]
        },
    )

    def fake_create_invoice(**kwargs):
        captured["code"] = kwargs.get("code")
        return {
            "invoice": {"invoice_id": "inv_123"},
            "invoice_url": "https://example.com/invoice",
            "provider_invoice_url": "https://example.com/provider",
        }

    monkeypatch.setattr(payment_gateway, "create_invoice", fake_create_invoice)
    app.dependency_overrides[deps.get_session] = lambda: {
        "telegram_user_id": 123456,
        "start_param": "flow-1",
        "flow_id": "flow-1",
    }
    try:
        response = client.post(
            "/api/payments/checkout",
            json={
                "productId": "BJQ0001",
                "paymentMethod": "paypal",
                "quantity": 1,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["paymentCode"] == "MBJQ-KEY-TEST"
    assert captured["code"] == "MBJQ-KEY-TEST"


def test_checkout_retries_when_code_conflicts(client, monkeypatch) -> None:
    from app.services import payment_gateway

    captured_codes: list[str | None] = []
    invoice_options_calls = {"count": 0}

    monkeypatch.setattr(payment_gateway, "create_order", lambda **kwargs: {"id": 456})

    def fake_invoice_options(**kwargs):
        invoice_options_calls["count"] += 1
        code = "MBJQ-KEY-RETRY1" if invoice_options_calls["count"] == 1 else "MBJQ-KEY-RETRY2"
        return {
            "payment_methods": [
                {
                    "id": -1,
                    "payment_method": "paypal",
                    "requires_code": True,
                    "tribute_code": code,
                    "instruction_templates": {"checkout_default": "Use {code}"},
                    "method_details": {},
                }
            ]
        }

    monkeypatch.setattr(payment_gateway, "invoice_options", fake_invoice_options)

    def fake_create_invoice(**kwargs):
        captured_codes.append(kwargs.get("code"))
        if len(captured_codes) == 1:
            raise payment_gateway.PaymentSystemError("payment code conflict")
        return {
            "invoice": {"invoice_id": "inv_456"},
            "invoice_url": "https://example.com/invoice",
            "provider_invoice_url": "https://example.com/provider",
        }

    monkeypatch.setattr(payment_gateway, "create_invoice", fake_create_invoice)
    app.dependency_overrides[deps.get_session] = lambda: {
        "telegram_user_id": 123456,
        "start_param": "flow-1",
        "flow_id": "flow-1",
    }
    try:
        response = client.post(
            "/api/payments/checkout",
            json={
                "productId": "BJQ0001",
                "paymentMethod": "paypal",
                "quantity": 1,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["paymentCode"] == "MBJQ-KEY-RETRY2"
    assert captured_codes == ["MBJQ-KEY-RETRY1", "MBJQ-KEY-RETRY2"]
