import hashlib
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api import fixtures
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["documents"])

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "text/csv",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


@router.post("/documents/upload", status_code=201)
async def upload_document(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
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

    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    file_hash = hashlib.sha256(contents).hexdigest()

    return {
        "id": doc_id,
        "filename": file.filename,
        "doc_type": "unclassified",
        "status": "uploaded",
        "hash_sha256": file_hash,
        "created_at": "2026-07-13T10:00:00Z",
    }


@router.get("/documents")
def list_documents():
    return {"items": fixtures.DOCUMENTS, "total": len(fixtures.DOCUMENTS)}


@router.get("/documents/{document_id}")
def get_document(document_id: str):
    for doc in fixtures.DOCUMENTS:
        if doc["id"] == document_id:
            return {**doc, "page_count": 3, "chunks_count": 12}
    raise HTTPException(status_code=404, detail={"error": {
        "code": "not_found", "message": f"Document {document_id} not found.",
    }})


@router.post("/documents/{document_id}/ingest", status_code=202)
def trigger_ingest(document_id: str):
    return {"ingestion_job_id": f"job_{uuid.uuid4().hex[:12]}", "status": "queued"}


@router.get("/ingestion-jobs/{job_id}")
def get_ingestion_job(job_id: str):
    states = ["uploaded", "extracting", "chunking", "embedding", "graph_building", "completed"]
    return {
        "id": job_id,
        "document_id": "doc_01HXYZ",
        "status": "embedding",
        "states": states,
        "current_state_index": 3,
        "error": None,
        "updated_at": "2026-07-13T10:00:05Z",
    }
