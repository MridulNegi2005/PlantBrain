from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.core.time import utc_iso

router = APIRouter(prefix="/api", tags=["admin"])


@router.get("/audit-logs")
def list_audit_logs(db: Session = Depends(get_db)):
    query = db.query(models.AuditLog)
    total = query.count()
    logs = query.order_by(models.AuditLog.created_at.desc()).limit(200).all()
    items = [{
        "id": log.id, "actor": log.actor, "action": log.action,
        "resource_type": log.resource_type, "resource_id": log.resource_id,
        "created_at": utc_iso(log.created_at),
    } for log in logs]
    return {"items": items, "total": total}


@router.get("/security-events")
def list_security_events(db: Session = Depends(get_db)):
    query = db.query(models.SecurityEvent)
    total = query.count()
    events = query.order_by(models.SecurityEvent.created_at.desc()).limit(200).all()
    items = [{
        "id": e.id, "event_type": e.event_type, "resource_id": e.resource_id,
        "detail": e.detail, "created_at": utc_iso(e.created_at),
    } for e in events]
    return {"items": items, "total": total}
