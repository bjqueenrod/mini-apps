from __future__ import annotations


def test_top_sellers_returns_ordered_selection(client, monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.clip_service.TOP_SELLER_CLIP_IDS",
        ("BJQ0002", "BJQ0001", "BJQ0999"),
    )
    response = client.get("/api/clips/top-sellers")
    assert response.status_code == 200
    payload = response.json()
    assert [item["id"] for item in payload["items"]] == ["BJQ0002", "BJQ0001"]
    assert payload["hasMore"] is False


def test_clips_use_payment_system_pricing(client, monkeypatch) -> None:
    pricing_map = {
        "BJQ0001": {
            "pricing": {
                "gbp": {"amount_pence": 1599, "formatted": "£15.99"},
                "usd": {"amount_pence": 1999, "formatted": "$19.99"},
            },
            "stream_pricing": {
                "gbp": {"amount_pence": 1599, "formatted": "£15.99"},
                "usd": {"amount_pence": 1999, "formatted": "$19.99"},
            },
            "download_pricing": {
                "gbp": {"amount_pence": 1099, "formatted": "£10.99"},
                "usd": {"amount_pence": 1399, "formatted": "$13.99"},
            },
        },
        "BJQ0002": {
            "pricing": {
                "gbp": {"amount_pence": 1199, "formatted": "£11.99"},
                "usd": {"amount_pence": 1499, "formatted": "$14.99"},
            },
            "stream_pricing": {
                "gbp": {"amount_pence": 1199, "formatted": "£11.99"},
                "usd": {"amount_pence": 1499, "formatted": "$14.99"},
            },
            "download_pricing": {
                "gbp": {"amount_pence": 899, "formatted": "£8.99"},
                "usd": {"amount_pence": 1099, "formatted": "$10.99"},
            },
        },
    }
    monkeypatch.setattr(
        "app.services.clip_service.get_clip_pricings",
        lambda clip_ids: {
            str(clip_id).upper(): pricing_map[str(clip_id).upper()]
            for clip_id in clip_ids
            if str(clip_id).upper() in pricing_map
        },
    )

    search_response = client.get("/api/clips", params={"q": "countdown"})
    assert search_response.status_code == 200
    search_payload = search_response.json()
    assert search_payload["items"][0]["pricing"]["gbp"]["formatted"] == "£11.99"

    new_response = client.get("/api/clips/new")
    assert new_response.status_code == 200
    new_payload = new_response.json()
    assert new_payload["items"][0]["pricing"]["gbp"]["formatted"] == "£11.99"

    monkeypatch.setattr(
        "app.services.clip_service.TOP_SELLER_CLIP_IDS",
        ("BJQ0002", "BJQ0001"),
    )
    top_response = client.get("/api/clips/top-sellers")
    assert top_response.status_code == 200
    top_payload = top_response.json()
    assert top_payload["items"][0]["pricing"]["gbp"]["formatted"] == "£11.99"
    assert top_payload["items"][1]["downloadPricing"]["gbp"]["formatted"] == "£10.99"



def test_new_clips_returns_highest_clip_ids_first(client) -> None:
    response = client.get("/api/clips/new")
    assert response.status_code == 200
    payload = response.json()
    assert [item["id"] for item in payload["items"]] == ["BJQ0002", "BJQ0001"]
    assert payload["hasMore"] is False


def test_health(client) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}



def test_list_clips_filters_inactive_and_returns_preview(client) -> None:
    response = client.get("/api/clips")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert len(payload["items"]) == 2
    first = payload["items"][0]
    assert first["id"] in {"BJQ0001", "BJQ0002"}
    active_ids = {item["id"] for item in payload["items"]}
    assert "BJQ0003" not in active_ids


def test_list_clips_page_two_skips_total_count_for_performance(client) -> None:
    """Deep pages omit COUNT(*); total is 0 and hasMore uses limit+1 window."""
    response = client.get("/api/clips", params={"page": 2, "limit": 1})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 0
    assert payload["page"] == 2
    assert len(payload["items"]) == 1
    assert payload["hasMore"] is False

    page1 = client.get("/api/clips", params={"page": 1, "limit": 1}).json()
    assert page1["total"] == 2
    assert page1["hasMore"] is True



def test_custom_thumbnail_url_overrides_bunny_thumbnail(client) -> None:
    response = client.get("/api/clips/BJQ0001")
    assert response.status_code == 200
    item = response.json()
    assert item["thumbnailUrl"] == "https://images.example/custom-1.jpg"
    assert item["previewWebpUrl"] == "https://cdn.example/preview-1/preview.webp"


