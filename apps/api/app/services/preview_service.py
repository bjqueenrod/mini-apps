from __future__ import annotations

from functools import lru_cache

from app.core.bunny import BunnyConfigError, BunnyPreviewClient


@lru_cache(maxsize=1)
def get_preview_client() -> BunnyPreviewClient:
    return BunnyPreviewClient()



def build_preview_assets(
    preview_id: str | None,
    *,
    include_embed_url: bool = True,
    resolve_thumbnail_metadata: bool = True,
    verify_embed_access: bool = True,
) -> dict[str, str | None]:
    if not preview_id:
        return {
            "thumbnailUrl": None,
            "previewWebpUrl": None,
            "previewEmbedUrl": None,
            "previewType": None,
        }
    client = get_preview_client()
    preview_webp_url = client.build_preview_webp_url(preview_id)

    thumbnail_url = preview_webp_url
    if resolve_thumbnail_metadata:
        try:
            video = client.get_video(preview_id)
        except (BunnyConfigError, Exception):
            video = {}
        thumbnail_file_name = str(video.get("thumbnailFileName") or "").strip() or None
        thumbnail_url = client.build_thumbnail_url(preview_id, thumbnail_file_name) or preview_webp_url

    preview_embed_url = None
    if include_embed_url:
        try:
            candidate_embed_url = client.build_embed_url(preview_id)
            if not verify_embed_access or client.is_embed_url_accessible(candidate_embed_url):
                preview_embed_url = candidate_embed_url
        except BunnyConfigError:
            preview_embed_url = None

    return {
        "thumbnailUrl": thumbnail_url,
        "previewWebpUrl": preview_webp_url,
        "previewEmbedUrl": preview_embed_url,
        "previewType": "video" if preview_embed_url else ("image" if thumbnail_url else None),
    }
