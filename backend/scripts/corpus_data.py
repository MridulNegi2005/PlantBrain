"""Synthetic corpus content for Shakti Petrochem Unit-2.

Storylines are internally consistent so the later RCA / compliance / lessons demos
work end to end. Hero threads:
  - P-204A: repeated seal leakage + abnormal vibration, missing post-repair test.
  - V-301 : missing latest pressure-test certificate (compliance gap).
  - HX-102: fouling and rising outlet temperature.
"""

PLANT = "Shakti Petrochem Unit-2"

MANUALS = [
    ("OEM-PUMP-02", "Boiler Feed Pump — Operation & Maintenance Manual", "Boiler Feed Pump", "P-204A", [
        ("Vibration Limits", [
            "Normal operating vibration at drive-end (DE) bearing: <= 4.5 mm/s RMS.",
            "Alarm threshold: 4.5 mm/s. Trip / immediate inspection: 7.1 mm/s.",
            "Sustained readings above alarm indicate misalignment, bearing wear, or seal distress.",
        ]),
        ("Mechanical Seal", [
            "The cartridge mechanical seal must be replaced as a unit; do not re-lap faces in situ.",
            "After any seal replacement, perform laser shaft-alignment and record a post-repair vibration reading.",
            "Seal weepage at the gland indicates face wear; investigate coupling alignment as a root cause.",
        ]),
        ("Bearings & Coupling", [
            "Check coupling alignment to 0.05 mm concentricity after maintenance.",
            "Inspect DE/NDE bearing housings for temperature and lubrication at each PM.",
        ]),
    ]),
    ("OEM-HX-01", "Shell & Tube Heat Exchanger — Maintenance Manual", "Heat Exchanger", "HX-102", [
        ("Fouling & Cleaning", [
            "A rising outlet temperature at constant duty indicates tube-side fouling.",
            "Recommended cleaning interval: 6 months, or when outlet temperature rises 8 degC above baseline.",
        ]),
        ("Inspection", ["Inspect tube bundle for scaling and pitting at each turnaround."]),
    ]),
    ("OEM-COMP-03", "Reciprocating Compressor — Service Manual", "Compressor", "C-110", [
        ("Lubrication", ["Maintain lube-oil level above the minimum sight-glass mark; low oil causes overheating."]),
        ("Cooling", ["Inter-stage temperature above 140 degC requires immediate investigation."]),
    ]),
    ("OEM-PV-04", "Pressure Vessel — Inspection & Certification Manual", "Pressure Vessel", "V-301", [
        ("Statutory Testing", [
            "Pressure vessels require periodic hydrostatic testing and a valid test certificate.",
            "Operating a vessel beyond its certificate validity is a statutory non-compliance.",
        ]),
    ]),
    ("OEM-TK-05", "Atmospheric Storage Tank — Operating Manual", "Storage Tank", "TK-501", [
        ("Safety", ["Confirm gas-free certificate before any internal inspection or hot work."]),
    ]),
]

# id, asset, date, title, description, findings, action, status, post_repair_test
WORK_ORDERS = [
    ("WO-129", "P-204A", "2026-05-28", "Seal leakage reported",
     "Operator reported gland weepage on boiler feed pump P-204A during routine round.",
     "Mechanical seal showing steady weep at gland. Vibration noted as elevated by operator.",
     "Raised for seal inspection and replacement. Advised alignment check.", "closed", "n/a"),
    ("WO-141", "P-204A", "2026-06-18", "Mechanical seal replaced",
     "Planned replacement of cartridge mechanical seal on P-204A following WO-129.",
     "Seal cartridge replaced. Coupling guard refitted.",
     "Seal replaced. NOTE: post-repair vibration reading NOT recorded; alignment check not documented.",
     "closed", "MISSING"),
    ("WO-133", "HX-102", "2026-06-05", "Rising outlet temperature",
     "Process reported HX-102 outlet temperature rising above baseline at constant duty.",
     "Suspected tube-side fouling. Outlet temp 9 degC above baseline.",
     "Scheduled chemical cleaning of tube bundle.", "open", "n/a"),
    ("WO-137", "C-110", "2026-06-12", "Compressor overheating",
     "C-110 tripped on high inter-stage temperature.",
     "Lube-oil level found below minimum. Inter-stage temp 150 degC.",
     "Topped up lube oil, reset trip. Monitor.", "closed", "n/a"),
    ("WO-150", "TK-501", "2026-06-25", "Level transmitter calibration",
     "Routine calibration of TK-501 level transmitter.",
     "Transmitter within tolerance after calibration.", "Calibrated and returned to service.", "closed", "n/a"),
    ("WO-118", "P-204A", "2026-04-30", "Bearing lubrication PM",
     "Scheduled preventive lubrication of P-204A bearings.",
     "DE/NDE bearings greased. No abnormality at time of PM.", "Completed.", "closed", "n/a"),
    ("WO-145", "HX-102", "2026-06-20", "Gasket replacement",
     "Channel-cover gasket weeping on HX-102.", "Gasket replaced.", "Completed and leak-tested.", "closed", "n/a"),
    ("WO-152", "C-110", "2026-06-28", "Valve plate inspection",
     "Routine inspection of C-110 first-stage valve plates.", "Minor wear within limits.", "Reassembled.", "closed", "n/a"),
    ("WO-160", "V-301", "2026-07-01", "Relief valve pop test due",
     "Relief valve on V-301 approaching test due date.", "Pending scheduling.", "Raised to planning.", "open", "n/a"),
    ("WO-108", "P-204A", "2026-03-15", "Coupling inspection",
     "Routine coupling inspection on P-204A.", "Coupling element showing early wear.", "Noted for next overhaul.", "closed", "n/a"),
]

