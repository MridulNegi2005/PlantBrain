"""pgvector-backed embedding storage and similarity search.

Embeddings live in the `chunks.embedding` column (vector(384), added by the
bootstrap). Vectors are passed as pgvector text literals cast to `vector`, so no
extra driver adapters are required.
"""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session


def _literal(vec: list[float]) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"


def store_embeddings(db: Session, rows: list[tuple[str, list[float]]]) -> None:
    for chunk_id, vec in rows:
        db.execute(
            text("UPDATE chunks SET embedding = CAST(:emb AS vector) WHERE id = :id"),
            {"emb": _literal(vec), "id": chunk_id},
        )


def search(db: Session, query_vec: list[float], *, k: int = 5,
           asset_tag: str | None = None) -> list[dict]:
    """Cosine-nearest chunks. Used by the Interval 3 retriever."""
    params: dict = {"q": _literal(query_vec), "k": k}
    filter_sql = ""
    if asset_tag:
        filter_sql = "AND c.asset_tags::jsonb @> CAST(:tag AS jsonb)"
        params["tag"] = f'["{asset_tag}"]'
    rows = db.execute(text(f"""
        SELECT c.id, c.document_id, c.page_number, c.text,
               d.filename, d.doc_type,
               1 - (c.embedding <=> CAST(:q AS vector)) AS score
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.embedding IS NOT NULL {filter_sql}
        ORDER BY c.embedding <=> CAST(:q AS vector)
        LIMIT :k
    """), params).fetchall()
    return [{
        "chunk_id": r.id, "document_id": r.document_id, "page": r.page_number,
        "text": r.text, "filename": r.filename, "doc_type": r.doc_type,
        "score": float(r.score),
    } for r in rows]
