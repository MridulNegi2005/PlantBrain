"""UTC datetime helpers shared by API serializers and database models."""

from __future__ import annotations

import datetime as dt


UTC = dt.timezone.utc


def utc_now() -> dt.datetime:
    return dt.datetime.now(UTC)


def utc_iso(value: dt.datetime | None) -> str | None:
    """Serialize a datetime as canonical UTC, treating SQLite-naive values as UTC."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    else:
        value = value.astimezone(UTC)
    return value.isoformat().replace("+00:00", "Z")
