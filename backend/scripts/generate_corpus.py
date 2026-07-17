"""Render the synthetic Shakti Petrochem corpus to files + a manifest + gold labels.

    cd backend && python -m scripts.generate_corpus

Writes into ../data/synthetic/ (PDFs + CSVs), a manifest.json mapping each file to
its doc_type and linked asset tags (used by scripts.load_corpus), and starter gold
labels into ../data/labeled/ for the evaluation harness (Interval 5).
"""

import csv
import datetime as dt
import json
from pathlib import Path

import reportlab.rl_config
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from scripts import corpus_data as C

# Deterministic output: fixed timestamps + file IDs so regenerating produces
# byte-identical PDFs (stable git diffs, and stable content hashes for load dedup).
reportlab.rl_config.invariant = 1

ROOT = Path(__file__).resolve().parents[2]
SYN = ROOT / "data" / "synthetic"
LABELED = ROOT / "data" / "labeled"

_styles = getSampleStyleSheet()


def _pdf(path: Path, title: str, meta: dict, sections: list[tuple[str, list[str]]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(path), pagesize=A4, title=title)
    flow = [Paragraph(title, _styles["Title"]), Spacer(1, 8)]
    meta_line = "&nbsp;&nbsp;|&nbsp;&nbsp;".join(f"<b>{k}:</b> {v}" for k, v in meta.items())
    flow += [Paragraph(meta_line, _styles["Normal"]), Spacer(1, 12)]
    for heading, lines in sections:
        flow.append(Paragraph(heading, _styles["Heading2"]))
        for ln in lines:
            flow.append(Paragraph(ln, _styles["Normal"]))
            flow.append(Spacer(1, 4))
        flow.append(Spacer(1, 8))
    doc.build(flow)


def generate() -> list[dict]:
    manifest: list[dict] = []

    def add(fn: str, doc_type: str, tags: list[str]):
        manifest.append({"filename": fn, "doc_type": doc_type, "asset_tags": tags})

    # Manuals
    for mid, title, atype, tag, sections in C.MANUALS:
        fn = f"manuals/{mid}.pdf"
        _pdf(SYN / fn, f"{mid} — {title}",
             {"Plant": C.PLANT, "Equipment Type": atype, "Asset": tag}, sections)
        add(fn, "manual", [tag])

    # Work orders (PDF each) + a register CSV
    for wo in C.WORK_ORDERS:
        wid, asset, date, title, desc, findings, action, status, prt = wo
        fn = f"work_orders/{wid}.pdf"
        _pdf(SYN / fn, f"Work Order {wid} — {title}",
             {"Plant": C.PLANT, "Asset": asset, "Date": date, "Status": status},
             [("Description", [desc]), ("Findings", [findings]),
              ("Action Taken", [action]), ("Post-Repair Test", [prt])])
        add(fn, "work_order", [asset])
    with (SYN / "work_orders" / "work_order_register.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["work_order_id", "asset_tag", "date", "title", "status", "post_repair_test"])
        for wo in C.WORK_ORDERS:
            w.writerow([wo[0], wo[1], wo[2], wo[3], wo[7], wo[8]])
    add("work_orders/work_order_register.csv", "work_order_register", sorted({wo[1] for wo in C.WORK_ORDERS}))

    # Inspections
    for iid, asset, date, itype, findings, result, nxt in C.INSPECTIONS:
        fn = f"inspections/{iid}.pdf"
        _pdf(SYN / fn, f"Inspection Report {iid} — {itype}",
             {"Plant": C.PLANT, "Asset": asset, "Date": date, "Result": result, "Next Due": nxt},
             [("Findings", [findings]), ("Result", [result])])
        add(fn, "inspection_report", [asset])

    # Incidents
    for cid, asset, date, title, desc, rca, lessons in C.INCIDENTS:
        fn = f"incidents/{cid}.pdf"
        _pdf(SYN / fn, f"Incident Report {cid} — {title}",
             {"Plant": C.PLANT, "Asset": asset, "Date": date},
             [("Description", [desc]), ("Root Cause", [rca]), ("Lessons Learned", [lessons])])
        add(fn, "incident_report", [asset])

    # SOPs
    for sid, title, applies, rev, reviewed, steps in C.SOPS:
        fn = f"sops/{sid}.pdf"
        _pdf(SYN / fn, f"{sid} — {title}",
             {"Plant": C.PLANT, "Applies To": applies, "Revision": rev, "Last Reviewed": reviewed},
             [("Procedure Steps", [f"{i}. {s}" for i, s in enumerate(steps, 1)])])
        add(fn, "sop", [])

    # Safety procedures
    for sid, title, cat in C.SAFETY_PROCEDURES:
        fn = f"safety/{sid}.pdf"
        _pdf(SYN / fn, f"{sid} — {title}",
             {"Plant": C.PLANT, "Category": cat},
             [("Purpose", [f"Plant safety standard covering {title.lower()}."])])
        add(fn, "safety_procedure", [])

    # Compliance checklists
    for kid, asset, req, std, status, note in C.COMPLIANCE:
        fn = f"compliance/{kid}.pdf"
        _pdf(SYN / fn, f"Compliance Checklist {kid}",
             {"Plant": C.PLANT, "Asset": asset, "Standard": std, "Status": status},
             [("Requirement", [req]), ("Evidence Status", [status]), ("Note", [note])])
        add(fn, "compliance_checklist", [asset])

    # Sensor snapshots (CSV)
    base = dt.date(2026, 6, 1)
    for asset, (metric, values, unit) in C.SENSOR_LOGS.items():
        fn = f"sensor_logs/{asset}_sensor.csv"
        with (SYN / fn).open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["timestamp", "asset_tag", "metric", "value", "unit"])
            for i, val in enumerate(values):
                ts = (base + dt.timedelta(days=i * 5)).isoformat()
                w.writerow([ts, asset, metric, val, unit])
        add(fn, "sensor_log", [asset])

    (SYN / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def write_gold_labels() -> None:
    """Starter gold labels for the evaluation harness (expanded in Interval 5)."""
    LABELED.mkdir(parents=True, exist_ok=True)

    qa_gold = [
        {"id": "q1", "question": "Why did P-204A fail twice recently?", "category": "rca",
         "expected_docs": ["WO-129", "WO-141", "IR-17", "INC-08", "OEM-PUMP-02"],
         "expected_points": ["abnormal vibration", "seal wear", "coupling misalignment",
                             "missing post-repair vibration reading"]},
        {"id": "q2", "question": "What compliance gaps exist for V-301?", "category": "compliance",
         "expected_docs": ["CMP-01", "IR-33"],
         "expected_points": ["missing latest pressure test certificate", "overdue hydrostatic test"]},
        {"id": "q3", "question": "What should a technician check before closing a pump seal replacement?",
         "category": "multi_hop", "expected_docs": ["SOP-17", "OEM-PUMP-02", "INC-08"],
         "expected_points": ["laser coupling alignment", "post-repair vibration reading"]},
        {"id": "q4", "question": "Why is HX-102 outlet temperature rising?", "category": "rca",
         "expected_docs": ["WO-133", "IR-19", "OEM-HX-01"],
         "expected_points": ["tube-side fouling", "cleaning interval"]},
        {"id": "q5", "question": "Find similar past failures to a pump seal leak.", "category": "lessons",
         "expected_docs": ["INC-08"],
         "expected_points": ["coupling misalignment", "post-repair verification"]},
    ]
    (LABELED / "qa_gold.json").write_text(json.dumps(qa_gold, indent=2), encoding="utf-8")

    compliance_gold = [
        {"asset": "V-301", "requirement": "Valid hydrostatic pressure-test certificate",
         "expected_status": "gap", "risk_level": "high"},
        {"asset": "P-204A", "requirement": "Post-maintenance verification recorded on closeout",
         "expected_status": "gap", "risk_level": "medium"},
        {"asset": "C-110", "requirement": "Relief-valve pop test within interval",
         "expected_status": "ok", "risk_level": "low"},
    ]
    (LABELED / "compliance_gold.json").write_text(json.dumps(compliance_gold, indent=2), encoding="utf-8")

    entities_gold = [
        {"doc": "WO-141", "entities": [
            {"type": "asset_tag", "value": "P-204A"}, {"type": "component", "value": "mechanical seal"},
            {"type": "failure_mode", "value": "missing post-repair test"}]},
        {"doc": "IR-17", "entities": [
            {"type": "asset_tag", "value": "P-204A"}, {"type": "measurement", "value": "6.2 mm/s"},
            {"type": "failure_mode", "value": "abnormal vibration"}]},
    ]
    (LABELED / "entities_gold.json").write_text(json.dumps(entities_gold, indent=2), encoding="utf-8")


def main() -> int:
    manifest = generate()
    write_gold_labels()
    by_type: dict[str, int] = {}
    for m in manifest:
        by_type[m["doc_type"]] = by_type.get(m["doc_type"], 0) + 1
    print(f"generated {len(manifest)} documents into {SYN}")
    for t, n in sorted(by_type.items()):
        print(f"  {t}: {n}")
    print("wrote gold labels: qa_gold.json, compliance_gold.json, entities_gold.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
