"""Run the evaluation harness once and store the result (demo prep).

    cd backend && python -m scripts.run_eval
"""

from app.db import models
from app.db.base import gen_id
from app.db.session import SessionLocal
from app.evaluation.harness import run_and_store, seed_cases


def main() -> int:
    db = SessionLocal()
    try:
        seed_cases(db)
        run = models.EvaluationRun(id=gen_id("eval"), status="running")
        db.add(run)
        db.commit()
        run_and_store(db, run)
        print(f"evaluation {run.status}:")
        for k, v in (run.metrics or {}).items():
            print(f"  {k}: {v}")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
