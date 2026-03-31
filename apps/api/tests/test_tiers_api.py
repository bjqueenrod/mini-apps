from __future__ import annotations


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
    assert item['priceLabel'] == '$49.99'
    assert item['isUnlimitedTasks'] is True
    assert item['botBuyUrl'].endswith('buy_26')


def test_tier_detail_uses_week_fallback_for_duration(client) -> None:
    response = client.get('/api/tiers/4')
    assert response.status_code == 200
    item = response.json()
    assert item['durationDays'] == 28
    assert item['badge'] == 'Best Value'
    assert item['price'] == 89.99
