"""Read helpers over the knowledge graph (via NetworkX for traversal)."""

from __future__ import annotations

import networkx as nx
from sqlalchemy.orm import Session

from app.db import models


def load_graph(db: Session) -> nx.DiGraph:
    g = nx.DiGraph()
    for n in db.query(models.GraphNode).all():
        g.add_node(n.id, node_type=n.node_type, label=n.label)
    for e in db.query(models.GraphEdge).all():
        g.add_edge(e.source_node_id, e.target_node_id,
                   edge_type=e.edge_type, confidence=e.confidence)
    return g


def asset_subgraph(db: Session, asset_tag: str) -> dict:
    """Asset + its documents + the failure modes / components they reach."""
    g = load_graph(db)
    root = f"asset:{asset_tag}"
    if root not in g:
        return {"nodes": [], "edges": []}

    keep = {root}
    for doc in g.successors(root):  # ASSET_HAS_DOCUMENT
        keep.add(doc)
        for fm in g.successors(doc):  # failure / component mentions
            keep.add(fm)
            for comp in g.successors(fm):  # FAILURE_AFFECTS_COMPONENT
                keep.add(comp)

    nodes = [{"id": n, "type": g.nodes[n]["node_type"], "label": g.nodes[n]["label"]}
             for n in keep]
    edges = [{"source": u, "target": v, "type": d["edge_type"], "confidence": d["confidence"]}
             for u, v, d in g.edges(data=True) if u in keep and v in keep]
    return {"nodes": nodes, "edges": edges}


def related_documents(db: Session, asset_tag: str) -> dict:
    """Multi-hop: docs connected to the asset AND docs elsewhere that share a failure
    mode with them. Returns {doc_id: path} where path is the connecting node chain."""
    g = load_graph(db)
    root = f"asset:{asset_tag}"
    out: dict[str, list[str]] = {}
    if root not in g:
        return out

    own_docs = list(g.successors(root))
    for doc in own_docs:
        out[doc] = [root, doc]

    # failure modes reached from this asset's docs
    failures = {fm for doc in own_docs for fm in g.successors(doc)
                if g.nodes[fm]["node_type"] == "FailureMode"}
    # other docs that mention the same failure mode (reverse edges)
    for fm in failures:
        for other_doc in g.predecessors(fm):
            if g.nodes[other_doc]["node_type"] == "Document" and other_doc not in out:
                out[other_doc] = [root, "…", fm, other_doc]
    return out


def doc_ids_from_nodes(node_ids) -> list[str]:
    return [n.split("doc:", 1)[1] for n in node_ids if n.startswith("doc:")]
