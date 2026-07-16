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
