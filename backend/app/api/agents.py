from fastapi import APIRouter
from pydantic import BaseModel

from app.api import fixtures

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
def copilot_ask(payload: CopilotQuestion):
    return fixtures.COPILOT_ANSWER


@router.post("/rca/generate")
def rca_generate(payload: RCARequest):
    return fixtures.RCA_REPORT


@router.post("/compliance/check")
def compliance_check(payload: ComplianceRequest):
    return fixtures.COMPLIANCE_REPORT


@router.post("/lessons/similar")
def lessons_similar(payload: SimilarLessonsRequest):
    return {"items": fixtures.SIMILAR_INCIDENTS}
