"""Local embeddings via fastembed (ONNX, CPU, no torch) — free, no API key.

Default model BAAI/bge-small-en-v1.5 -> 384-dim vectors. The model is loaded lazily
and cached, so importing this module stays cheap.
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings

EMBED_DIM = 384


@lru_cache(maxsize=1)
def _model():
    from fastembed import TextEmbedding

    return TextEmbedding(model_name=settings.embedding_model)


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    return [vec.tolist() for vec in _model().embed(texts)]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]
