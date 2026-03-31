from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from sqlalchemy import MetaData, Table, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.sql.schema import Column


@dataclass(slots=True)
class TierFieldMapping:
    table: Table
    columns: set[str]

    def get(self, name: str) -> Column[Any] | None:
        return self.table.c.get(name)

    def has(self, name: str) -> bool:
        return name in self.columns


@lru_cache(maxsize=1)
def get_tier_mapping(engine: Engine) -> TierFieldMapping | None:
    metadata = MetaData()
    try:
        table = Table('premium_tiers', metadata, autoload_with=engine)
    except NoSuchTableError:
        return None
    inspector = inspect(engine)
    columns = {column['name'] for column in inspector.get_columns('premium_tiers')}
    return TierFieldMapping(table=table, columns=columns)
