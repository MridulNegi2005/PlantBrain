"""Ingestion pipeline: extract -> pages -> chunk -> embed -> store.

Drives the IngestionJob status through the state machine to `completed`. Embeddings
are computed + stored only on Postgres (pgvector); on SQLite (hermetic tests) that
step is skipped so extraction/chunking can be tested without downloading a model.
`graph_building` is a no-op here — the knowledge graph is built in Interval 3.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.db import models
from app.db.base import gen_id
from app.db.crud import write_audit
from app.db.session import SessionLocal
from app.ingestion.chunk import chunk_pages
from app.ingestion.extract import extract_pages

logger = logging.getLogger(__name__)


def _set_status(db: Session, job: models.IngestionJob, status: str) -> None:
    job.status = status
    db.commit()


def process(db: Session, document_id: str, job: models.IngestionJob,
            *, compute_embeddings: bool | None = None) -> None:
    doc = db.get(models.Document, document_id)
    if doc is None:
        _fail(db, job, "document not found")
        return
    if compute_embeddings is None:
        compute_embeddings = db.bind.dialect.name == "postgresql"

    try:
        _set_status(db, job, "extracting")
        pages = extract_pages(doc.storage_path)

        # Replace any previous ingestion output for this document (idempotent re-ingest).
        db.query(models.Chunk).filter(models.Chunk.document_id == document_id).delete()
        db.query(models.DocumentPage).filter(
            models.DocumentPage.document_id == document_id).delete()
        for i, page_text in enumerate(pages, start=1):
            db.add(models.DocumentPage(
                id=gen_id("pg"), document_id=document_id, page_number=i, text=page_text))
        doc.page_count = len(pages)

        _set_status(db, job, "chunking")
        chunk_defs = chunk_pages(pages)
        rows: list[tuple[str, str]] = []
        for cd in chunk_defs:
            cid = gen_id("chunk")
            db.add(models.Chunk(
                id=cid, document_id=document_id, page_number=cd["page"],
                text=cd["text"], asset_tags=doc.asset_tags or []))
            rows.append((cid, cd["text"]))
        db.commit()

        if compute_embeddings and rows:
            _set_status(db, job, "embedding")
            from app.ingestion.embed import embed_texts
            from app.ingestion.vectorstore import store_embeddings
            vecs = embed_texts([t for _, t in rows])
            store_embeddings(db, [(cid, v) for (cid, _), v in zip(rows, vecs)])
            db.commit()

        _set_status(db, job, "graph_building")  # KG built in Interval 3
        doc.status = "completed"
        _set_status(db, job, "completed")
        write_audit(db, action="document.ingested", resource_type="document",
                    resource_id=document_id, meta={"chunks": len(rows)})
        db.commit()
    except Exception as exc:  # noqa: BLE001
        logger.exception("ingestion failed for %s", document_id)
        _fail(db, job, str(exc))


def _fail(db: Session, job: models.IngestionJob, message: str) -> None:
    db.rollback()
    job.status = "failed"
    job.error = message[:2000]
    db.commit()


def ingest_document(db: Session, document_id: str,
                    *, compute_embeddings: bool | None = None) -> models.IngestionJob:
    """Create a job and run the pipeline synchronously (used by the batch script)."""
    job = models.IngestionJob(id=gen_id("job"), document_id=document_id, status="queued")
    db.add(job)
    db.commit()
    process(db, document_id, job, compute_embeddings=compute_embeddings)
    return job


def run_ingestion_bg(document_id: str, job_id: str) -> None:
    """Background-task entrypoint: owns its own session (the request session is gone)."""
    db = SessionLocal()
    try:
        job = db.get(models.IngestionJob, job_id)
        if job is not None:
            process(db, document_id, job)
    finally:
        db.close()
