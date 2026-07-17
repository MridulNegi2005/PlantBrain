"""Run the ingestion pipeline over every registered document (demo prep).

    cd backend && python -m scripts.ingest_corpus [--force]

Extracts, chunks, and embeds each document into pgvector so the corpus is fully
searchable before the demo. Skips documents already completed unless --force.
"""

import sys

from app.db import models
from app.db.session import SessionLocal
from app.ingestion.pipeline import ingest_document


def main(force: bool = False) -> int:
    db = SessionLocal()
    try:
        docs = db.query(models.Document).order_by(models.Document.created_at).all()
        done = skipped = 0
        for doc in docs:
            if doc.status == "completed" and not force:
                skipped += 1
                continue
            job = ingest_document(db, doc.id)
            state = "OK" if job.status == "completed" else f"FAILED ({job.error})"
            print(f"  {doc.filename:32} {state}")
            done += 1
        total_chunks = db.query(models.Chunk).count()
        print(f"ingested {done} documents ({skipped} already done); {total_chunks} chunks total")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(force="--force" in sys.argv))
