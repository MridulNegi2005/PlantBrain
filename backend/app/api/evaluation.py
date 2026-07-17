import datetime as dt

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import models
from app.db.base import gen_id
from app.db.session import SessionLocal, get_db
from app.evaluation.harness import run_and_store, seed_cases

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])


@router.get("/cases")
def list_cases(db: Session = Depends(get_db)):
    seed_cases(db)
    cases = db.query(models.EvaluationCase).all()
    items = [{"id": c.id, "question": c.question, "category": c.category} for c in cases]
    return {"items": items, "total": len(items)}


def _run_bg(run_id: str, bind=None):
    db = SessionLocal() if bind is None else Session(bind=bind)
    try:
        run = db.get(models.EvaluationRun, run_id)
        if run:
            run_and_store(db, run)
    finally:
        db.close()


@router.post("/run", status_code=202)
def run_evaluation(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    run = models.EvaluationRun(id=gen_id("eval"), status="running")
    db.add(run)
    db.commit()
    background_tasks.add_task(_run_bg, run.id, db.get_bind())
    return {"run_id": run.id, "status": run.status}


@router.get("/runs/{run_id}")
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.get(models.EvaluationRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail={"error": {
            "code": "not_found", "message": f"Run {run_id} not found."}})
    return {
        "id": run.id, "status": run.status,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "metrics": run.metrics or {},
    }


@router.get("/runs")
def latest_run(db: Session = Depends(get_db)):
    run = db.query(models.EvaluationRun).filter(
        models.EvaluationRun.status == "completed").order_by(
        models.EvaluationRun.created_at.desc()).first()
    if run is None:
        return {"id": None, "status": "none", "metrics": {}}
    return {"id": run.id, "status": run.status,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "metrics": run.metrics or {}}
