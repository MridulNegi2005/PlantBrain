# PlantBrain AI — API Contract (v0.1)

> **v0.1 (Interval 1):** documents/assets/ingestion/audit endpoints are now backed by
> real Postgres (shapes unchanged from v0). Added `GET /api/documents/{id}/chunks` for
> the evidence view. copilot/rca/compliance/lessons/evaluation remain fixture stubs
> until Intervals 3-5.

This is the contract for the FastAPI backend. All endpoints below are **live as stubs right now**, returning
fixture data shaped exactly like the real thing will be. Build the frontend against these — when real
endpoints land in later intervals, the response shapes will not change (only the data becomes real).

Base URL (dev): `http://localhost:8000`

All responses are JSON. All list endpoints are wrapped `{ "items": [...], "total": N }`. Errors are
`{ "error": { "code": "string", "message": "string" } }` with a non-2xx status.

Demo plant: **Shakti Petrochem Unit-2**. Demo assets: `P-204A` (Boiler Feed Pump), `HX-102` (Heat Exchanger),
`V-301` (Pressure Vessel), `C-110` (Compressor), `TK-501` (Storage Tank).

---

## Health

### `GET /health`
```json
{ "status": "ok", "db_connected": true, "pgvector_enabled": true }
```

---

## Documents

### `POST /api/documents/upload`
`multipart/form-data`: `file` (PDF/PNG/JPG/CSV/XLSX/TXT, max 20MB), `plant_id` (optional, defaults to demo plant).

Response `201`:
```json
{
  "id": "doc_01HXYZ",
  "filename": "WO-129.pdf",
  "doc_type": "work_order",
  "status": "uploaded",
  "hash_sha256": "…",
  "created_at": "2026-07-13T10:00:00Z"
}
```

### `GET /api/documents`
Query: `plant_id`, `doc_type`, `asset_tag`, `status`, `page`, `page_size`.
```json
{
  "items": [
    { "id": "doc_01HXYZ", "filename": "WO-129.pdf", "doc_type": "work_order",
      "status": "completed", "asset_tags": ["P-204A"], "created_at": "2026-07-13T10:00:00Z" }
  ],
  "total": 42
}
```

### `GET /api/documents/{id}`
```json
{
  "id": "doc_01HXYZ", "filename": "WO-129.pdf", "doc_type": "work_order",
  "status": "completed", "asset_tags": ["P-204A"], "page_count": 3,
  "chunks_count": 12, "created_at": "2026-07-13T10:00:00Z"
}
```

### `GET /api/documents/{id}/chunks`
Page-level chunks for the evidence / citation drawer. Returns a small stub sample
(`"stub": true`) until the Interval 2 ingestion pipeline populates real chunks; the
item shape does not change when it goes real.
```json
{
  "items": [
    { "chunk_id": "chunk_88", "page": 2, "text": "Observed abnormal vibration…",
      "bbox": {"x0": 72, "y0": 400, "x1": 520, "y1": 430}, "asset_tags": ["P-204A"] }
  ],
  "total": 1,
  "stub": false
}
```

### `POST /api/documents/{id}/ingest`
Triggers (or re-triggers) ingestion. Response `202`:
```json
{ "ingestion_job_id": "job_01HABC", "status": "queued" }
```

### `GET /api/ingestion-jobs/{id}`
```json
{
  "id": "job_01HABC", "document_id": "doc_01HXYZ",
  "status": "embedding",
  "states": ["uploaded", "extracting", "chunking", "embedding", "graph_building", "completed"],
  "current_state_index": 3,
  "error": null,
  "updated_at": "2026-07-13T10:00:05Z"
}
```
`status` is one of: `uploaded | extracting | chunking | embedding | graph_building | completed | failed`.

---

## Assets

### `GET /api/assets`
```json
{
  "items": [
    { "asset_tag": "P-204A", "asset_type": "Boiler Feed Pump", "document_count": 6,
      "open_risks": 1, "compliance_gaps": 0 },
    { "asset_tag": "V-301", "asset_type": "Pressure Vessel", "document_count": 3,
      "open_risks": 0, "compliance_gaps": 1 }
  ],
  "total": 5
}
```

### `GET /api/assets/{asset_tag}`
```json
{
  "asset_tag": "P-204A", "asset_type": "Boiler Feed Pump", "plant_id": "shakti-petrochem-unit-2",
  "document_count": 6, "open_risks": 1, "compliance_gaps": 0,
  "summary": "Repeated abnormal vibration and seal leakage over the last 2 work orders."
}
```

### `GET /api/assets/{asset_tag}/timeline`
```json
{
  "items": [
    { "type": "work_order", "id": "WO-129", "date": "2026-06-01", "title": "Seal leakage reported",
      "document_id": "doc_01HXYZ" },
    { "type": "inspection", "id": "IR-17", "date": "2026-06-10", "title": "Abnormal vibration recorded",
      "document_id": "doc_01HDEF" },
    { "type": "work_order", "id": "WO-141", "date": "2026-06-20", "title": "Seal replaced, no post-repair test",
      "document_id": "doc_01HGHI" }
  ]
}
```

