from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db

router = APIRouter(prefix="/api", tags=["admin"])


@router.get("/audit-logs")
def list_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(200).all()
    items = [{
        "id": log.id, "actor": log.actor, "action": log.action,
        "resource_type": log.resource_type, "resource_id": log.resource_id,
        "created_at": log.created_at.isoformat(),
    } for log in logs]
    return {"items": items, "total": len(items)}


@router.get("/security-events")
def list_security_events(db: Session = Depends(get_db)):
    events = db.query(models.SecurityEvent).order_by(
        models.SecurityEvent.created_at.desc()).limit(200).all()
    items = [{
        "id": e.id, "event_type": e.event_type, "resource_id": e.resource_id,
        "detail": e.detail, "created_at": e.created_at.isoformat(),
    } for e in events]
    return {"items": items, "total": len(items)}
