import hashlib
import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import models
from app.db.base import gen_id
from app.db.crud import write_audit
from app.db.seed import PLANT_ID
from app.db.session import get_db

router = APIRouter(prefix="/api", tags=["documents"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"

ALLOWED_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "text/csv": ".csv",
    "text/plain": ".txt",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
}

INGESTION_STATES = ["uploaded", "extracting", "chunking", "embedding", "graph_building", "completed"]


def _doc_out(doc: models.Document) -> dict:
    return {
        "id": doc.id,
        "filename": doc.filename,
        "doc_type": doc.doc_type,
        "status": doc.status,
        "asset_tags": doc.asset_tags or [],
        "created_at": doc.created_at.isoformat(),
    }


@router.post("/documents/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    plant_id: str = Form(PLANT_ID),
    db: Session = Depends(get_db),
):
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type)
    if ext is None:
        raise HTTPException(status_code=415, detail={"error": {
            "code": "unsupported_media_type",
            "message": f"Content type {file.content_type} is not allowed.",
        }})

    max_bytes = settings.max_upload_mb * 1024 * 1024
    chunk_size = 1024 * 1024
    contents = bytearray()
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        contents.extend(chunk)
        if len(contents) > max_bytes:
            raise HTTPException(status_code=413, detail={"error": {
                "code": "file_too_large",
                "message": f"File exceeds {settings.max_upload_mb}MB limit.",
            }})

    doc_id = gen_id("doc")
    file_hash = hashlib.sha256(contents).hexdigest()

    # Store under a server-generated name (never the client filename) to avoid path
    # traversal; the original name is preserved only as metadata.
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    storage_path = UPLOAD_DIR / f"{doc_id}{ext}"
    storage_path.write_bytes(contents)

    doc = models.Document(
        id=doc_id, plant_id=plant_id, filename=file.filename or f"{doc_id}{ext}",
        doc_type="unclassified", status="uploaded",
        storage_path=str(storage_path), hash_sha256=file_hash, asset_tags=[],
    )
    db.add(doc)
    write_audit(db, action="document.upload", resource_type="document", resource_id=doc_id)
    db.commit()

    return {
        "id": doc.id, "filename": doc.filename, "doc_type": doc.doc_type,
        "status": doc.status, "hash_sha256": doc.hash_sha256,
        "created_at": doc.created_at.isoformat(),
    }


@router.get("/documents")
def list_documents(
    doc_type: str | None = None,
    asset_tag: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Document)
    if doc_type:
        q = q.filter(models.Document.doc_type == doc_type)
    if status:
        q = q.filter(models.Document.status == status)
    docs = q.order_by(models.Document.created_at.desc()).all()
    if asset_tag:
        docs = [d for d in docs if asset_tag in (d.asset_tags or [])]
    return {"items": [_doc_out(d) for d in docs], "total": len(docs)}


@router.get("/documents/{document_id}")
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(models.Document, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail={"error": {
            "code": "not_found", "message": f"Document {document_id} not found.",
        }})
    chunks_count = db.query(models.Chunk).filter(
        models.Chunk.document_id == document_id).count()
    return {**_doc_out(doc), "page_count": doc.page_count, "chunks_count": chunks_count}


@router.get("/documents/{document_id}/chunks")
def get_document_chunks(document_id: str, db: Session = Depends(get_db)):
    """Page-level chunks for the evidence/citation view. Real chunks arrive with the
    Interval 2 ingestion pipeline; until then a small stub sample is returned so the
    frontend evidence drawer can be built against the real shape."""
    doc = db.get(models.Document, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail={"error": {
            "code": "not_found", "message": f"Document {document_id} not found.",
        }})
    chunks = (
        db.query(models.Chunk)
        .filter(models.Chunk.document_id == document_id)
        .order_by(models.Chunk.page_number)
        .all()
    )
    if chunks:
        items = [{
            "chunk_id": c.id, "page": c.page_number, "text": c.text,
            "bbox": c.bbox, "asset_tags": c.asset_tags or [],
        } for c in chunks]
        return {"items": items, "total": len(items), "stub": False}

    sample = [{
        "chunk_id": f"{document_id}_stub_1", "page": 1,
        "text": f"[Sample chunk — real chunks populate after ingestion] {doc.filename}",
        "bbox": None, "asset_tags": doc.asset_tags or [],
    }]
    return {"items": sample, "total": len(sample), "stub": True}


@router.post("/documents/{document_id}/ingest", status_code=202)
def trigger_ingest(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(models.Document, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail={"error": {
            "code": "not_found", "message": f"Document {document_id} not found.",
        }})
    job = models.IngestionJob(id=gen_id("job"), document_id=document_id, status="queued")
    db.add(job)
    write_audit(db, action="document.ingest", resource_type="document", resource_id=document_id)
    db.commit()
    # Actual pipeline execution lands in Interval 2; for now the job is queued.
    return {"ingestion_job_id": job.id, "status": job.status}


@router.get("/ingestion-jobs/{job_id}")
def get_ingestion_job(job_id: str, db: Session = Depends(get_db)):
    job = db.get(models.IngestionJob, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail={"error": {
            "code": "not_found", "message": f"Ingestion job {job_id} not found.",
        }})
    try:
        idx = INGESTION_STATES.index(job.status)
    except ValueError:
        idx = 0
    return {
        "id": job.id, "document_id": job.document_id, "status": job.status,
        "states": INGESTION_STATES, "current_state_index": idx,
        "error": job.error, "updated_at": job.updated_at.isoformat(),
    }
