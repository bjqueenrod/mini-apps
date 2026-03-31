from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import engine
from app.db.tier_mapping import TierFieldMapping, get_tier_mapping
from app.utils.bot_links import build_tier_buy_url

settings = get_settings()


def _first_value(data: dict[str, Any], *names: str) -> Any:
    for name in names:
        value = data.get(name)
        if value is not None and value != '':
            return value
    return None


def _text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _int(value: Any) -> int | None:
    if value in (None, ''):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _float(value: Any) -> float | None:
    if value in (None, ''):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        try:
            return float(Decimal(str(value)))
        except (InvalidOperation, ValueError):
            return None


def _price_from_cents(value: Any) -> float | None:
    cents = _int(value)
    if cents is None or cents <= 0:
        return None
    return round(cents / 100.0, 2)


def _format_price(value: float | None) -> str | None:
    if value is None:
        return None
    return f'${value:,.2f}'


def _duration_days(data: dict[str, Any]) -> int | None:
    direct = _int(_first_value(data, 'duration_days', 'durationDays'))
    if direct:
        return direct
    weeks = _int(_first_value(data, 'number_of_weeks', 'weeks', 'duration_weeks', 'durationWeeks'))
    if weeks:
        return weeks * 7
    return None


def _tasks_per_day(data: dict[str, Any]) -> int | None:
    return _int(_first_value(data, 'tasks_per_day', 'tasksPerDay', 'daily_task_limit'))


def _price_parts(data: dict[str, Any]) -> tuple[float | None, str | None]:
    label = _text(_first_value(data, 'payment_product_price_label', 'price_label', 'priceLabel'))
    direct = _float(_first_value(data, 'price', 'price_value', 'priceValue'))
    cents = _price_from_cents(_first_value(data, 'price_cents', 'payment_product_price_cents'))
    price = direct if direct is not None else cents
    if label:
        return price, label
    return price, _format_price(price)


def _short_description(text: str | None, *, max_length: int = 120) -> str | None:
    if not text:
        return None
    value = text.strip()
    if len(value) <= max_length:
        return value
    return value[: max_length - 1].rstrip() + '...'


def _is_active_filter(mapping: TierFieldMapping):
    active_col = mapping.get('is_active')
    if active_col is None:
        active_col = mapping.get('active')
    if active_col is None:
        return None
    return active_col == 1


def _bot_buy_url(product_id: str | None) -> str | None:
    if not product_id:
        return None
    return build_tier_buy_url(product_id)


def _badge(data: dict[str, Any]) -> str | None:
    return _text(_first_value(data, 'badge', 'badge_label', 'badgeLabel', 'featured_badge'))


def _row_to_item(row: Any) -> dict[str, Any]:
    data = dict(row._mapping)
    item_id = _text(_first_value(data, 'id', 'tier_id', 'product_id', 'payment_product_id', 'name')) or 'tier'
    name = _text(_first_value(data, 'name', 'title')) or item_id
    short_description = _text(_first_value(data, 'short_description', 'shortDescription'))
    description = _text(_first_value(data, 'description', 'desc'))
    product_id = _text(_first_value(data, 'product_id', 'payment_product_id', 'productId'))
    duration_days = _duration_days(data)
    tasks_per_day = _tasks_per_day(data)
    price, price_label = _price_parts(data)
    return {
        'id': item_id,
        'name': name,
        'shortDescription': short_description or _short_description(description),
        'description': description,
        'productId': product_id,
        'durationDays': duration_days,
        'tasksPerDay': tasks_per_day,
        'price': price,
        'priceLabel': price_label,
        'isUnlimitedTasks': tasks_per_day == 0,
        'badge': _badge(data),
        'botBuyUrl': _bot_buy_url(product_id),
    }


def _sort_key(item: dict[str, Any], order_value: int | None) -> tuple[Any, ...]:
    duration_days = item.get('durationDays')
    tasks_per_day = item.get('tasksPerDay')
    product_id = item.get('productId') or item.get('id')
    unlimited_sort = 1 if tasks_per_day == 0 else 0
    tasks_sort = tasks_per_day if tasks_per_day not in (None, 0) else 10**9
    return (
        order_value if order_value is not None else 10**9,
        duration_days if duration_days is not None else 10**9,
        unlimited_sort,
        tasks_sort,
        str(product_id),
    )


def _base_rows(db: Session) -> tuple[TierFieldMapping | None, list[Any]]:
    mapping = get_tier_mapping(engine)
    if mapping is None:
        return None, []
    stmt = select(mapping.table)
    active_filter = _is_active_filter(mapping)
    if active_filter is not None:
        stmt = stmt.where(and_(active_filter))
    rows = db.execute(stmt).all()
    return mapping, rows


def list_tiers(db: Session) -> dict[str, Any]:
    mapping, rows = _base_rows(db)
    if mapping is None:
        return {'items': [], 'total': 0}

    order_col = mapping.get('order')
    if order_col is None:
        order_col = mapping.get('sort_order')
    if order_col is None:
        order_col = mapping.get('display_order')
    items_with_order: list[tuple[dict[str, Any], int | None]] = []
    for row in rows:
        item = _row_to_item(row)
        items_with_order.append((item, _int(row._mapping.get(order_col.name)) if order_col is not None else None))

    items = [item for item, order_value in sorted(items_with_order, key=lambda pair: _sort_key(pair[0], pair[1]))]
    return {'items': items, 'total': len(items)}


def get_featured_tiers(db: Session) -> dict[str, Any]:
    featured_ids = settings.featured_tier_product_ids
    if not featured_ids:
        return {'items': [], 'total': 0}
    data = list_tiers(db)
    by_product_id = {str(item.get('productId')): item for item in data['items'] if item.get('productId')}
    items = [by_product_id[product_id] for product_id in featured_ids if product_id in by_product_id]
    return {'items': items, 'total': len(items)}


def get_tier_detail(db: Session, tier_id: str) -> dict[str, Any] | None:
    data = list_tiers(db)
    for item in data['items']:
        if item['id'] == tier_id:
            return item
    return None
