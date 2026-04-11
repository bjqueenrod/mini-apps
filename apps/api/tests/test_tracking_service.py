from __future__ import annotations

from app.services.tracking_service import is_tracked_start_param, resolve_effective_start_param


def test_is_tracked_start_param_accepts_core_tracking_values() -> None:
    assert is_tracked_start_param("l_1z")
    assert is_tracked_start_param("l_1z__tier_id_3")


def test_is_tracked_start_param_accepts_clips_tracking_values() -> None:
    assert is_tracked_start_param("clips__l_e")
    assert is_tracked_start_param("clips_BJQ0169__l_e")
    assert is_tracked_start_param("clips_BJQ0169__l_e__offer_1")


def test_is_tracked_start_param_rejects_non_tracking_values() -> None:
    assert not is_tracked_start_param(None)
    assert not is_tracked_start_param("")
    assert not is_tracked_start_param("clips")
    assert not is_tracked_start_param("clips_BJQ0169")


def test_resolve_effective_start_param_prefers_client_when_signed_is_untracked() -> None:
    assert resolve_effective_start_param("clips", "clips_BJQ0169__l_e") == "clips_BJQ0169__l_e"
    assert resolve_effective_start_param("clips_BJQ0169", "clips_BJQ0169__l_e") == "clips_BJQ0169__l_e"


def test_resolve_effective_start_param_prefers_signed_when_both_tracked() -> None:
    assert resolve_effective_start_param("clips_BJQ0169__l_e", "l_1z") == "clips_BJQ0169__l_e"


def test_resolve_effective_start_param_empty_signed_uses_client() -> None:
    assert resolve_effective_start_param(None, "clips_BJQ0169__l_e") == "clips_BJQ0169__l_e"
    assert resolve_effective_start_param("", "l_1z") == "l_1z"
