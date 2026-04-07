from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class MiniAppAnalyticsEventRequest(BaseModel):
    event_name: str = Field(validation_alias=AliasChoices("eventName", "event_name"), serialization_alias="eventName")
    occurred_at: datetime | None = Field(
        default=None,
        validation_alias=AliasChoices("occurredAt", "occurred_at"),
        serialization_alias="occurredAt",
    )
    screen: str | None = None
    flow_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("flowId", "flow_id"),
        serialization_alias="flowId",
    )
    action_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("actionKey", "action_key"),
        serialization_alias="actionKey",
    )
    dedupe_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("dedupeKey", "dedupe_key"),
        serialization_alias="dedupeKey",
    )
    received_start_param: str | None = Field(
        default=None,
        validation_alias=AliasChoices("receivedStartParam", "received_start_param"),
        serialization_alias="receivedStartParam",
    )
    properties: dict[str, Any] | None = None

    model_config = ConfigDict(populate_by_name=True)


class MiniAppAnalyticsResponse(BaseModel):
    accepted: bool
