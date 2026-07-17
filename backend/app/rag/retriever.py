"""GraphRAG retrieval: fuse pgvector similarity with knowledge-graph expansion.

Vector search finds the semantically closest chunks. Graph expansion then pulls in
chunks from documents connected to the asset through shared failure modes — the
multi-hop evidence a pure vector search would miss. The two are merged and de-duped.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.graph.query import load_graph, related_documents
from app.ingestion.embed import embed_query
from app.ingestion.vectorstore import search


def retrieve(db: Session, question: str, *, asset_tag: str | None = None,
             k: int = 6) -> dict:
    qvec = embed_query(question)
    evidence: dict[str, dict] = {h["chunk_id"]: h for h in search(db, qvec, k=k)}

    if asset_tag:
        # graph expansion: pull the top chunk from documents connected to the asset
        # through a shared failure mode (multi-hop evidence vector search alone misses)
        related_ids = {d.split("doc:", 1)[1] for d in related_documents(db, asset_tag)}
        present = {h["document_id"] for h in evidence.values()}
        for doc_id in related_ids - present:
            hit = _top_chunk_for_doc(db, doc_id, qvec)
            if hit:
                hit["via_graph"] = True
                evidence[hit["chunk_id"]] = hit

    ranked = sorted(evidence.values(), key=lambda h: h.get("score", 0), reverse=True)[: k + 4]
    graph_path = _graph_path(db, asset_tag, ranked) if asset_tag else []
    return {"evidence": ranked, "graph_path": graph_path}


def _graph_path(db: Session, asset_tag: str, ranked: list[dict]) -> list[str]:
    """A meaningful chain asset -> top-evidence-doc -> failure -> component."""
    g = load_graph(db)
    root = f"asset:{asset_tag}"
    if root not in g:
        return []
    # Prefer the highest-ranked evidence doc that yields a full asset->doc->failure
    # chain; fall back to any connected doc, then the asset alone.
    fallback: list[str] = [root]
    for hit in ranked:
        dnode = f"doc:{hit['document_id']}"
        if not g.has_edge(root, dnode):
            continue
        fallback = [root, dnode]
        failures = [n for n in g.successors(dnode)
                    if g.nodes[n]["node_type"] == "FailureMode"]
        if failures:
            path = [root, dnode, failures[0]]
            comps = [n for n in g.successors(failures[0])
                     if g.nodes[n]["node_type"] == "Component"]
            if comps:
                path.append(comps[0])
            return path
    return fallback


def _top_chunk_for_doc(db: Session, doc_id: str, qvec: list[float]) -> dict | None:
    from app.ingestion.vectorstore import _literal
    from sqlalchemy import text

    row = db.execute(text("""
        SELECT c.id, c.document_id, c.page_number, c.text, d.filename, d.doc_type,
               1 - (c.embedding <=> CAST(:q AS vector)) AS score
        FROM chunks c JOIN documents d ON d.id = c.document_id
        WHERE c.document_id = :doc AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> CAST(:q AS vector) LIMIT 1
    """), {"q": _literal(qvec), "doc": doc_id}).fetchone()
    if not row:
        return None
    return {"chunk_id": row.id, "document_id": row.document_id, "page": row.page_number,
            "text": row.text, "filename": row.filename, "doc_type": row.doc_type,
            "score": float(row.score)}
