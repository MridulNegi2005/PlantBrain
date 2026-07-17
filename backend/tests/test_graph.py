"""Knowledge-graph builder tests (hermetic — pure ORM + networkx, no pgvector)."""

from app.db import models
from app.db.base import gen_id
from app.db.session import get_db
from app.graph.builder import build_graph
from app.graph.query import asset_subgraph, related_documents

PLANT = "shakti-petrochem-unit-2"


def _session(client):
    return next(client.app.dependency_overrides[get_db]())


def _doc_with_chunk(db, tag, filename, text):
    doc = models.Document(id=gen_id("doc"), plant_id=PLANT, filename=filename,
                          doc_type="work_order", status="completed",
                          storage_path="x", hash_sha256=gen_id("h") * 4, asset_tags=[tag])
    db.add(doc)
    db.add(models.Chunk(id=gen_id("chunk"), document_id=doc.id, page_number=1,
                        text=text, asset_tags=[tag]))
    db.commit()
    return doc


def test_build_graph_extracts_failures_and_components(client):
    db = _session(client)
    _doc_with_chunk(db, "P-204A", "WO-A.pdf", "Observed seal leakage and abnormal vibration.")
    stats = build_graph(db)
    assert stats["nodes"] > 0 and stats["edges"] > 0

    node_ids = {n.id for n in db.query(models.GraphNode).all()}
    assert "failure:seal_leakage" in node_ids
    assert "failure:abnormal_vibration" in node_ids
    assert "component:mechanical_seal" in node_ids  # seal leakage -> mechanical seal
    assert "asset:P-204A" in node_ids


def test_asset_subgraph_is_connected(client):
    db = _session(client)
    _doc_with_chunk(db, "P-204A", "WO-B.pdf", "Mechanical seal wear from coupling misalignment.")
    build_graph(db)
    sub = asset_subgraph(db, "P-204A")
    types = {n["type"] for n in sub["nodes"]}
    assert "Asset" in types and "Document" in types and "FailureMode" in types
    assert sub["edges"]


def test_related_documents_links_via_shared_failure(client):
    db = _session(client)
    _doc_with_chunk(db, "P-204A", "WO-C.pdf", "seal leakage reported")
    _doc_with_chunk(db, "C-110", "INC-X.pdf", "similar seal leakage on another unit")
    build_graph(db)
    related = related_documents(db, "P-204A")
    filenames = set()
    for node_id in related:
        doc_id = node_id.split("doc:", 1)[1]
        d = db.get(models.Document, doc_id)
        if d:
            filenames.add(d.filename)
    # the C-110 incident shares "seal leakage" so it should be reachable from P-204A
    assert "INC-X.pdf" in filenames
