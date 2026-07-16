"""Build the knowledge graph from ingested chunks (deterministic, rule-based).

Nodes: Asset, Document, FailureMode, Component (ISO-15926-flavoured types).
Edges: ASSET_HAS_DOCUMENT, DOCUMENT_MENTIONS_FAILURE, FAILURE_AFFECTS_COMPONENT,
DOCUMENT_MENTIONS_COMPONENT. Every failure/component edge carries the source chunk
id as provenance, and an Entity row is written for each extracted mention.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.db import models
from app.db.base import gen_id
from app.graph import vocab


def _match(text: str, phrase_map: dict[str, list[str]]) -> set[str]:
    low = text.lower()
    return {canon for canon, phrases in phrase_map.items()
            if any(p in low for p in phrases)}


def build_graph(db: Session) -> dict:
    # Rebuild from scratch (idempotent).
    db.query(models.GraphEdge).delete()
    db.query(models.GraphNode).delete()
    db.query(models.Entity).delete()
    db.commit()

    # Collect nodes/edges/entities in memory, then insert nodes before edges so the
    # graph_edges foreign keys are always satisfied.
    nodes: dict[str, models.GraphNode] = {}
    edge_keys: set[tuple[str, str, str]] = set()
    pending_edges: list[dict] = []
    pending_entities: list[models.Entity] = []

    def node(nid: str, ntype: str, label: str) -> str:
        if nid not in nodes:
            nodes[nid] = models.GraphNode(id=nid, node_type=ntype, label=label)
        return nid

    def edge(src: str, dst: str, etype: str, *, confidence: float = 1.0,
             chunk_id: str | None = None) -> None:
        key = (src, dst, etype)
        if key in edge_keys:
            return
        edge_keys.add(key)
        pending_edges.append({"id": gen_id("edge"), "source_node_id": src,
                              "target_node_id": dst, "edge_type": etype,
                              "confidence": confidence, "source_chunk_id": chunk_id})

    for asset in db.query(models.Asset).all():
        node(f"asset:{asset.asset_tag}", "Asset", asset.asset_tag)

    documents = db.query(models.Document).all()
    for doc in documents:
        dnode = node(f"doc:{doc.id}", "Document", doc.filename)
        for tag in doc.asset_tags or []:
            edge(f"asset:{tag}", dnode, "ASSET_HAS_DOCUMENT")

        # Skip failure/component extraction for multi-asset aggregate documents
        # (e.g. the work-order register), which would otherwise cross-link every
        # asset to every failure mode and pollute the graph.
        if len(doc.asset_tags or []) > 1:
            continue

        chunks = db.query(models.Chunk).filter(models.Chunk.document_id == doc.id).all()
        for ch in chunks:
            for fm in _match(ch.text, vocab.FAILURE_MODES):
                fnode = node(f"failure:{vocab.slug(fm)}", "FailureMode", fm.title())
                edge(dnode, fnode, "DOCUMENT_MENTIONS_FAILURE", confidence=0.85, chunk_id=ch.id)
                pending_entities.append(models.Entity(
                    id=gen_id("ent"), entity_type="failure_mode", value=fm,
                    normalized_value=vocab.slug(fm), confidence=0.85, source_chunk_id=ch.id))
                for comp in vocab.FAILURE_TO_COMPONENT.get(fm, []):
                    cnode = node(f"component:{vocab.slug(comp)}", "Component", comp.title())
                    edge(fnode, cnode, "FAILURE_AFFECTS_COMPONENT", confidence=0.8)
            for comp in _match(ch.text, vocab.COMPONENTS):
                cnode = node(f"component:{vocab.slug(comp)}", "Component", comp.title())
                edge(dnode, cnode, "DOCUMENT_MENTIONS_COMPONENT", confidence=0.8, chunk_id=ch.id)
                pending_entities.append(models.Entity(
                    id=gen_id("ent"), entity_type="component", value=comp,
                    normalized_value=vocab.slug(comp), confidence=0.8, source_chunk_id=ch.id))

    db.add_all(list(nodes.values()))
    db.flush()  # nodes must exist before edges (FK)
    db.add_all([models.GraphEdge(**e) for e in pending_edges])
    db.add_all(pending_entities)
    db.commit()
    return {
        "nodes": db.query(models.GraphNode).count(),
        "edges": db.query(models.GraphEdge).count(),
        "entities": db.query(models.Entity).count(),
    }
