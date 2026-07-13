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
source .venv/Scripts/activate   # Windows Git Bash; use .venv\Scripts\activate.bat for cmd.exe
pip install -r requirements.txt
cp .env.example .env            # then fill in DATABASE_URL (hosted Postgres) + ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```
No Docker required — the app connects directly to a hosted Postgres instance via `DATABASE_URL`. Visit
`http://localhost:8000/docs` for interactive API docs, or `http://localhost:8000/health` to check DB +
pgvector status.

Run tests: `python -m pytest tests/ -v` (6 passing as of Interval 0).

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
