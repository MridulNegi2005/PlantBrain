from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, agents, assets, documents, evaluation
from app.core.config import settings
from app.db.session import check_connection, ensure_pgvector

app = FastAPI(title="PlantBrain AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(assets.router)
app.include_router(agents.router)
app.include_router(evaluation.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    db_connected = check_connection()
    pgvector_enabled = ensure_pgvector() if db_connected else False
    return {"status": "ok", "db_connected": db_connected, "pgvector_enabled": pgvector_enabled}
