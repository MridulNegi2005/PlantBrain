# PlantBrain AI — Demo Script (≈3–4 minutes)

Demo plant: **Shakti Petrochem Unit-2** · hero asset: **P-204A** (Boiler Feed Pump).
Two storylines: P-204A repeated failure (RCA) and V-301 missing certificate (compliance).

## Pre-demo checklist
- Backend up: `uvicorn app.main:app --port 8000` (health shows `db_connected` + `pgvector_enabled` true).
- Corpus ingested + graph built + one eval run stored (`ingest_corpus`, `build_graph`, `run_eval`).
- Frontend up: `npm run dev` → http://localhost:3000. Do a dry run once (cold DB request is slow).

## The flow

**1. The problem (15s) — Plant overview**
"A plant runs 7–12 disconnected document systems. An engineer wastes a third of their day
searching. PlantBrain is the missing memory layer." Point to the dashboard: **53 documents
indexed, 5 assets, risks + compliance gaps surfaced automatically.**

**2. The hero moment (60s) — Cited Copilot**
Open **Cited copilot**, scope **P-204A**, ask:
> "Why did P-204A fail twice this month, and is there a compliance issue with how it was closed out?"
Wait ~4s. Read the answer aloud — it fuses **the work order + the incident + the compliance record**:
"...coupling misalignment... WO-141 closed without a post-repair vibration reading."
Call out on screen: **citations (4), confidence, "Evidence still missing", recommended actions**, and the
**"No source · no answer"** badge. Say: *"This is an answer no single system in the plant could give — and
every claim is cited."*

**3. Show it's grounded, not guessing (20s)**
Ask something with no evidence in the corpus (e.g. "What's the share price of the plant?").
It **refuses** — "no supporting evidence." That's the guardrail.

**4. The connections (30s) — Knowledge graph**
Open **Knowledge graph** for P-204A. Show Asset → Documents → Failure modes → Components. Say:
*"The copilot walks these links — that's the GraphRAG multi-hop, not just keyword search."*

**5. Business value (40s) — RCA + Compliance**
- **Root cause** on P-204A: structured causes with evidence + missing checks.
- **Compliance** on **V-301**: flags the **missing hydrostatic pressure-test certificate, high risk** —
  a statutory gap caught automatically.

**6. Prove it works (30s) — Evaluation**
Open **Evaluation**. Real numbers from actual runs: **retrieval hit-rate 100%, faithfulness 0.82,
answer-relevancy 0.91, ~4.2s vs ~12 min manual.** Say: *"We measured it — these aren't vibes."*

**7. Trust & security (20s) — Audit + injection**
Show the **Audit log** (every question/upload logged). Mention: *"Uploaded documents are untrusted — we
scan them for prompt injection and the model refuses to obey embedded instructions. Verified live."*

**8. Close (15s)**
"Real Postgres + pgvector, a free local-swappable LLM, provider-agnostic, on-prem ready for confidential
plant data. Built in [N] days, fully cited, security-reviewed." 

## Demo-safety tips
- Pre-warm the backend (first request after idle is slow — hosted DB latency).
- Keep the two hero questions on a sticky note; don't improvise wording that might miss retrieval.
- If the LLM rate-limits (Groq free tier), the copilot falls back to extractive cited answers — still grounded.