def test_search_and_category_filter(client) -> None:
    response = client.get("/api/clips", params={"q": "countdown", "category": "joi"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == "BJQ0002"


def test_search_matches_clip_id(client) -> None:
    response = client.get("/api/clips", params={"q": "bjq0001"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == "BJQ0001"



def test_clip_hashtags_returns_all_active_tags(client) -> None:
    response = client.get("/api/clips/hashtags")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"] == [
        {"tag": "chastity", "count": 1},
        {"tag": "countdown", "count": 1},
        {"tag": "denial", "count": 1},
        {"tag": "joi", "count": 1},
        {"tag": "tease", "count": 1},
    ]


def test_clip_detail_returns_bot_links_and_hides_paid_urls(client) -> None:
    response = client.get("/api/clips/BJQ0001")
    assert response.status_code == 200
    item = response.json()
    assert item["botStreamUrl"].endswith("stream_BJQ0001")
    assert item["botDownloadUrl"].endswith("download_BJQ0001")
    assert "bunny_stream_video_id" not in item
    assert item["previewEmbedUrl"].endswith("preview-1")


def test_clip_detail_uses_payment_system_pricing(client, monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.clip_service.get_clip_pricing",
        lambda clip_id: {
            "pricing": {
                "gbp": {"amount_pence": 1599, "formatted": "£15.99"},
                "usd": {"amount_pence": 1999, "formatted": "$19.99"},
            },
            "stream_pricing": {
                "gbp": {"amount_pence": 1599, "formatted": "£15.99"},
                "usd": {"amount_pence": 1999, "formatted": "$19.99"},
            },
            "download_pricing": {
                "gbp": {"amount_pence": 1099, "formatted": "£10.99"},
                "usd": {"amount_pence": 1399, "formatted": "$13.99"},
            },
        }
        if str(clip_id).upper() == "BJQ0001"
        else None,
    )

    response = client.get("/api/clips/BJQ0001")
    assert response.status_code == 200
    item = response.json()
    assert item["pricing"]["gbp"]["formatted"] == "£15.99"
    assert item["streamPricing"]["gbp"]["formatted"] == "£15.99"
    assert item["downloadPricing"]["gbp"]["formatted"] == "£10.99"
    assert item["botStreamUrl"].endswith("stream_BJQ0001")
    assert item["botDownloadUrl"].endswith("download_BJQ0001")
    assert "bunny_stream_video_id" not in item
    assert item["previewEmbedUrl"].endswith("preview-1")


def test_clip_detail_reuses_base_payment_pricing_when_specific_buckets_missing(client, monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.clip_service.get_clip_pricing",
        lambda clip_id: {
            "pricing": {
                "gbp": {"amount_pence": 1599, "formatted": "£15.99"},
                "usd": {"amount_pence": 1999, "formatted": "$19.99"},
            }
        }
        if str(clip_id).upper() == "BJQ0001"
        else None,
    )

    response = client.get("/api/clips/BJQ0001")
    assert response.status_code == 200
    item = response.json()
    assert item["pricing"]["usd"]["formatted"] == "$19.99"
    assert item["streamPricing"]["usd"]["formatted"] == "$19.99"
    assert item["downloadPricing"]["usd"]["formatted"] == "$19.99"


def test_clip_detail_uses_tracking_redirect_urls_when_configured(client, monkeypatch) -> None:
    monkeypatch.setattr('app.utils.bot_links._build_tracked_redirect_url', lambda slug, payload=None: f'https://links.mistressbjqueen.com/{slug}?payload={payload}')
    monkeypatch.setattr('app.utils.bot_links.get_settings', lambda: type('S', (), {
        'tracking_clip_stream_slug': 'clip-stream',
        'tracking_clip_download_slug': 'clip-download',
        'tracking_product_buy_slug': '',
        'normalized_tracking_links_base_url': 'https://links.mistressbjqueen.com',
        'bot_username': 'mistressbjqueenbot',
    })())

    response = client.get("/api/clips/BJQ0001")
    assert response.status_code == 200
    item = response.json()
    assert item["botStreamUrl"] == "https://links.mistressbjqueen.com/clip-stream?payload=stream_BJQ0001"
    assert item["botDownloadUrl"] == "https://links.mistressbjqueen.com/clip-download?payload=download_BJQ0001"
