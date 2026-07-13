import uuid

from fastapi import APIRouter

from app.api import fixtures

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])


@router.get("/cases")
def list_cases():
    return {"items": fixtures.EVALUATION_CASES, "total": len(fixtures.EVALUATION_CASES)}


@router.post("/run", status_code=202)
def run_evaluation():
    return {"run_id": f"eval_{uuid.uuid4().hex[:12]}", "status": "running"}


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    return {**fixtures.EVALUATION_RUN, "id": run_id}
