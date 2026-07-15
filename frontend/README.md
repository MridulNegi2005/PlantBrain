# PlantBrain AI frontend

The PlantBrain operator interface is a Next.js App Router application built against the FastAPI contract in `../docs/api-contract.md`. It does not ship frontend fixture fallbacks: loading, empty, and API-error states stay visible until the backend returns data.

## Local setup

Start the backend from the repository root:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

In a second terminal, start the frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000` when it is not set.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
```

## Product routes

- `/dashboard` — plant overview and service health
- `/upload` — document upload and ingestion-status timeline
- `/documents` — ingestion registry
- `/assets` and `/assets/P-204A` — asset index and evidence profile
- `/copilot` — cited question answering with a source drawer
- `/graph` — provenance-scored knowledge graph
- `/rca`, `/compliance`, `/evaluation` — agent and benchmark workbenches
- `/admin/audit` — audit and security events
