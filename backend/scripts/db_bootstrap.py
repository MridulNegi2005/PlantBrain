"""Idempotent DB bootstrap: create the target database if missing, enable pgvector.

Run once after filling backend/.env (safe to re-run):
    cd backend && python -m scripts.db_bootstrap

Connects to the 'postgres' maintenance database to create the target DB (CREATE
DATABASE cannot run inside a transaction), then enables pgvector in the target.
If pgvector is not installed on the server, it reports that so we fall back to an
embedded vector store (Chroma) for Interval 2 rather than failing.
"""

import sys

import psycopg

from app.core.config import settings


def _conninfo(dbname: str) -> str:
    return (
        f"host={settings.postgres_host} port={settings.postgres_port} "
        f"user={settings.postgres_user} password={settings.postgres_password} "
        f"dbname={dbname}"
    )


def main() -> int:
    target = settings.postgres_db

    try:
        with psycopg.connect(_conninfo("postgres"), autocommit=True) as conn:
            exists = conn.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s", (target,)
            ).fetchone()
            if exists:
                print(f"database '{target}' already exists")
            else:
                conn.execute(f'CREATE DATABASE "{target}"')
                print(f"created database '{target}'")
    except Exception as exc:
        print(f"FAILED to connect/create database: {exc}", file=sys.stderr)
        return 1

    with psycopg.connect(_conninfo(target), autocommit=True) as conn:
        server = conn.execute("SELECT version()").fetchone()[0]
        print(f"connected OK -> {server.split(',')[0]}")
        try:
            conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            ver = conn.execute(
                "SELECT extversion FROM pg_extension WHERE extname = 'vector'"
            ).fetchone()
            print(f"pgvector enabled (version {ver[0]})")
        except Exception as exc:
            print(f"pgvector NOT available: {exc}")
            print("=> Interval 2 will use the Chroma embedded-vector fallback.")

    # Create tables and seed the demo plant/assets (imported here so a bad DATABASE_URL
    # fails at the connection step above, not at import time).
    from sqlalchemy import text as _sql

    from app.db.base import Base
    from app.db import models  # noqa: F401  (registers tables on Base.metadata)
    from app.db.seed import seed
    from app.db.session import engine, pgvector_available
    from app.ingestion.embed import EMBED_DIM

    Base.metadata.create_all(bind=engine)
    print(f"tables created ({len(Base.metadata.tables)} tables)")

    # Add the pgvector embedding column + ANN index (kept out of the ORM model so the
    # schema stays SQLite-compatible for hermetic tests).
    if pgvector_available():
        with engine.begin() as conn:
            conn.execute(_sql(
                f"ALTER TABLE chunks ADD COLUMN IF NOT EXISTS embedding vector({EMBED_DIM})"))
            conn.execute(_sql(
                "CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw "
                "ON chunks USING hnsw (embedding vector_cosine_ops)"))
        print(f"pgvector embedding column ready (vector({EMBED_DIM}) + HNSW index)")

    seed()
    print("seeded demo plant + assets")

    return 0


if __name__ == "__main__":
    sys.exit(main())
