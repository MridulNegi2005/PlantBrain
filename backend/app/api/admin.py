from fastapi import APIRouter

from app.api import fixtures

router = APIRouter(prefix="/api", tags=["admin"])


@router.get("/audit-logs")
def list_audit_logs():
    return {"items": fixtures.AUDIT_LOGS, "total": len(fixtures.AUDIT_LOGS)}


@router.get("/security-events")
def list_security_events():
    return {"items": fixtures.SECURITY_EVENTS, "total": len(fixtures.SECURITY_EVENTS)}
