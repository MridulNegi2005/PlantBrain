from fastapi import APIRouter, HTTPException

from app.api import fixtures

router = APIRouter(prefix="/api/assets", tags=["assets"])


def _not_found(asset_tag: str):
    raise HTTPException(status_code=404, detail={"error": {
        "code": "not_found", "message": f"Asset {asset_tag} not found.",
    }})


@router.get("")
def list_assets():
    return {"items": fixtures.ASSETS, "total": len(fixtures.ASSETS)}


@router.get("/{asset_tag}")
def get_asset(asset_tag: str):
    detail = fixtures.ASSET_DETAIL.get(asset_tag)
    if not detail:
        _not_found(asset_tag)
    return detail


@router.get("/{asset_tag}/timeline")
def get_asset_timeline(asset_tag: str):
    items = fixtures.ASSET_TIMELINE.get(asset_tag)
    if items is None:
        _not_found(asset_tag)
    return {"items": items}


@router.get("/{asset_tag}/graph")
def get_asset_graph(asset_tag: str):
    graph = fixtures.ASSET_GRAPH.get(asset_tag)
    if graph is None:
        _not_found(asset_tag)
    return graph
