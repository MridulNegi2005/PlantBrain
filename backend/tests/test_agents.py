"""Interval 4 agent tests — retrieval/LLM mocked so no pgvector or network needed."""

import app.agents.compliance as compliance
import app.agents.lessons as lessons
import app.agents.rca as rca
import app.api.agents as agents_api

EVIDENCE = [
    {"chunk_id": "c1", "document_id": "d1", "page": 1, "filename": "WO-141.pdf",
     "doc_type": "work_order", "text": "Seal replaced, no post-repair vibration reading recorded.", "score": 0.8},
    {"chunk_id": "c2", "document_id": "d2", "page": 1, "filename": "INC-08.pdf",
     "doc_type": "incident_report", "text": "Coupling misalignment caused repeat seal failure.", "score": 0.7},
]


def _mock_retrieve(*a, **k):
    return {"evidence": EVIDENCE, "graph_path": ["asset:P-204A"]}


def test_rca_extractive(monkeypatch):
    monkeypatch.setattr(rca, "retrieve", _mock_retrieve)
    monkeypatch.setattr(rca.llm, "available", lambda: False)
    r = rca.generate(None, "P-204A", "seal leakage")
    assert r["likely_causes"] and r["likely_causes"][0]["citations"]


def test_rca_no_evidence(monkeypatch):
    monkeypatch.setattr(rca, "retrieve", lambda *a, **k: {"evidence": [], "graph_path": []})
    r = rca.generate(None, "P-204A", "x")
    assert r["reason"] == "no_supporting_evidence"
    assert r["likely_causes"] == []


def test_compliance_extractive(monkeypatch):
    monkeypatch.setattr(compliance, "retrieve", _mock_retrieve)
    monkeypatch.setattr(compliance.llm, "available", lambda: False)
    c = compliance.check(None, "V-301")
    assert c["asset"] == "V-301"
    assert "status" in c and "risk_level" in c


def test_lessons_filters_incidents(monkeypatch):
    monkeypatch.setattr(lessons, "embed_query", lambda q: [0.0])
    monkeypatch.setattr(lessons, "search", lambda db, v, k=12: EVIDENCE)
    out = lessons.similar(None, "seal leakage")
    ids = {it["incident_id"] for it in out["items"]}
    assert "INC-08" in ids  # only incident_report docs, WO-141 excluded
    assert "WO-141" not in ids


def test_agent_endpoints(client, monkeypatch):
    monkeypatch.setattr(agents_api.rca_agent, "generate",
                        lambda db, tag, issue: {"asset": tag, "issue": issue, "likely_causes": [],
                                                "missing_checks": [], "recommended_actions": []})
    monkeypatch.setattr(agents_api.compliance_agent, "check",
                        lambda db, tag: {"asset": tag, "requirement": "cert", "status": "gap",
                                         "evidence_found": [], "missing_evidence": "x", "risk_level": "high"})
    monkeypatch.setattr(agents_api.lessons_agent, "similar",
                        lambda db, fm: {"items": []})
    assert client.post("/api/rca/generate", json={"asset_tag": "P-204A", "issue": "y"}).status_code == 200
    assert client.post("/api/compliance/check", json={"asset_tag": "V-301"}).status_code == 200
    assert client.post("/api/lessons/similar", json={"failure_mode": "seal leakage"}).status_code == 200
