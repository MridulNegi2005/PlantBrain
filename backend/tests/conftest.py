import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import models  # noqa: F401  (registers tables on Base.metadata)
from app.db.base import Base
from app.db.seed import seed
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def client():
    """A TestClient backed by a fresh in-memory SQLite DB (seeded), so tests never
    touch the hosted Postgres."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)

    seed_db = TestingSession()
    seed(seed_db)
    seed_db.close()

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
