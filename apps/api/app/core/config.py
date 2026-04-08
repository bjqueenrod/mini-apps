from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    port: int = 8000
    app_env: Literal['development', 'test', 'production'] = 'development'
    database_url: str = Field(
        default='',
        validation_alias=AliasChoices('DATABASE_URL', 'MYSQL_URL', 'MYSQL_PRIVATE_URL'),
    )
    telegram_bot_token: str = Field(default='', alias='TELEGRAM_BOT_TOKEN')
    frontend_url: str = Field(default='http://localhost:5173', alias='FRONTEND_URL')
    session_secret: str = Field(default='change-me', alias='SESSION_SECRET')
    cors_allowed_origins: str = Field(default='http://localhost:5173', alias='CORS_ALLOWED_ORIGINS')
    bunny_stream_library_id: str = Field(default='', alias='BUNNY_STREAM_LIBRARY_ID')
    bunny_stream_api_key: str = Field(default='', alias='BUNNY_STREAM_API_KEY')
    bunny_stream_cdn_host: str = Field(default='', alias='BUNNY_STREAM_CDN_HOST')
    bunny_stream_embed_token_key: str = Field(default='', alias='BUNNY_STREAM_EMBED_TOKEN_KEY')
    bunny_preview_collection_id: str = Field(
        default='281a5ee9-db7e-41a2-bce0-97e16a7fd7b9',
        alias='BUNNY_PREVIEW_COLLECTION_ID',
    )
    clips_watch_product_id: int = Field(default=28, alias='CLIPS_WATCH_PRODUCT_ID')
    clips_download_product_id: int = Field(default=27, alias='CLIPS_DOWNLOAD_PRODUCT_ID')
    keyholding_api_base_url: str = Field(
        default='',
        validation_alias=AliasChoices('SLAVE_APPLICATION_API_URL', 'KEYHOLDING_API_BASE_URL'),
    )
    keyholding_api_token: str = Field(
        default='',
        validation_alias=AliasChoices('SLAVE_APPLICATION_API_TOKEN', 'KEYHOLDING_API_TOKEN'),
    )
    payment_system_api_url: str = Field(default='', alias='PAYMENT_SYSTEM_API_URL')
    payment_system_api_token: str = Field(default='', alias='PAYMENT_SYSTEM_API_TOKEN')
    payment_system_timeout_seconds: float = Field(default=4.0, alias='PAYMENT_SYSTEM_TIMEOUT_SECONDS')
    bot_username: str = Field(default='mistressbjqueenbot', alias='BOT_USERNAME')
    cms_api_url: str = Field(default='', alias='CMS_API_URL')
    cms_api_token: str = Field(default='', alias='CMS_API_TOKEN')
    cms_tracking_timeout_seconds: float = Field(default=4.0, alias='CMS_TRACKING_TIMEOUT_SECONDS')
    featured_tier_product_ids_raw: str = Field(default='', alias='FEATURED_TIER_PRODUCT_IDS')
    tracking_links_base_url: str = Field(default='', alias='TRACKING_LINKS_BASE_URL')
    tracking_clip_stream_slug: str = Field(default='', alias='TRACKING_CLIP_STREAM_SLUG')
    tracking_clip_download_slug: str = Field(default='', alias='TRACKING_CLIP_DOWNLOAD_SLUG')
    tracking_product_buy_slug: str = Field(default='', alias='TRACKING_PRODUCT_BUY_SLUG')

    @property
    def is_dev(self) -> bool:
        return self.app_env in {'development', 'test'}

    @property
    def allowed_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_allowed_origins.split(',') if item.strip()]

    @property
    def normalized_database_url(self) -> str:
        database_url = self.database_url.strip()
        if database_url.startswith('mysql://'):
            return f"mysql+pymysql://{database_url[len('mysql://'):]}"
        return database_url

    @property
    def normalized_bunny_cdn_host(self) -> str:
        host = self.bunny_stream_cdn_host.strip().rstrip('/')
        if not host:
            return ''
        if not host.startswith(('http://', 'https://')):
            host = f'https://{host}'
        return host

    @property
    def normalized_cms_api_url(self) -> str:
        return self.cms_api_url.strip().rstrip('/')

    @property
    def normalized_tracking_links_base_url(self) -> str:
        return self.tracking_links_base_url.strip().rstrip('/')

    @property
    def featured_tier_product_ids(self) -> list[str]:
        return [item.strip() for item in self.featured_tier_product_ids_raw.split(',') if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
