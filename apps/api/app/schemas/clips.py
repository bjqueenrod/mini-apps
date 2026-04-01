from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


SortOption = Literal["newest", "oldest", "price_asc", "price_desc", "title_asc", "title_desc"]


class ClipQueryParams(BaseModel):
    q: str | None = None
    category: str | None = None
    tags: str | None = None
    sort: SortOption = "newest"
    page: int = 1
    limit: int = 20

    model_config = ConfigDict(extra="ignore")


class ClipItemResponse(BaseModel):
    id: str
    title: str
    short_description: str | None = Field(default=None, alias="shortDescription")
    description: str | None = None
    price: float | None = None
    stream_price: float | None = Field(default=None, alias="streamPrice")
    download_price: float | None = Field(default=None, alias="downloadPrice")
    duration_seconds: int | None = Field(default=None, alias="durationSeconds")
    duration_label: str | None = Field(default=None, alias="durationLabel")
    thumbnail_url: str | None = Field(default=None, alias="thumbnailUrl")
    preview_webp_url: str | None = Field(default=None, alias="previewWebpUrl")
    preview_embed_url: str | None = Field(default=None, alias="previewEmbedUrl")
    preview_type: str | None = Field(default=None, alias="previewType")
    category: str | None = None
    tags: list[str] = []
    bot_stream_url: str = Field(alias="botStreamUrl")
    bot_download_url: str = Field(alias="botDownloadUrl")

    model_config = ConfigDict(populate_by_name=True)


class ClipHashtagOptionResponse(BaseModel):
    tag: str
    count: int


class ClipHashtagListResponse(BaseModel):
    items: list[ClipHashtagOptionResponse]


class ClipListResponse(BaseModel):
    items: list[ClipItemResponse]
    page: int
    limit: int
    total: int
    has_more: bool = Field(alias="hasMore")
    categories: list[str] = []

    model_config = ConfigDict(populate_by_name=True)
