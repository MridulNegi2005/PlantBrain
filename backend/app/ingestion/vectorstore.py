"""pgvector-backed embedding storage and similarity search.

Embeddings live in the `chunks.embedding` column (vector(384), added by the
bootstrap). Vectors are passed as pgvector text literals cast to `vector`, so no
extra driver adapters are required.
"""

from __future__ import annotations

import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings


def _literal(vec: list[float]) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"


def pgvector_ready(db: Session) -> bool:
    if db.bind.dialect.name != "postgresql":
        return False
    row = db.execute(text("""
        SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
           AND EXISTS (
               SELECT 1 FROM information_schema.columns
               WHERE table_name = 'chunks' AND column_name = 'embedding'
           )
    """)).scalar()
    return bool(row)


def store_embeddings(db: Session, rows: list[tuple[str, list[float]]]) -> None:
    for chunk_id, vec in rows:
        db.execute(
            text("UPDATE chunks SET embedding = CAST(:emb AS vector) WHERE id = :id"),
            {"emb": _literal(vec), "id": chunk_id},
        )


def search(db: Session, query_vec: list[float], *, k: int = 5,
           asset_tag: str | None = None, document_id: str | None = None) -> list[dict]:
    """Cosine-nearest chunks. Used by the Interval 3 retriever."""
    params: dict = {"q": _literal(query_vec), "k": k}
    filter_sql = ""
    if asset_tag:
        filter_sql = "AND c.asset_tags::jsonb @> CAST(:tag AS jsonb)"
        params["tag"] = f'["{asset_tag}"]'
    if document_id:
        filter_sql += " AND c.document_id = :document_id"
        params["document_id"] = document_id
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


def search_query(db: Session, query: str, *, k: int = 5,
                 asset_tag: str | None = None, document_id: str | None = None) -> list[dict]:
    """Use pgvector in production and BM25 for the zero-config SQLite demo path."""
    if pgvector_ready(db):
        from app.ingestion.embed import embed_query

        return search(
            db, embed_query(query), k=k, asset_tag=asset_tag, document_id=document_id)
    return _bm25_search(
        db, query, k=k, asset_tag=asset_tag, document_id=document_id)


def _tokens(value: str) -> list[str]:
    return re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", value.lower())


def _bm25_search(db: Session, query: str, *, k: int,
                 asset_tag: str | None, document_id: str | None) -> list[dict]:
    from rank_bm25 import BM25Plus

    from app.db import models

    q = db.query(models.Chunk, models.Document).join(
        models.Document, models.Document.id == models.Chunk.document_id)
    if document_id:
        q = q.filter(models.Chunk.document_id == document_id)
    rows = q.limit(settings.max_bm25_chunks).all()
    if asset_tag:
        rows = [(chunk, doc) for chunk, doc in rows
                if asset_tag in (chunk.asset_tags or doc.asset_tags or [])]
    query_tokens = _tokens(query)
    corpus = [_tokens(chunk.text) for chunk, _doc in rows]
    if not rows or not query_tokens or not any(corpus):
        return []

    raw_scores = BM25Plus(corpus).get_scores(query_tokens)
    ranked = sorted(zip(rows, corpus, raw_scores), key=lambda item: float(item[2]), reverse=True)
    query_terms = set(query_tokens)
    positive = [((row, score)) for row, tokens, score in ranked
                if float(score) > 0 and query_terms.intersection(tokens)][:k]
    max_score = float(positive[0][1]) if positive else 0.0
    return [{
        "chunk_id": chunk.id,
        "document_id": chunk.document_id,
        "page": chunk.page_number,
        "text": chunk.text,
        "filename": doc.filename,
        "doc_type": doc.doc_type,
        "score": round(float(score) / max_score, 6) if max_score else 0.0,
    } for ((chunk, doc), score) in positive]
