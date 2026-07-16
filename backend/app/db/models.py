"""SQLAlchemy models — schema per build plan §10.2.

Interval 1 actively uses: Plant, Asset, Document, DocumentPage, IngestionJob,
AuditLog. Chunk/Entity/GraphNode/GraphEdge and the QA/eval tables are defined now
so the schema is complete and stable, and get populated in Intervals 2-5.
Vectors are NOT stored here (server has no pgvector) — Chroma handles those.
"""

import datetime as dt

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _now_col() -> Mapped[dt.datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Plant(Base):
    __tablename__ = "plants"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[dt.datetime] = _now_col()

    assets: Mapped[list["Asset"]] = relationship(back_populates="plant")


class Asset(Base):
    __tablename__ = "assets"

    asset_tag: Mapped[str] = mapped_column(String, primary_key=True)
    plant_id: Mapped[str] = mapped_column(ForeignKey("plants.id"), nullable=False)
    asset_type: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    open_risks: Mapped[int] = mapped_column(Integer, default=0)
    compliance_gaps: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[dt.datetime] = _now_col()

    plant: Mapped[Plant] = relationship(back_populates="assets")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    plant_id: Mapped[str] = mapped_column(ForeignKey("plants.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    doc_type: Mapped[str] = mapped_column(String, default="unclassified")
    status: Mapped[str] = mapped_column(String, default="uploaded")
    storage_path: Mapped[str | None] = mapped_column(String)
    hash_sha256: Mapped[str] = mapped_column(String, nullable=False)
    asset_tags: Mapped[list] = mapped_column(JSON, default=list)
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_by: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[dt.datetime] = _now_col()

    pages: Mapped[list["DocumentPage"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    chunks: Mapped[list["Chunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentPage(Base):
    __tablename__ = "document_pages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, default="")

    document: Mapped[Document] = relationship(back_populates="pages")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    bbox: Mapped[dict | None] = mapped_column(JSON)
    asset_tags: Mapped[list] = mapped_column(JSON, default=list)
    embedding_ref: Mapped[str | None] = mapped_column(String)  # id in the Chroma store
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[dt.datetime] = _now_col()

    document: Mapped[Document] = relationship(back_populates="chunks")


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)
    normalized_value: Mapped[str | None] = mapped_column(String)
    confidence: Mapped[float | None] = mapped_column(Float)
    source_chunk_id: Mapped[str | None] = mapped_column(ForeignKey("chunks.id"))
    created_at: Mapped[dt.datetime] = _now_col()


class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. asset:P-204A
    node_type: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    source_node_id: Mapped[str] = mapped_column(ForeignKey("graph_nodes.id"), nullable=False)
    target_node_id: Mapped[str] = mapped_column(ForeignKey("graph_nodes.id"), nullable=False)
    edge_type: Mapped[str] = mapped_column(String, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float)
    source_chunk_id: Mapped[str | None] = mapped_column(ForeignKey("chunks.id"))


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="queued")
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = _now_col()
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor: Mapped[str | None] = mapped_column(String)
    action: Mapped[str] = mapped_column(String, nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String)
    resource_id: Mapped[str | None] = mapped_column(String)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[dt.datetime] = _now_col()


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String)
    detail: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = _now_col()
