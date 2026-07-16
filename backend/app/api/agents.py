from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api import fixtures
from app.db.crud import write_audit
from app.db.session import get_db
from app.rag.copilot import answer as copilot_answer

router = APIRouter(prefix="/api", tags=["agents"])


class CopilotQuestion(BaseModel):
    question: str
    asset_tag: str | None = None


class RCARequest(BaseModel):
    asset_tag: str
    issue: str


class ComplianceRequest(BaseModel):
    asset_tag: str


class SimilarLessonsRequest(BaseModel):
    failure_mode: str


@router.post("/copilot/ask")
def copilot_ask(payload: CopilotQuestion, db: Session = Depends(get_db)):
    result = copilot_answer(db, payload.question, asset_tag=payload.asset_tag)
    write_audit(db, action="copilot.ask", resource_type="asset",
                resource_id=payload.asset_tag, meta={"question": payload.question[:200]})
    db.commit()
    return result


@router.post("/rca/generate")
def rca_generate(payload: RCARequest):
    return fixtures.RCA_REPORT


@router.post("/compliance/check")
def compliance_check(payload: ComplianceRequest):
    return fixtures.COMPLIANCE_REPORT


@router.post("/lessons/similar")
def lessons_similar(payload: SimilarLessonsRequest):
    return {"items": fixtures.SIMILAR_INCIDENTS}
