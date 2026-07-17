"""Lessons-learned / similar-incident agent.

Semantic retrieval over incident reports for a given failure mode — surfaces past
incidents (and their lessons) similar to the current situation, with citations.
"""

from __future__ import annotations

from pathlib import Path

from sqlalchemy.orm import Session

from app.ingestion.embed import embed_query
from app.ingestion.vectorstore import search


def _quote(text: str, n: int = 220) -> str:
    return " ".join(text.split())[:n]


def similar(db: Session, failure_mode: str, *, limit: int = 5) -> dict:
    hits = search(db, embed_query(failure_mode), k=12)
    incidents = [h for h in hits if h["doc_type"] == "incident_report"][:limit]
    items = [{
        "incident_id": Path(h["filename"]).stem,
        "similarity": round(h["score"], 3),
        "summary": _quote(h["text"]),
        "citations": [{"document": h["filename"], "page": h["page"]}],
    } for h in incidents]
    return {"items": items}
