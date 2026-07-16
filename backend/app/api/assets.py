from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import models
from app.db.crud import document_counts_by_asset
from app.db.session import get_db

router = APIRouter(prefix="/api/assets", tags=["assets"])


def _not_found(asset_tag: str):
    raise HTTPException(status_code=404, detail={"error": {
        "code": "not_found", "message": f"Asset {asset_tag} not found.",
    }})


@router.get("")
def list_assets(db: Session = Depends(get_db)):
    assets = db.query(models.Asset).order_by(models.Asset.asset_tag).all()
    counts = document_counts_by_asset(db)
    items = [{
        "asset_tag": a.asset_tag,
        "asset_type": a.asset_type,
        "document_count": counts.get(a.asset_tag, 0),
        "open_risks": a.open_risks,
        "compliance_gaps": a.compliance_gaps,
    } for a in assets]
    return {"items": items, "total": len(items)}


@router.get("/{asset_tag}")
def get_asset(asset_tag: str, db: Session = Depends(get_db)):
    asset = db.get(models.Asset, asset_tag)
    if asset is None:
        _not_found(asset_tag)
    counts = document_counts_by_asset(db)
    return {
        "asset_tag": asset.asset_tag,
        "asset_type": asset.asset_type,
        "plant_id": asset.plant_id,
        "document_count": counts.get(asset.asset_tag, 0),
        "open_risks": asset.open_risks,
        "compliance_gaps": asset.compliance_gaps,
        "summary": asset.summary,
    }


@router.get("/{asset_tag}/timeline")
def get_asset_timeline(asset_tag: str, db: Session = Depends(get_db)):
    if db.get(models.Asset, asset_tag) is None:
        _not_found(asset_tag)
    # Interval 1: timeline is derived from documents linked to the asset. Typed
    # work-order/inspection events get richer once entity extraction lands (Interval 3).
    docs = db.query(models.Document).order_by(models.Document.created_at).all()
    items = [{
        "type": d.doc_type,
        "id": d.id,
        "date": d.created_at.date().isoformat(),
        "title": d.filename,
        "document_id": d.id,
    } for d in docs if asset_tag in (d.asset_tags or [])]
    return {"items": items}


@router.get("/{asset_tag}/graph")
def get_asset_graph(asset_tag: str, db: Session = Depends(get_db)):
    if db.get(models.Asset, asset_tag) is None:
        _not_found(asset_tag)
    # Graph is populated in Interval 3 (KG builder). Return the asset node plus its
    # linked-document nodes so the viewer renders real structure now.
    docs = [d for d in db.query(models.Document).all() if asset_tag in (d.asset_tags or [])]
    nodes = [{"id": f"asset:{asset_tag}", "type": "Asset", "label": asset_tag}]
    edges = []
    for d in docs:
        nid = f"doc:{d.id}"
        nodes.append({"id": nid, "type": "Document", "label": d.filename})
        edges.append({"source": f"asset:{asset_tag}", "target": nid,
                      "type": "ASSET_HAS_DOCUMENT", "confidence": 1.0})
    return {"nodes": nodes, "edges": edges}
