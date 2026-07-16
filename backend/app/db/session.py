import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(settings.sqlalchemy_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_connection() -> bool:
    """Verify the DB is reachable. Used by /health."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning("Database connection check failed: %s", exc)
        return False


def pgvector_available() -> bool:
    """Check (without side effects) whether the pgvector extension is enabled."""
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
            ).fetchone()
        return row is not None
    except Exception:
        return False


def ensure_pgvector() -> bool:
    """Enable pgvector if available on the server. Used by the bootstrap script.

    Returns True if enabled afterwards, False if it could not be enabled (e.g. the
    extension is not installed) — callers fall back to an embedded store (Chroma).
    """
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        return True
    except Exception as exc:
        logger.warning("Could not enable pgvector extension: %s", exc)
        return False
