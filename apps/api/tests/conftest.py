from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

TEST_DB = Path(__file__).parent / 'test.db'
os.environ.setdefault('APP_ENV', 'test')
os.environ.setdefault('DATABASE_URL', f'sqlite:///{TEST_DB}')
os.environ.setdefault('SESSION_SECRET', 'test-secret')
os.environ.setdefault('TELEGRAM_BOT_TOKEN', 'test-token')
os.environ.setdefault('BOT_USERNAME', 'mistressbjqueenbot')
os.environ.setdefault('FEATURED_TIER_PRODUCT_IDS', '26,23')

from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def setup_database() -> None:
    with engine.begin() as conn:
        conn.exec_driver_sql('DROP TABLE IF EXISTS clips')
        conn.exec_driver_sql('DROP TABLE IF EXISTS premium_tiers')
        conn.exec_driver_sql(
            """
            CREATE TABLE clips (
                clip_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                price_pence INTEGER NOT NULL DEFAULT 0,
                download_price_pence INTEGER NOT NULL DEFAULT 0,
                watch_price_pence INTEGER NOT NULL DEFAULT 0,
                keywords TEXT,
                hashtags TEXT,
                duration TEXT,
                filename TEXT,
                thumbnail_url TEXT,
                category TEXT,
                file_id TEXT,
                bunny_stream_video_id TEXT,
                bunny_download_storage_path TEXT,
                bunny_stream_preview_id TEXT,
                active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.exec_driver_sql(
            """
            CREATE TABLE premium_tiers (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                short_description TEXT,
                description TEXT,
                desc TEXT,
                product_id INTEGER,
                payment_product_id INTEGER,
                duration_days INTEGER,
                number_of_weeks INTEGER,
                tasks_per_day INTEGER,
                price REAL,
                price_value REAL,
                price_pence INTEGER,
                payment_product_price_pence INTEGER,
                payment_product_price_label TEXT,
                badge TEXT,
                display_order INTEGER,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.exec_driver_sql(
            """
            INSERT INTO clips (
                clip_id, title, description, price_pence, download_price_pence, watch_price_pence,
                keywords, hashtags, duration, filename, thumbnail_url, category, file_id,
                bunny_stream_video_id, bunny_download_storage_path, bunny_stream_preview_id, active
            ) VALUES
            ('BJQ0001', 'Locked Cage Tease Control', 'Tease, denial and frustration.', 1299, 1299, 999,
             'chastity,tease,denial', '#chastity #tease #denial', '13:32', 'clip1.mp4', 'https://images.example/custom-1.jpg', 'chastity', 'tg-file-1',
             'paid-stream-1', 'downloads/clip1.mp4', 'preview-1', 1),
            ('BJQ0002', 'Strict JOI Countdown', 'Countdown game clip.', 999, 999, 799,
             'joi,countdown', '#joi #countdown', '812', 'clip2.mp4', NULL, 'joi', 'tg-file-2',
             'paid-stream-2', 'downloads/clip2.mp4', NULL, 1),
            ('BJQ0003', 'Inactive Clip', 'Should not show.', 999, 999, 799,
             'inactive', '#inactive', '5:00', 'clip3.mp4', NULL, 'misc', 'tg-file-3',
             'paid-stream-3', 'downloads/clip3.mp4', NULL, 0)
            """
        )
        conn.exec_driver_sql(
            """
            INSERT INTO premium_tiers (
                id, name, short_description, description, desc, product_id, payment_product_id,
                duration_days, number_of_weeks, tasks_per_day, price, price_value, price_pence,
                payment_product_price_pence, payment_product_price_label, badge, display_order, is_active
            ) VALUES
            (1, 'Initiation', 'Quick try-out. Low commitment', 'A short obedience trial to establish the tone.', NULL, 19, NULL,
             3, NULL, 1, 19.99, NULL, NULL, NULL, NULL, NULL, NULL, 1),
            (2, 'Training Week', 'Build a habit for a week', NULL, 'Seven days of escalating obedience.', 21, NULL,
             7, NULL, 1, NULL, NULL, 2999, NULL, NULL, NULL, NULL, 1),
            (3, 'Unlimited Week', 'Full week of unlimited requests', NULL, 'A full week of on-demand tasks.', NULL, 26,
             7, NULL, 0, NULL, NULL, NULL, 4999, '$49.99', NULL, NULL, 1),
            (4, 'Control Month', 'More volume. Faster progress', 'A month-long package designed for heavier control.', NULL, 23, NULL,
             NULL, 4, 2, NULL, NULL, NULL, 8999, NULL, 'Best Value', 1, 1),
            (5, 'Inactive Tier', 'Should stay hidden', 'Hidden.', NULL, 99, NULL,
             30, NULL, 1, 99.00, NULL, NULL, NULL, NULL, NULL, NULL, 0)
            """
        )
    yield


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setattr(
        'app.services.clip_service.build_preview_assets',
        lambda preview_id: {
            'thumbnailUrl': f'https://cdn.example/{preview_id}/thumb.jpg' if preview_id else None,
            'previewWebpUrl': f'https://cdn.example/{preview_id}/preview.webp' if preview_id else None,
            'previewEmbedUrl': f'https://iframe.mediadelivery.net/embed/lib/{preview_id}' if preview_id else None,
            'previewType': 'video' if preview_id else None,
        },
    )
    return TestClient(app)
