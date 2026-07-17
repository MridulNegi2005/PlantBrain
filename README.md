# PlantBrain AI

*The missing memory layer for industrial operations.*

ET AI Hackathon 2026 — Problem Statement 8 (AI for Industrial Knowledge Intelligence). Full product/build plan:
`docs/plantbrain_ai_statement_8_deep_build_plan.md`. API contract for frontend/backend integration:
[`docs/api-contract.md`](docs/api-contract.md).

## Team & branches
- `negi` (Mridul) — backend, ingestion, RAG/graph, AI agents.
- `aj` (Atishay) — frontend, product, demo.
- `main` — integration branch, merged at defined intervals. Don't push directly to `main`.

## Backend setup
```powershell
cd backend
python -m venv .venv
\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env

# Choose one database mode in .env:
# Local demo: DATABASE_URL=sqlite:///./plantbrain.db
# Production-like: leave DATABASE_URL empty and fill POSTGRES_* (pgvector required)

python -m scripts.db_bootstrap        # creates tables and seeds the demo plant/assets
python -m scripts.load_corpus         # registers the committed synthetic corpus
python -m scripts.ingest_corpus       # extract -> chunk -> retrieval index -> graph
python -m scripts.run_eval            # (optional) run the eval harness, store metrics

python -m uvicorn app.main:app --reload --port 8000
```
No Docker is required. SQLite + BM25 is the zero-config demo path; hosted Postgres + pgvector is the
production-like semantic retrieval path. Visit `http://localhost:8000/docs` for interactive API docs, or
`http://localhost:8000/health` to check DB + pgvector status. On Postgres, embeddings use local fastembed
(bge-small, 384 dimensions); the first embedding call downloads the ONNX model once (~100MB, cached).

The cited copilot uses an **OpenAI-compatible LLM** (Groq free tier by default — set `LLM_API_KEY` in `.env`;
or point `LLM_BASE_URL` at a local Ollama). Without a key it falls back to extractive cited answers.
Embeddings are local/free (fastembed).

Run tests: `python -m pytest tests/ -q` (hermetic in-memory SQLite; never touches the hosted DB).

## Frontend setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Build against `docs/api-contract.md`. The backend returns persisted evidence and explicit empty/unknown states;
it does not fabricate fixture evidence.

## Status
Integrated prototype: document ingestion, cited retrieval, knowledge graph, RCA/compliance/lessons agents,
evaluation harness, audit/security events, synthetic corpus, and the operations frontend are implemented.
LLM synthesis is optional; without a key, evidence-backed extractive fallbacks remain available.
