"""Seed the demo plant and its assets (Shakti Petrochem Unit-2). Idempotent."""

from sqlalchemy.orm import Session

from app.db import models
from app.db.session import SessionLocal

PLANT_ID = "shakti-petrochem-unit-2"
PLANT_NAME = "Shakti Petrochem Unit-2"

# (asset_tag, asset_type, summary, open_risks, compliance_gaps)
DEMO_ASSETS = [
    ("P-204A", "Boiler Feed Pump",
     "Repeated abnormal vibration and seal leakage over the last 2 work orders.", 1, 0),
    ("HX-102", "Heat Exchanger", "Fouling and rising outlet temperature.", 1, 0),
    ("V-301", "Pressure Vessel", "Missing latest pressure test certificate.", 0, 1),
    ("C-110", "Compressor", "Overheating and lubrication issue.", 1, 0),
    ("TK-501", "Storage Tank", "Safety inspection and compliance record.", 0, 0),
]


def seed(db: Session | None = None) -> None:
    owns = db is None
    if owns:
        db = SessionLocal()
    try:
        if db.get(models.Plant, PLANT_ID) is None:
            db.add(models.Plant(id=PLANT_ID, name=PLANT_NAME))
        for tag, atype, summary, risks, gaps in DEMO_ASSETS:
            if db.get(models.Asset, tag) is None:
                db.add(models.Asset(
                    asset_tag=tag, plant_id=PLANT_ID, asset_type=atype,
                    summary=summary, open_risks=risks, compliance_gaps=gaps,
                ))
        db.commit()
    finally:
        if owns:
            db.close()
