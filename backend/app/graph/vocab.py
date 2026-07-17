"""Curated industrial vocabulary for entity extraction / graph edges.

Rule-based and deterministic — reliable for the demo. The LLM is used for answer
synthesis, not for these structural facts, so the graph never hallucinates edges.
"""

# canonical failure mode -> surface phrases to match (lowercased substring)
FAILURE_MODES = {
    "seal leakage": ["seal leak", "gland weep", "seal weep", "weepage"],
    "seal wear": ["seal wear", "seal face wear"],
    "abnormal vibration": ["abnormal vibration", "elevated vibration", "high vibration"],
    "misalignment": ["misalignment", "misalign"],
    "bearing wear": ["bearing wear"],
    "fouling": ["fouling", "scaling"],
    "overheating": ["overheating", "high inter-stage temperature", "high temperature"],
    "lubrication issue": ["low lube", "lube-oil level below", "lube oil level below"],
    "certificate lapse": ["lapsed", "overdue", "not on file", "missing latest"],
}

# canonical component -> surface phrases
COMPONENTS = {
    "mechanical seal": ["mechanical seal", "seal cartridge", "cartridge seal", "gland"],
    "bearing": ["bearing"],
    "coupling": ["coupling"],
    "tube bundle": ["tube bundle", "tube-side", "tube side"],
    "lube oil system": ["lube oil", "lube-oil", "lubrication"],
    "relief valve": ["relief valve"],
    "pressure test certificate": ["pressure test certificate", "hydrostatic test"],
}

# failure mode -> components it affects (drives FAILURE_AFFECTS_COMPONENT edges)
FAILURE_TO_COMPONENT = {
    "seal leakage": ["mechanical seal"],
    "seal wear": ["mechanical seal"],
    "abnormal vibration": ["bearing", "coupling"],
    "misalignment": ["coupling"],
    "bearing wear": ["bearing"],
    "fouling": ["tube bundle"],
    "overheating": ["lube oil system"],
    "lubrication issue": ["lube oil system"],
    "certificate lapse": ["pressure test certificate"],
}


def slug(value: str) -> str:
    return value.replace(" ", "_").replace("-", "_").lower()