### `GET /api/assets/{asset_tag}/graph`
Node/edge shape matches the knowledge-graph schema (ISO 15926 / IEC 81346 flavoured node types).
```json
{
  "nodes": [
    { "id": "asset:P-204A", "type": "Asset", "label": "P-204A" },
    { "id": "wo:WO-129", "type": "WorkOrder", "label": "WO-129" },
    { "id": "failure:seal_leakage", "type": "FailureMode", "label": "Seal Leakage" },
    { "id": "sop:SOP-17", "type": "SOP", "label": "SOP-17" }
  ],
  "edges": [
    { "source": "asset:P-204A", "target": "wo:WO-129", "type": "ASSET_HAS_DOCUMENT", "confidence": 0.95 },
    { "source": "wo:WO-129", "target": "failure:seal_leakage", "type": "WORK_ORDER_MENTIONS_FAILURE", "confidence": 0.88 },
    { "source": "sop:SOP-17", "target": "asset:P-204A", "type": "SOP_APPLIES_TO_ASSET", "confidence": 0.9 }
  ]
}
```

---

## AI Agents

### `POST /api/copilot/ask`
Request:
```json
{ "question": "Why did P-204A fail twice this month?", "asset_tag": "P-204A" }
```
Response — **every answer must include citations; no citation ⇒ no answer** (see §14 of the build plan):
```json
{
  "answer": "P-204A likely failed due to seal wear aggravated by abnormal vibration.",
  "confidence": 0.82,
  "citations": [
    { "document": "WO-129.pdf", "page": 2, "chunk_id": "chunk_88",
      "quote": "Observed abnormal vibration during routine check." }
  ],
  "graph_path": ["asset:P-204A", "wo:WO-129", "failure:seal_leakage"],
  "missing_evidence": ["Latest post-repair vibration trend"],
  "recommended_next_actions": ["Check coupling alignment", "Inspect bearing housing"]
}
```
If retrieval confidence is too low: `{ "answer": null, "reason": "no_supporting_evidence", "citations": [] }`.

### `POST /api/rca/generate`
Request: `{ "asset_tag": "P-204A", "issue": "Repeated seal leakage and abnormal vibration" }`
Response: see build plan §17.2 (`likely_causes[]` with `cause`, `confidence`, `evidence[]`; `missing_checks[]`;
`recommended_actions[]`).

### `POST /api/compliance/check`
Request: `{ "asset_tag": "V-301" }`
Response: see build plan §18.2 (`requirement`, `status: pass|gap`, `evidence_found[]`, `missing_evidence`,
`risk_level`).

### `POST /api/lessons/similar`
Request: `{ "failure_mode": "seal leakage" }`
Response:
```json
{
  "items": [
    { "incident_id": "INC-08", "similarity": 0.79, "summary": "Similar seal failure on C-110 in 2025.",
      "citations": [{ "document": "INC-08.pdf", "page": 1 }] }
  ]
}
```

---

## Evaluation

### `GET /api/evaluation/cases`
```json
{ "items": [{ "id": "q1", "question": "Why did P-204A fail twice this month?", "category": "rca" }], "total": 20 }
```

### `POST /api/evaluation/run`
Response `202`: `{ "run_id": "eval_01HJKL", "status": "running" }`

### `GET /api/evaluation/runs/{id}`
```json
{
  "id": "eval_01HJKL", "status": "completed", "completed_at": "2026-07-13T10:05:00Z",
  "metrics": {
    "asset_tag_precision": 0.94, "asset_tag_recall": 0.90,
    "retrieval_hit_rate_top5": 0.88,
    "citation_correctness": 0.82,
    "compliance_gap_accuracy": 0.86,
    "ragas_faithfulness": 0.85, "ragas_answer_relevancy": 0.88,
    "ragas_context_precision": 0.80, "ragas_context_recall": 0.83,
    "avg_response_time_sec": 4.2, "manual_baseline_sec": 720
  }
}
```

---

## Security / Admin

### `GET /api/audit-logs`
```json
{
  "items": [
    { "id": "log_1", "actor": "negi", "action": "document.upload", "resource_type": "document",
      "resource_id": "doc_01HXYZ", "created_at": "2026-07-13T10:00:00Z" }
  ],
  "total": 120
}
```

### `GET /api/security-events`
```json
{
  "items": [
    { "id": "sec_1", "event_type": "prompt_injection_attempt", "resource_id": "doc_01HZZZ",
      "detail": "Ignored embedded instruction in document text.", "created_at": "2026-07-13T10:02:00Z" }
  ],
  "total": 3
}
```

---

## Change process
Any breaking change to a response shape gets appended to this file with a version bump and flagged in
`.ai-sync/handoff.md` so the frontend isn't broken silently.