# id, asset, date, itype, findings, result, next_due
INSPECTIONS = [
    ("IR-17", "P-204A", "2026-06-10", "Vibration survey",
     "DE bearing vibration measured at 6.2 mm/s RMS, above 4.5 mm/s alarm. Spectrum suggests "
     "misalignment / early bearing wear. Recommend coupling alignment and post-repair verification.",
     "ABNORMAL", "2026-07-10"),
    ("IR-22", "V-301", "2024-05-12", "Hydrostatic pressure test",
     "Vessel hydrostatically tested to 1.5x MAWP. Passed. Certificate issued, valid per statutory interval.",
     "PASS", "2026-05-12"),
    ("IR-19", "HX-102", "2026-06-08", "Thermal performance inspection",
     "Tube-side fouling observed. Outlet temperature elevated. Cleaning recommended.", "ATTENTION", "2026-09-08"),
    ("IR-20", "C-110", "2026-06-13", "Mechanical inspection",
     "Post-overheat inspection. Lubrication corrected. Valves within limits.", "PASS", "2026-09-13"),
    ("IR-25", "TK-501", "2026-05-20", "External + safety inspection",
     "Shell and appurtenances inspected. Foam system checked. No defects.", "PASS", "2026-11-20"),
    ("IR-30", "P-204A", "2026-02-10", "Baseline vibration",
     "Baseline vibration 3.1 mm/s RMS, within limits.", "PASS", "2026-05-10"),
    ("IR-31", "HX-102", "2026-01-15", "Baseline thermal",
     "Baseline outlet temperature recorded for trend reference.", "PASS", "2026-07-15"),
    ("IR-33", "V-301", "2026-06-30", "Visual external inspection",
     "External surfaces and fittings inspected. No wall-thickness concerns. NOTE: latest hydrostatic "
     "test certificate not on file; last valid test 2024-05-12, appears overdue.", "ATTENTION", "2026-07-30"),
]

# id, asset, date, title, description, root_cause, lessons
INCIDENTS = [
    ("INC-08", "P-204A", "2025-11-03", "Recurrent pump seal failure",
     "A boiler feed pump suffered repeated mechanical seal failures over two months, culminating in "
     "a forced outage.",
     "Coupling misalignment left uncorrected after a prior seal replacement accelerated seal face wear.",
     "Enforce laser shaft-alignment and a recorded post-repair vibration reading after every seal "
     "replacement. Missing post-repair verification is a leading indicator of repeat failure."),
    ("INC-11", "C-110", "2025-08-19", "Compressor high-temperature trip",
     "Reciprocating compressor tripped repeatedly on inter-stage high temperature.",
     "Low lube-oil level from a deferred top-up.",
     "Tie lube-oil checks to shift handover; do not defer consumable top-ups."),
    ("INC-14", "TK-501", "2025-09-27", "Tank overfill near-miss",
     "Storage tank approached overfill during a receipt; high-high alarm arrested the transfer.",
     "Level transmitter drift not caught between calibrations.",
     "Shorten calibration interval for custody-critical level instruments."),
    ("INC-16", "HX-102", "2025-12-05", "Tube leak during operation",
     "A shell-and-tube exchanger developed a tube-side leak.",
     "Under-frequency of cleaning allowed fouling and localized corrosion.",
     "Hold to the 6-month cleaning interval; trend outlet temperature as an early indicator."),
    ("INC-20", "V-301", "2025-10-10", "Vessel certificate lapse audit finding",
     "An audit found a pressure vessel operating with a lapsed statutory test certificate.",
     "No tracking linkage between test due-dates and the operating permit.",
     "Maintain an automated compliance register mapping each vessel to its certificate validity."),
    ("INC-22", "P-204A", "2025-07-01", "Confined space entry near-miss",
     "During pump pit entry a gas test was skipped; supervisor intervened.",
     "Gas-test confirmation not enforced before entry.",
     "No confined-space entry without a recorded gas-test confirmation."),
]

