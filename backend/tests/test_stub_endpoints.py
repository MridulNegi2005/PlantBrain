from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert "db_connected" in body
    assert "pgvector_enabled" in body


def test_list_assets():
    resp = client.get("/api/assets")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    tags = {a["asset_tag"] for a in body["items"]}
    assert {"P-204A", "HX-102", "V-301", "C-110", "TK-501"} <= tags


def test_get_asset_not_found():
    resp = client.get("/api/assets/DOES-NOT-EXIST")
    assert resp.status_code == 404


def test_copilot_ask_has_citations():
    resp = client.post("/api/copilot/ask", json={"question": "Why did P-204A fail?", "asset_tag": "P-204A"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["citations"], "copilot answers must always include citations"


def test_upload_rejects_bad_content_type():
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
    )
    assert resp.status_code == 415


def test_upload_accepts_pdf():
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("WO-999.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["filename"] == "WO-999.pdf"
    assert len(body["hash_sha256"]) == 64
