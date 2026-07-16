"""Build the knowledge graph from ingested chunks.

    cd backend && python -m scripts.build_graph

Run after scripts.ingest_corpus (needs chunks). Idempotent — rebuilds nodes/edges.
"""

from app.db.session import SessionLocal
from app.graph.builder import build_graph


def main() -> int:
    db = SessionLocal()
    try:
        stats = build_graph(db)
        print(f"graph built: {stats['nodes']} nodes, {stats['edges']} edges, "
              f"{stats['entities']} entities")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
