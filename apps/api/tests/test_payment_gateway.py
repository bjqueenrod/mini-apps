from __future__ import annotations

class _FakeResponse:
    def __init__(self, status_code: int, payload: dict | None = None):
        self.status_code = status_code
        self._payload = payload or {}

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            import httpx

            request = httpx.Request("POST", "https://example.com")
            response = httpx.Response(self.status_code, request=request, json=self._payload)
            raise httpx.HTTPStatusError("bad response", request=request, response=response)

    def json(self) -> dict:
        return self._payload


def test_invoice_options_retries_once_on_transient_upstream_error(monkeypatch) -> None:
    from app.services import payment_gateway

    calls = {"count": 0}

    def fake_post(*args, **kwargs):
        calls["count"] += 1
        if calls["count"] == 1:
            return _FakeResponse(502, {"error": "cloudflare 502"})
        return _FakeResponse(200, {"payment_methods": []})

    monkeypatch.setattr(payment_gateway.httpx, "post", fake_post)
    monkeypatch.setattr(payment_gateway.time, "sleep", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(
        payment_gateway.settings,
        "payment_system_api_url",
        "https://payment-system.example",
    )

    result = payment_gateway.invoice_options(items=[{"product_id": 1, "quantity": 1}])

    assert result == {"payment_methods": []}
    assert calls["count"] == 2


def test_invoice_options_returns_friendly_message_for_persistent_502(monkeypatch) -> None:
    from app.services import payment_gateway

    calls = {"count": 0}

    def fake_post(*args, **kwargs):
        calls["count"] += 1
        return _FakeResponse(502, {"error": "cloudflare 502"})

    monkeypatch.setattr(payment_gateway.httpx, "post", fake_post)
    monkeypatch.setattr(payment_gateway.time, "sleep", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(
        payment_gateway.settings,
        "payment_system_api_url",
        "https://payment-system.example",
    )

    try:
        payment_gateway.invoice_options(items=[{"product_id": 1, "quantity": 1}])
        assert False, "expected PaymentSystemError"
    except payment_gateway.PaymentSystemError as exc:
        assert str(exc) == "unable to load payment options"

    assert calls["count"] == 2


def test_get_invoice_can_cache_bust(monkeypatch) -> None:
    from app.services import payment_gateway

    seen = {}

    def fake_get(*args, **kwargs):
        seen["params"] = kwargs.get("params")
        return _FakeResponse(200, {"invoice_id": "inv-1", "status": "paid"})

    monkeypatch.setattr(payment_gateway.httpx, "get", fake_get)
    monkeypatch.setattr(
        payment_gateway.settings,
        "payment_system_api_url",
        "https://payment-system.example",
    )

    result = payment_gateway.get_invoice("inv-1", cache_bust=True)

    assert result == {"invoice_id": "inv-1", "status": "paid"}
    assert isinstance(seen.get("params"), dict)
    assert "_" in seen["params"]
