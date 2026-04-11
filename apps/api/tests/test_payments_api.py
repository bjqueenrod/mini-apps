from __future__ import annotations

from app.api import deps
from app.main import app


def test_checkout_forwards_username_and_first_name_to_create_order(client, monkeypatch) -> None:
    from app.services import payment_gateway

    captured: dict[str, str | None] = {}

    def fake_create_order(**kwargs):
        captured["username"] = kwargs.get("username")
        captured["first_name"] = kwargs.get("first_name")
        captured["order_currency"] = kwargs.get("invoice_currency")
        return {"id": 123}

    def fake_create_invoice(**kwargs):
        captured["invoice_username"] = kwargs.get("username")
        captured["invoice_first_name"] = kwargs.get("first_name")
        captured["invoice_currency"] = kwargs.get("invoice_currency")
        return {
            "invoice": {"invoice_id": "inv_123"},
            "invoice_url": "https://example.com/invoice",
            "provider_invoice_url": "https://example.com/provider",
        }

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
    monkeypatch.setattr(payment_gateway, "create_invoice", fake_create_invoice)
    app.dependency_overrides[deps.get_session] = lambda: {
        "telegram_user_id": 123456,
        "source": "telegram",
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
                    "currency": "usd",
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["username"] is None
    assert captured["first_name"] == "Alice"
    assert captured["order_currency"] is None
    assert captured["invoice_username"] is None
    assert captured["invoice_first_name"] == "Alice"
    assert captured["invoice_currency"] == "USD"


def test_checkout_omits_username_and_first_name_outside_telegram(client, monkeypatch) -> None:
    from app.services import payment_gateway

    captured: dict[str, str | None] = {}

    def fake_create_order(**kwargs):
        captured["username"] = kwargs.get("username")
        captured["first_name"] = kwargs.get("first_name")
        captured["order_currency"] = kwargs.get("invoice_currency")
        return {"id": 123}

    def fake_create_invoice(**kwargs):
        captured["invoice_username"] = kwargs.get("username")
        captured["invoice_first_name"] = kwargs.get("first_name")
        captured["invoice_currency"] = kwargs.get("invoice_currency")
        return {
            "invoice": {"invoice_id": "inv_123"},
            "invoice_url": "https://example.com/invoice",
            "provider_invoice_url": "https://example.com/provider",
        }

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
    monkeypatch.setattr(payment_gateway, "create_invoice", fake_create_invoice)
    app.dependency_overrides[deps.get_session] = lambda: {
        "telegram_user_id": 123456,
        "source": "development",
        "username": "local-preview",
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
                    "currency": "gbp",
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["username"] is None
    assert captured["first_name"] is None
    assert captured["order_currency"] is None
    assert captured["invoice_username"] is None
    assert captured["invoice_first_name"] is None
    assert captured["invoice_currency"] == "GBP"


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
                    "tribute_code": "MBJQ-KEY-SERVER",
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
                "paymentCode": "MBJQ-KEY-DISPLAY",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["paymentCode"] == "MBJQ-KEY-DISPLAY"
    assert captured["code"] == "MBJQ-KEY-DISPLAY"


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


def test_invoice_status_does_not_require_session_cookie(client, monkeypatch) -> None:
    from app.services import payment_gateway

    monkeypatch.setattr(
        payment_gateway,
        "get_invoice",
        lambda invoice_id: {
            "status": "pending",
            "invoice_url": f"https://example.com/{invoice_id}",
            "provider_invoice_url": f"https://provider.example/{invoice_id}",
        },
    )

    response = client.get("/api/payments/invoices/inv_123")

    assert response.status_code == 200
    assert response.json()["invoiceId"] == "inv_123"
    assert response.json()["status"] == "pending"


def test_invoice_status_surfaces_not_found_detail(client, monkeypatch) -> None:
    from app.services import payment_gateway

    def fake_get_invoice(*args, **kwargs):
        raise payment_gateway.PaymentSystemError("invoice not found")

    monkeypatch.setattr(payment_gateway, "get_invoice", fake_get_invoice)
    response = client.get("/api/payments/invoices/abc-123")

    assert response.status_code == 404
    assert response.json()["detail"] == "invoice not found"


def test_invoice_status_refreshes_pending_invoices(client, monkeypatch) -> None:
    from app.api.routes import payments as payments_routes
    from app.services import payment_gateway

    payments_routes.INVOICE_CACHE["abc-123"] = payments_routes.InvoiceStatusResponse(
        invoiceId="abc-123",
        status="pending",
        paymentUrl=None,
        providerInvoiceUrl=None,
    )
    calls = {"count": 0}

    def fake_get_invoice(*args, **kwargs):
        calls["count"] += 1
        if calls["count"] == 1:
            return {
                "invoice_id": "abc-123",
                "status": "pending",
                "invoice_url": None,
                "provider_invoice_url": None,
            }
        return {
            "invoice_id": "abc-123",
            "status": "paid",
            "invoice_url": "https://example.com/invoice",
            "provider_invoice_url": "https://example.com/provider",
        }

    monkeypatch.setattr(payment_gateway, "get_invoice", fake_get_invoice)

    first = client.get("/api/payments/invoices/abc-123")
    second = client.get("/api/payments/invoices/abc-123")

    assert first.status_code == 200
    assert first.json()["status"] == "pending"
    assert second.status_code == 200
    assert second.json()["status"] == "paid"
    assert calls["count"] == 2


def test_cancel_invoice_updates_cached_status(client, monkeypatch) -> None:
    from app.api.routes import payments as payments_routes
    from app.services import payment_gateway

    payments_routes.INVOICE_CACHE["abc-123"] = payments_routes.InvoiceStatusResponse(
        invoiceId="abc-123",
        status="pending",
        paymentUrl=None,
        providerInvoiceUrl=None,
    )

    def fake_cancel_invoice(*args, **kwargs):
        return {"status": "cancelled"}

    monkeypatch.setattr(payment_gateway, "cancel_invoice", fake_cancel_invoice)
    response = client.post("/api/payments/invoices/abc-123/cancel")

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert payments_routes.INVOICE_CACHE["abc-123"].status == "cancelled"
