from __future__ import annotations

from app.db.session import engine


def test_list_tiers_returns_active_tiers_in_expected_order(client) -> None:
    response = client.get('/api/tiers')
    assert response.status_code == 200
    payload = response.json()
    assert payload['total'] == 4
    assert [item['name'] for item in payload['items']] == [
        'Control Month',
        'Initiation',
        'Training Week',
        'Unlimited Week',
    ]


def test_featured_tiers_respects_manual_product_id_order(client) -> None:
    response = client.get('/api/tiers/featured')
    assert response.status_code == 200
    payload = response.json()
    assert [item['productId'] for item in payload['items']] == ['26', '23']


def test_tier_detail_shapes_alias_fields_and_buy_link(client) -> None:
    response = client.get('/api/tiers/3')
    assert response.status_code == 200
    item = response.json()
    assert item['productId'] == '26'
    assert item['priceLabel'] == '£49.99'
    assert item['isUnlimitedTasks'] is True
    assert item['botBuyUrl'].endswith('buy_26')


def test_tier_detail_uses_tracking_redirect_buy_link_when_configured(client, monkeypatch) -> None:
    monkeypatch.setattr('app.utils.bot_links._build_tracked_redirect_url', lambda slug, payload=None: f'https://links.mistressbjqueen.com/{slug}?payload={payload}')
    monkeypatch.setattr('app.utils.bot_links.get_settings', lambda: type('S', (), {
        'tracking_clip_stream_slug': '',
        'tracking_clip_download_slug': '',
        'tracking_product_buy_slug': 'tier-buy',
        'normalized_tracking_links_base_url': 'https://links.mistressbjqueen.com',
        'bot_username': 'mistressbjqueenbot',
    })())

    response = client.get('/api/tiers/3')
    assert response.status_code == 200
    item = response.json()
    assert item['botBuyUrl'] == 'https://links.mistressbjqueen.com/tier-buy?payload=buy_26'


def test_tier_detail_uses_week_fallback_for_duration(client) -> None:
    response = client.get('/api/tiers/4')
    assert response.status_code == 200
    item = response.json()
    assert item['durationDays'] == 28
    assert item['badge'] == 'Best Value'
    assert item['price'] == 89.99



def test_list_tiers_enriches_price_from_payment_product(client, monkeypatch) -> None:
    monkeypatch.setattr(
        'app.services.tier_service.list_payment_products',
        lambda active_only=False: [
            {'id': 19, 'price_pence': 1999, 'active': True},
            {'id': 21, 'price_pence': 2999, 'active': True},
            {'id': 23, 'price_pence': 8999, 'active': True},
            {'id': 26, 'price_pence': 4999, 'active': True},
        ],
    )
    monkeypatch.setattr('app.services.tier_service.get_payment_product', lambda product_id: None)

    response = client.get('/api/tiers')
    assert response.status_code == 200
    payload = response.json()
    by_name = {item['name']: item for item in payload['items']}
    assert by_name['Initiation']['price'] == 19.99
    assert by_name['Training Week']['priceLabel'] == '£29.99'
    assert by_name['Control Month']['priceLabel'] == '£89.99'


def test_tier_detail_falls_back_to_single_product_lookup(client, monkeypatch) -> None:
    with engine.begin() as conn:
        conn.exec_driver_sql(
            """
            INSERT INTO premium_tiers (
                id, name, short_description, product_id, duration_days, tasks_per_day, is_active
            ) VALUES (6, 'Discipline Month', 'Thirty days of structure', 55, 30, 1, 1)
            """
        )

    monkeypatch.setattr('app.services.tier_service.list_payment_products', lambda active_only=False: [])
    monkeypatch.setattr(
        'app.services.tier_service.get_payment_product',
        lambda product_id: {'id': 55, 'price_pence': 3299, 'active': True} if str(product_id) == '55' else None,
    )

    response = client.get('/api/tiers/6')
    assert response.status_code == 200
    item = response.json()
    assert item['price'] == 32.99
    assert item['priceLabel'] == '£32.99'
