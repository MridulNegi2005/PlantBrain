from app.ingestion.chunk import chunk_pages


def test_chunk_pages_preserves_page_numbers():
    pages = ["short first page", "second page " + "x " * 800]
    chunks = chunk_pages(pages, target_chars=300, overlap=50)
    assert chunks[0]["page"] == 1
    assert any(c["page"] == 2 for c in chunks)
    # long page must split into multiple overlapping windows
    page2 = [c for c in chunks if c["page"] == 2]
    assert len(page2) > 1


def test_chunk_pages_skips_empty():
    assert chunk_pages(["", "   ", "\n"]) == []


def test_extract_csv(tmp_path):
    from app.ingestion.extract import extract_pages

    f = tmp_path / "wo.csv"
    f.write_text("id,asset\nWO-1,P-204A\n", encoding="utf-8")
    pages = extract_pages(str(f))
    assert len(pages) == 1
    assert "P-204A" in pages[0]


def test_pipeline_ingests_pdf_on_sqlite(client, tmp_path):
    """End-to-end pipeline on the hermetic SQLite DB (embeddings skipped on non-PG)."""
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    pdf = tmp_path / "sample.pdf"
    c = canvas.Canvas(str(pdf), pagesize=A4)
    c.drawString(72, 720, "P-204A boiler feed pump abnormal vibration and seal leakage.")
    c.showPage()
    c.save()

    # register + ingest via the DB session the test client uses
    from app.db import models
    from app.db.base import gen_id
    from app.db.session import get_db
    from app.ingestion.pipeline import ingest_document

    gen = client.app.dependency_overrides[get_db]()
    db = next(gen)
    doc = models.Document(id=gen_id("doc"), plant_id="shakti-petrochem-unit-2",
                          filename="sample.pdf", doc_type="manual", status="registered",
                          storage_path=str(pdf), hash_sha256="x" * 64, asset_tags=["P-204A"])
    db.add(doc)
    db.commit()
    job = ingest_document(db, doc.id, compute_embeddings=False)
    assert job.status == "completed"

    resp = client.get(f"/api/documents/{doc.id}/chunks")
    body = resp.json()
    assert body["total"] >= 1
    assert body["stub"] is False
    assert any("vibration" in it["text"].lower() for it in body["items"])


def test_reingestion_replaces_evidence_and_rebuilds_graph(client, tmp_path):
    from app.db import models
    from app.db.base import gen_id
    from app.db.session import get_db
    from app.ingestion.pipeline import ingest_document

    source = tmp_path / "work-order.txt"
    source.write_text("P-204A seal leakage at the mechanical seal.", encoding="utf-8")
    db = next(client.app.dependency_overrides[get_db]())
    doc = models.Document(
        id=gen_id("doc"), plant_id="shakti-petrochem-unit-2",
        filename="work-order.txt", doc_type="work_order", status="registered",
        storage_path=str(source), hash_sha256="y" * 64, asset_tags=["P-204A"],
    )
    db.add(doc)
    db.commit()

    first = ingest_document(db, doc.id, compute_embeddings=False)
    assert first.status == "completed"
    assert db.query(models.GraphEdge).filter(models.GraphEdge.source_chunk_id.is_not(None)).count() > 0

    source.write_text("P-204A abnormal vibration at the bearing.", encoding="utf-8")
    second = ingest_document(db, doc.id, compute_embeddings=False)
    assert second.status == "completed"
    chunks = db.query(models.Chunk).filter(models.Chunk.document_id == doc.id).all()
    assert len(chunks) == 1
    assert "abnormal vibration" in chunks[0].text


def test_sqlite_bm25_retrieval_is_asset_scoped(client):
    from app.db import models
    from app.db.base import gen_id
    from app.db.session import get_db
    from app.ingestion.vectorstore import search_query

    db = next(client.app.dependency_overrides[get_db]())
    docs = [
        models.Document(
            id=gen_id("doc"), plant_id="shakti-petrochem-unit-2", filename="pump.txt",
            doc_type="work_order", status="completed", hash_sha256="a" * 64,
            asset_tags=["P-204A"],
        ),
        models.Document(
            id=gen_id("doc"), plant_id="shakti-petrochem-unit-2", filename="vessel.txt",
            doc_type="inspection_report", status="completed", hash_sha256="b" * 64,
            asset_tags=["V-301"],
        ),
    ]
    db.add_all(docs)
    db.flush()
    db.add_all([
        models.Chunk(id=gen_id("chunk"), document_id=docs[0].id, page_number=1,
                     text="pump seal leakage and abnormal vibration", asset_tags=["P-204A"]),
        models.Chunk(id=gen_id("chunk"), document_id=docs[1].id, page_number=1,
                     text="pressure vessel inspection certificate", asset_tags=["V-301"]),
    ])
    db.commit()

    hits = search_query(db, "seal leakage", asset_tag="P-204A")
    assert hits and hits[0]["filename"] == "pump.txt"
    assert all(hit["score"] <= 1.0 for hit in hits)
