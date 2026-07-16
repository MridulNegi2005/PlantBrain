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
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate        # Windows Git Bash; use .venv\Scripts\activate.bat for cmd.exe
pip install -r requirements.txt
cp .env.example .env                  # fill in POSTGRES_* (hosted Postgres). No API key needed.

python -m scripts.db_bootstrap        # creates the plantbrain DB, tables (+ pgvector column), seeds assets
python -m scripts.generate_corpus     # writes the synthetic demo corpus into ../data/synthetic
python -m scripts.load_corpus         # registers the corpus as documents in Postgres
python -m scripts.ingest_corpus       # extract -> chunk -> embed all docs into pgvector

uvicorn app.main:app --reload --port 8000
```
No Docker required — the app connects directly to a hosted Postgres instance built from the `POSTGRES_*`
vars in `.env`. Visit `http://localhost:8000/docs` for interactive API docs, or `http://localhost:8000/health`
to check DB + pgvector status. Embeddings are stored in Postgres via **pgvector** (bge-small, 384-dim, via
fastembed — local and free). The first `ingest_corpus`/embed call downloads the ONNX model once (~100MB, cached).

The LLM is **optional** and only used from Interval 3 onward; it will run on a free local model (Ollama), so
no paid API key is required. Embeddings are local (sentence-transformers), also free.

Run tests: `python -m pytest tests/ -q` (10 passing, hermetic — uses in-memory SQLite, never the hosted DB).

## Frontend setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Build against `docs/api-contract.md` — every endpoint is live right now as a stub returning realistic fixture
data, so the full frontend can be built before real backend logic lands.

## Status
Interval 0 complete: repo scaffold, mock API contract + stub FastAPI, DB wiring. See
`.ai-sync/handoff.md` for the current handoff state between agents/sessions.
