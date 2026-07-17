"""Copilot tests — mock the retriever so we don't need pgvector, and confirm the
no-source-no-answer guardrail and citation shape."""

import app.api.agents as agents_api
import app.rag.copilot as copilot

EVIDENCE = [
    {"chunk_id": "c1", "document_id": "d1", "page": 2, "filename": "WO-129.pdf",
     "doc_type": "work_order", "text": "Observed abnormal vibration and seal leakage.", "score": 0.8},
    {"chunk_id": "c2", "document_id": "d2", "page": 1, "filename": "INC-08.pdf",
     "doc_type": "incident_report", "text": "Coupling misalignment caused repeat seal failure.", "score": 0.7},
]


def test_extractive_answer_has_citations(monkeypatch):
    monkeypatch.setattr(copilot, "retrieve",
                        lambda db, q, asset_tag=None: {"evidence": EVIDENCE, "graph_path": ["asset:P-204A"]})
    # force the no-LLM path
    monkeypatch.setattr(copilot.llm, "available", lambda: False)
    result = copilot.answer(None, "why did P-204A fail?", asset_tag="P-204A")
    assert result["answer"]
    assert result["citations"] and result["citations"][0]["document"] == "WO-129.pdf"
    assert result["citations"][0]["chunk_id"] == "c1"


def test_no_evidence_refuses(monkeypatch):
    monkeypatch.setattr(copilot, "retrieve",
                        lambda db, q, asset_tag=None: {"evidence": [], "graph_path": []})
    result = copilot.answer(None, "unrelated question", asset_tag=None)
    assert result["answer"] is None
    assert result["reason"] == "no_supporting_evidence"
    assert result["citations"] == []


def test_copilot_endpoint(client, monkeypatch):
    monkeypatch.setattr(agents_api, "copilot_answer",
                        lambda db, q, asset_tag=None: {"answer": "Seal wear from misalignment.",
                                                       "confidence": 0.8,
                                                       "citations": [{"document": "WO-129.pdf", "page": 2,
                                                                      "chunk_id": "c1", "quote": "..."}],
                                                       "graph_path": ["asset:P-204A"],
                                                       "missing_evidence": [], "recommended_next_actions": []})
    resp = client.post("/api/copilot/ask", json={"question": "why?", "asset_tag": "P-204A"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["answer"] and body["citations"]
