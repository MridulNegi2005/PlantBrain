import uuid

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def gen_id(prefix: str) -> str:
    """Short prefixed id, e.g. doc_a1b2c3d4e5f6 — matches the API contract style."""
    return f"{prefix}_{uuid.uuid4().hex[:12]}"
