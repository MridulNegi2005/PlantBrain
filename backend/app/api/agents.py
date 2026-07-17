from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agents import compliance as compliance_agent
from app.agents import lessons as lessons_agent
from app.agents import rca as rca_agent
from app.db.crud import write_audit
from app.db.session import get_db
from app.rag.copilot import answer as copilot_answer

router = APIRouter(prefix="/api", tags=["agents"])


class CopilotQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=4_000)
    asset_tag: str | None = Field(default=None, max_length=64)


class RCARequest(BaseModel):
    asset_tag: str = Field(min_length=1, max_length=64)
    issue: str = Field(min_length=1, max_length=4_000)


class ComplianceRequest(BaseModel):
    asset_tag: str = Field(min_length=1, max_length=64)


class SimilarLessonsRequest(BaseModel):
    failure_mode: str = Field(min_length=1, max_length=1_000)


@router.post("/copilot/ask")
def copilot_ask(payload: CopilotQuestion, db: Session = Depends(get_db)):
    result = copilot_answer(db, payload.question, asset_tag=payload.asset_tag)
    write_audit(db, action="copilot.ask", resource_type="asset",
                resource_id=payload.asset_tag, meta={"question": payload.question[:200]})
    db.commit()
    return result


@router.post("/rca/generate")
def rca_generate(payload: RCARequest, db: Session = Depends(get_db)):
    result = rca_agent.generate(db, payload.asset_tag, payload.issue)
    write_audit(db, action="rca.generate", resource_type="asset", resource_id=payload.asset_tag)
    db.commit()
    return result


@router.post("/compliance/check")
def compliance_check(payload: ComplianceRequest, db: Session = Depends(get_db)):
    result = compliance_agent.check(db, payload.asset_tag)
    write_audit(db, action="compliance.check", resource_type="asset", resource_id=payload.asset_tag)
    db.commit()
    return result


@router.post("/lessons/similar")
def lessons_similar(payload: SimilarLessonsRequest, db: Session = Depends(get_db)):
    return lessons_agent.similar(db, payload.failure_mode)