# id, title, applies_to, revision, last_reviewed, steps
SOPS = [
    ("SOP-17", "Centrifugal Pump Maintenance", "Boiler Feed Pump", "Rev 4", "2024-01-10", [
        "Isolate and lock out the pump (LOTO) before any work.",
        "For seal replacement, replace the cartridge seal as a unit.",
        "Perform laser coupling alignment to 0.05 mm concentricity.",
        "Record a post-repair vibration reading and attach to the work order before closeout.",
    ]),
    ("SOP-22", "Pressure Vessel Inspection & Certification", "Pressure Vessel", "Rev 2", "2025-03-01", [
        "Verify the current hydrostatic test certificate is valid before operation.",
        "Schedule hydrostatic testing ahead of certificate expiry.",
        "File the test certificate against the vessel record and update the compliance register.",
    ]),
    ("SOP-30", "Heat Exchanger Cleaning", "Heat Exchanger", "Rev 3", "2025-06-15", [
        "Trend outlet temperature; clean when it rises 8 degC above baseline or every 6 months.",
        "Isolate, drain, and gas-free before opening the channel.",
    ]),
    ("SOP-08", "Lock-Out / Tag-Out (LOTO)", "All", "Rev 5", "2025-02-20", [
        "Identify all energy sources. Isolate, lock, tag, and verify zero energy before work.",
    ]),
    ("SOP-12", "Confined Space Entry", "All", "Rev 4", "2025-04-05", [
        "Obtain a confined-space entry permit.",
        "Perform and record a gas test (O2, LEL, toxic) immediately before entry.",
        "Maintain continuous atmospheric monitoring and a standby attendant.",
    ]),
    ("SOP-15", "Hot Work Permit", "All", "Rev 3", "2025-05-11", [
        "Obtain a hot-work permit and confirm a valid gas test in the work area.",
        "Provide fire watch during and 30 minutes after hot work.",
    ]),
    ("SOP-40", "Compressor Operation & Lubrication", "Compressor", "Rev 2", "2025-01-30", [
        "Verify lube-oil level above minimum before start.",
        "Monitor inter-stage temperature; investigate above 140 degC.",
    ]),
    ("SOP-45", "Storage Tank Receipt & Level Control", "Storage Tank", "Rev 3", "2025-03-22", [
        "Confirm available ullage before receipt.",
        "Verify high and high-high level alarms are functional.",
    ]),
]

# id, title, category
SAFETY_PROCEDURES = [
    ("SAFE-01", "Gas Testing Procedure", "atmosphere"),
    ("SAFE-02", "Personal Protective Equipment Standard", "ppe"),
    ("SAFE-03", "Emergency Evacuation & Assembly", "emergency"),
    ("SAFE-04", "Permit-to-Work System", "permit"),
    ("SAFE-05", "Fire Watch Standard", "fire"),
]

# id, asset, requirement, standard, evidence_status, note
COMPLIANCE = [
    ("CMP-01", "V-301", "Valid hydrostatic pressure-test certificate", "Factories Act 1948 / IBR",
     "GAP", "Latest pressure-test certificate not on file; last valid test 2024-05-12 appears overdue."),
    ("CMP-02", "C-110", "Relief-valve pop test within interval", "OISD-STD-106",
     "OK", "Relief valve tested within statutory interval."),
    ("CMP-03", "P-204A", "Post-maintenance verification recorded on closeout", "Internal QMS / SOP-17",
     "GAP", "WO-141 closed without a recorded post-repair vibration reading."),
    ("CMP-04", "TK-501", "Gas-free certificate before internal entry", "Factories Act 1948 (confined space)",
     "OK", "Gas-free certificate on file for last entry."),
    ("CMP-05", "V-301", "SOP review currency (<= 24 months)", "Internal QMS",
     "OK", "SOP-22 reviewed 2025-03-01, within currency."),
]

# asset -> list of (timestamp, metric, value, unit)  -> written as CSV sensor snapshots
SENSOR_LOGS = {
    "P-204A": ("vibration_de_mm_s", [3.1, 3.4, 3.9, 4.6, 5.3, 6.2], "mm/s"),
    "HX-102": ("outlet_temp_degC", [78, 80, 83, 85, 86, 87], "degC"),
    "C-110": ("interstage_temp_degC", [128, 132, 138, 145, 150, 141], "degC"),
    "V-301": ("shell_pressure_barg", [8.1, 8.0, 8.2, 8.1, 8.0, 8.1], "barg"),
    "TK-501": ("level_pct", [62, 68, 74, 81, 79, 70], "%"),
}
