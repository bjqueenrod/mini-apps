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



def test_clip_detail_returns_bot_links_and_hides_paid_urls(client) -> None:
    response = client.get("/api/clips/BJQ0001")
    assert response.status_code == 200
    item = response.json()
    assert item["botStreamUrl"].endswith("stream_BJQ0001")
    assert item["botDownloadUrl"].endswith("download_BJQ0001")
    assert "bunny_stream_video_id" not in item
    assert item["previewEmbedUrl"].endswith("preview-1")
