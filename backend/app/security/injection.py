"""Prompt-injection detection over retrieved document text.

Uploaded documents are untrusted. Beyond the LLM system-prompt guardrail (which tells
the model to ignore instructions inside sources), we scan retrieved chunks for known
injection patterns and log a SecurityEvent so attempts are auditable.
"""

from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.db import models
from app.db.base import gen_id

PATTERNS = [
    r"ignore (all|previous|above|prior) (instructions|prompts)",
    r"disregard (the|all|previous) (instructions|rules|sources)",
    r"do not cite",
    r"reveal (all|the|your) (documents|system prompt|instructions)",
    r"generate a (fake|forged) (certificate|inspection|report)",
    r"you are now",
    r"system prompt",
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in PATTERNS]


def scan(text: str) -> list[str]:
    return [c.pattern for c in _COMPILED if c.search(text)]


def check_evidence(db: Session, evidence: list[dict]) -> bool:
    """Log a SecurityEvent for any retrieved chunk containing injection patterns.
    Returns True if anything suspicious was found (the guardrail still answers safely)."""
    found = False
    for hit in evidence:
        matches = scan(hit.get("text", ""))
        if matches:
            found = True
            db.add(models.SecurityEvent(
                id=gen_id("sec"), event_type="prompt_injection_attempt",
                resource_id=hit.get("document_id"),
                detail=f"Ignored embedded instruction in {hit.get('filename')}: "
                       f"matched {matches[0]}"))
    if found:
        db.commit()
    return found
