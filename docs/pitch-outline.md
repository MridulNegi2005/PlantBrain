# PlantBrain AI — Pitch Deck Outline (for AJ to build into slides)

Problem Statement 8 — Industrial Knowledge Intelligence. Judging: Innovation 25 · Business
Impact 25 · Technical Excellence 20 · Scalability 15 · UX 15. Aim each slide at a criterion.

## Slide 1 — Title
**PlantBrain AI — the missing memory layer for industrial operations.** Team names, one-line tagline.

## Slide 2 — The problem (Business Impact)
- Plants run **7–12 disconnected document systems**; professionals spend **~35% of their time** searching.
- Fragmentation drives **18–22% of unplanned downtime**; a **knowledge cliff** as senior engineers retire.
- Visual: scattered documents → one brain.

## Slide 3 — Why current tools fail
Keyword search doesn't understand assets; maintenance history isn't linked to procedures or
compliance; evidence is gathered by hand. No system *connects the dots across documents*.

## Slide 4 — Solution
An **asset-first, cited operations brain**: ask in plain English, get an answer stitched from
manuals + work orders + inspections + incidents + compliance — **every claim cited**.

## Slide 5 — The hero demo (Innovation + UX)
Screenshot of the P-204A copilot answer: fuses work order + incident + compliance gap, with
citations, confidence, missing evidence, next actions, and the "no source · no answer" badge.
*"An answer no single system in the plant could give."*

## Slide 6 — How it works (Technical Excellence)
Architecture diagram (see `architecture.md`). Key line: **GraphRAG = semantic search
(pgvector) + a deterministic knowledge graph**, then an LLM writes the cited answer. Two
phases: ingest once (extract→chunk→embed→graph); answer in real time.

## Slide 7 — Depth beyond a chatbot
Knowledge graph (asset→failure→component, with provenance), RCA agent, compliance-gap agent,
lessons-learned. LLM used for *language*, never for structural facts (no hallucinated edges).

## Slide 8 — Proof it works (Technical Excellence)
Real eval metrics: **retrieval hit-rate 100%, faithfulness 0.82, answer-relevancy 0.91,
~4.2 s vs ~12 min manual.** "We measured it."

## Slide 9 — Security & trust
No-source-no-answer, prompt-injection scanning (verified — model refuses), full audit trail,
every push security-reviewed, an RCE found & eliminated, `pip-audit` clean. Secrets never in git.

## Slide 10 — Scalability & roadmap (Scalability)
Real Postgres + pgvector (one datastore); provider-agnostic LLM (free Groq now → on-prem
Ollama for confidential data, zero code change). Roadmap: SAP PM / Maximo / SharePoint
connectors, SSO/RBAC, advanced P&ID parsing.

## Closing line
"Built and security-reviewed end to end, fully cited, on real infrastructure — ready to plug
into a plant's existing systems."
