def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert "db_connected" in body
    assert "pgvector_enabled" in body


def test_list_assets(client):
    resp = client.get("/api/assets")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    tags = {a["asset_tag"] for a in body["items"]}
    assert {"P-204A", "HX-102", "V-301", "C-110", "TK-501"} <= tags


def test_get_asset_detail(client):
    resp = client.get("/api/assets/P-204A")
    assert resp.status_code == 200
    body = resp.json()
    assert body["asset_type"] == "Boiler Feed Pump"
    assert body["plant_id"] == "shakti-petrochem-unit-2"


def test_get_asset_not_found(client):
    resp = client.get("/api/assets/DOES-NOT-EXIST")
    assert resp.status_code == 404


def test_upload_rejects_bad_content_type(client):
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
    )
    assert resp.status_code == 415


def test_upload_persists_and_lists(client):
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("WO-999.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )
    assert resp.status_code == 201
    doc = resp.json()
    assert doc["filename"] == "WO-999.pdf"
    assert len(doc["hash_sha256"]) == 64

    listed = client.get("/api/documents").json()
    ids = {d["id"] for d in listed["items"]}
    assert doc["id"] in ids


def test_ingest_creates_job(client):
    doc = client.post(
        "/api/documents/upload",
        files={"file": ("IR-42.pdf", b"%PDF-1.4 inspection", "application/pdf")},
    ).json()
    resp = client.post(f"/api/documents/{doc['id']}/ingest")
    assert resp.status_code == 202
    job = resp.json()
    assert job["status"] == "queued"

    job_status = client.get(f"/api/ingestion-jobs/{job['ingestion_job_id']}").json()
    assert job_status["document_id"] == doc["id"]
    assert "uploaded" in job_status["states"]


def test_document_chunks_shape(client):
    doc = client.post(
        "/api/documents/upload",
        files={"file": ("M-1.pdf", b"%PDF-1.4 manual", "application/pdf")},
    ).json()
    resp = client.get(f"/api/documents/{doc['id']}/chunks")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body and "total" in body
    assert body["items"][0]["chunk_id"]


def test_upload_writes_audit_log(client):
    client.post(
        "/api/documents/upload",
        files={"file": ("SOP-1.txt", b"procedure text", "text/plain")},
    )
    logs = client.get("/api/audit-logs").json()
    actions = {log["action"] for log in logs["items"]}
    assert "document.upload" in actions
