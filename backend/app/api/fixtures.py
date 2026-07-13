"""Fixture data for stub endpoints (Interval 0).

Shapes here match docs/api-contract.md exactly. As real intervals land, routers
swap these out for DB-backed logic without changing response shapes.
"""

ASSETS = [
    {"asset_tag": "P-204A", "asset_type": "Boiler Feed Pump", "document_count": 6,
     "open_risks": 1, "compliance_gaps": 0},
    {"asset_tag": "HX-102", "asset_type": "Heat Exchanger", "document_count": 4,
     "open_risks": 1, "compliance_gaps": 0},
    {"asset_tag": "V-301", "asset_type": "Pressure Vessel", "document_count": 3,
     "open_risks": 0, "compliance_gaps": 1},
    {"asset_tag": "C-110", "asset_type": "Compressor", "document_count": 4,
     "open_risks": 1, "compliance_gaps": 0},
    {"asset_tag": "TK-501", "asset_type": "Storage Tank", "document_count": 2,
     "open_risks": 0, "compliance_gaps": 0},
]

ASSET_DETAIL = {
    "P-204A": {
        "asset_tag": "P-204A", "asset_type": "Boiler Feed Pump",
        "plant_id": "shakti-petrochem-unit-2", "document_count": 6,
        "open_risks": 1, "compliance_gaps": 0,
        "summary": "Repeated abnormal vibration and seal leakage over the last 2 work orders.",
    },
    "V-301": {
        "asset_tag": "V-301", "asset_type": "Pressure Vessel",
        "plant_id": "shakti-petrochem-unit-2", "document_count": 3,
        "open_risks": 0, "compliance_gaps": 1,
        "summary": "Missing latest pressure test certificate.",
    },
}

ASSET_TIMELINE = {
    "P-204A": [
        {"type": "work_order", "id": "WO-129", "date": "2026-06-01",
         "title": "Seal leakage reported", "document_id": "doc_01HXYZ"},
        {"type": "inspection", "id": "IR-17", "date": "2026-06-10",
         "title": "Abnormal vibration recorded", "document_id": "doc_01HDEF"},
        {"type": "work_order", "id": "WO-141", "date": "2026-06-20",
         "title": "Seal replaced, no post-repair test", "document_id": "doc_01HGHI"},
    ],
}

ASSET_GRAPH = {
    "P-204A": {
        "nodes": [
            {"id": "asset:P-204A", "type": "Asset", "label": "P-204A"},
            {"id": "wo:WO-129", "type": "WorkOrder", "label": "WO-129"},
            {"id": "failure:seal_leakage", "type": "FailureMode", "label": "Seal Leakage"},
            {"id": "sop:SOP-17", "type": "SOP", "label": "SOP-17"},
        ],
        "edges": [
            {"source": "asset:P-204A", "target": "wo:WO-129",
             "type": "ASSET_HAS_DOCUMENT", "confidence": 0.95},
            {"source": "wo:WO-129", "target": "failure:seal_leakage",
             "type": "WORK_ORDER_MENTIONS_FAILURE", "confidence": 0.88},
            {"source": "sop:SOP-17", "target": "asset:P-204A",
             "type": "SOP_APPLIES_TO_ASSET", "confidence": 0.9},
        ],
    },
}

DOCUMENTS = [
    {"id": "doc_01HXYZ", "filename": "WO-129.pdf", "doc_type": "work_order",
     "status": "completed", "asset_tags": ["P-204A"], "created_at": "2026-07-13T10:00:00Z"},
    {"id": "doc_01HDEF", "filename": "IR-17.pdf", "doc_type": "inspection_report",
     "status": "completed", "asset_tags": ["P-204A"], "created_at": "2026-07-13T10:01:00Z"},
]

COPILOT_ANSWER = {
    "answer": "P-204A likely failed due to seal wear aggravated by abnormal vibration.",
    "confidence": 0.82,
    "citations": [
        {"document": "WO-129.pdf", "page": 2, "chunk_id": "chunk_88",
         "quote": "Observed abnormal vibration during routine check."}
    ],
    "graph_path": ["asset:P-204A", "wo:WO-129", "failure:seal_leakage"],
    "missing_evidence": ["Latest post-repair vibration trend"],
    "recommended_next_actions": ["Check coupling alignment", "Inspect bearing housing"],
}

RCA_REPORT = {
    "asset": "P-204A",
    "issue": "Repeated seal leakage and abnormal vibration",
    "likely_causes": [
        {"cause": "Seal wear due to coupling misalignment", "confidence": 0.78,
         "evidence": ["WO-129", "IR-17", "OEM-PUMP-02"]}
    ],
    "missing_checks": ["Shaft alignment report", "Post-repair vibration reading"],
    "recommended_actions": ["Inspect bearing housing", "Verify coupling alignment",
                             "Schedule vibration monitoring"],
}

COMPLIANCE_REPORT = {
    "asset": "V-301",
    "requirement": "Pressure vessel inspection certificate",
    "status": "gap",
    "evidence_found": [],
    "missing_evidence": "Latest pressure test certificate",
    "risk_level": "high",
}

SIMILAR_INCIDENTS = [
    {"incident_id": "INC-08", "similarity": 0.79,
     "summary": "Similar seal failure on C-110 in 2025.",
     "citations": [{"document": "INC-08.pdf", "page": 1}]}
]

EVALUATION_CASES = [
    {"id": "q1", "question": "Why did P-204A fail twice this month?", "category": "rca"},
    {"id": "q2", "question": "What compliance gaps exist for V-301?", "category": "compliance"},
]

EVALUATION_RUN = {
    "id": "eval_01HJKL", "status": "completed", "completed_at": "2026-07-13T10:05:00Z",
    "metrics": {
        "asset_tag_precision": 0.94, "asset_tag_recall": 0.90,
        "retrieval_hit_rate_top5": 0.88, "citation_correctness": 0.82,
        "compliance_gap_accuracy": 0.86,
        "ragas_faithfulness": 0.85, "ragas_answer_relevancy": 0.88,
        "ragas_context_precision": 0.80, "ragas_context_recall": 0.83,
        "avg_response_time_sec": 4.2, "manual_baseline_sec": 720,
    },
}

AUDIT_LOGS = [
    {"id": "log_1", "actor": "negi", "action": "document.upload", "resource_type": "document",
     "resource_id": "doc_01HXYZ", "created_at": "2026-07-13T10:00:00Z"}
]

SECURITY_EVENTS = [
    {"id": "sec_1", "event_type": "prompt_injection_attempt", "resource_id": "doc_01HZZZ",
     "detail": "Ignored embedded instruction in document text.", "created_at": "2026-07-13T10:02:00Z"}
]
