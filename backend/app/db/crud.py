"""Small DB helpers shared across routers."""

from sqlalchemy.orm import Session

from app.db import models
from app.db.base import gen_id


def write_audit(db: Session, *, action: str, actor: str | None = None,
                resource_type: str | None = None, resource_id: str | None = None,
                meta: dict | None = None) -> None:
    db.add(models.AuditLog(
        id=gen_id("log"), actor=actor, action=action,
        resource_type=resource_type, resource_id=resource_id, meta=meta or {},
    ))


def document_counts_by_asset(db: Session) -> dict[str, int]:
    """Count documents per asset tag (asset_tags is a JSON array on Document)."""
    counts: dict[str, int] = {}
    for (tags,) in db.query(models.Document.asset_tags).all():
        for tag in tags or []:
            counts[tag] = counts.get(tag, 0) + 1
    return counts
