"""Page-aware text chunking with overlap.

Splits each page's text into ~target_chars windows on whitespace boundaries, with
a small overlap so a fact spanning a boundary stays retrievable. Each chunk carries
its source page number for citations.
"""

from __future__ import annotations


def chunk_pages(pages: list[str], *, target_chars: int = 900, overlap: int = 150) -> list[dict]:
    chunks: list[dict] = []
    for page_no, text in enumerate(pages, start=1):
        for piece in _windows(text, target_chars, overlap):
            piece = piece.strip()
            if piece:
                chunks.append({"page": page_no, "text": piece})
    return chunks


def _windows(text: str, target: int, overlap: int) -> list[str]:
    text = text.strip()
    if len(text) <= target:
        return [text] if text else []

    out: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + target, n)
        if end < n:  # extend to the next whitespace so we don't split mid-word
            nxt = text.find(" ", end)
            if nxt != -1 and nxt - end < 40:
                end = nxt
        out.append(text[start:end])
        if end >= n:
            break
        start = max(end - overlap, start + 1)
    return out
