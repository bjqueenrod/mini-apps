from __future__ import annotations

from app.utils.duration import format_duration_label, parse_duration_seconds
from app.utils.tags import parse_tags



def test_parse_tags_handles_hashtags_only() -> None:
    assert parse_tags("#c #d") == ["c", "d"]



def test_parse_duration_seconds_supports_clock_and_digits() -> None:
    assert parse_duration_seconds("13:32") == 812
    assert parse_duration_seconds("812") == 812
    assert format_duration_label("812") == "13:32"
