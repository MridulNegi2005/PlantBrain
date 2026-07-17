"""Register the generated corpus as Document rows in Postgres.

    cd backend && python -m scripts.generate_corpus   # writes files + manifest
    cd backend && python -m scripts.load_corpus        # inserts Document rows

Reads data/synthetic/manifest.json, computes each file's hash + page count, and
upserts a Document row (idempotent by content hash). Ingestion (pages/chunks/graph)
runs later via the Interval 2 pipeline; this only registers the documents so asset
document-counts and the document list reflect the real corpus.
"""

import hashlib
import json
from pathlib import Path

from pypdf import PdfReader

from app.db import models
from app.db.base import gen_id
from app.db.seed import PLANT_ID, seed
from app.db.session import SessionLocal

ROOT = Path(__file__).resolve().parents[2]
SYN = ROOT / "data" / "synthetic"


def _page_count(path: Path) -> int:
    if path.suffix.lower() != ".pdf":
        return 0
    try:
        return len(PdfReader(str(path)).pages)
    except Exception:
        return 0


def main() -> int:
    manifest_path = SYN / "manifest.json"
    if not manifest_path.exists():
        print("manifest.json not found — run scripts.generate_corpus first")
        return 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    db = SessionLocal()
    try:
        seed(db)  # ensure plant + assets exist
        existing = {d.hash_sha256 for d in db.query(models.Document.hash_sha256).all()}
        added = 0
        for entry in manifest:
            path = SYN / entry["filename"]
            if not path.exists():
                continue
            data = path.read_bytes()
            digest = hashlib.sha256(data).hexdigest()
            if digest in existing:
                continue
            db.add(models.Document(
                id=gen_id("doc"), plant_id=PLANT_ID,
                filename=Path(entry["filename"]).name,
                doc_type=entry["doc_type"], status="registered",
                storage_path=str(path), hash_sha256=digest,
                asset_tags=entry["asset_tags"], page_count=_page_count(path),
            ))
            existing.add(digest)
            added += 1
        db.commit()
        total = db.query(models.Document).count()
        print(f"registered {added} new documents ({total} total in DB)")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
