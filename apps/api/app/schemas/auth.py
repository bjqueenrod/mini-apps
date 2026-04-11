from __future__ import annotations

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class DevUserPayload(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = Field(default=None, alias="firstName")

    model_config = ConfigDict(populate_by_name=True)


class TelegramAuthRequest(BaseModel):
    init_data: str | None = Field(default=None, validation_alias="initData", serialization_alias="initData")
    dev_user: DevUserPayload | None = Field(default=None, validation_alias="devUser", serialization_alias="devUser")
    start_param: str | None = Field(
        default=None,
        validation_alias=AliasChoices("startParam", "start_param"),
        serialization_alias="startParam",
    )

    model_config = ConfigDict(populate_by_name=True)


class AuthUserResponse(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = Field(default=None, alias="firstName")

    model_config = ConfigDict(populate_by_name=True)


class TelegramAuthResponse(BaseModel):
    ok: bool = True
    user: AuthUserResponse
    session_expires_at: int = Field(alias="sessionExpiresAt")

    model_config = ConfigDict(populate_by_name=True)


class TelegramTrackOpenResponse(BaseModel):
    ok: bool = True
    tracked: bool = Field(
        description="True when a tracked start_param was forwarded to CMS miniapp-open successfully."
    )

    model_config = ConfigDict(populate_by_name=True)
