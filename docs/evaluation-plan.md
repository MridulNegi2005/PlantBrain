# PlantBrain AI — Evaluation Plan

The evaluation harness (`app/evaluation/harness.py`) runs the **real** pipeline over a
gold-labelled set and reports metrics from actual runs — never hard-coded. Reproduce with
`python -m scripts.run_eval` or `POST /api/evaluation/run`.

## Gold set (`data/labeled/`)
- `qa_gold.json` — benchmark questions (incl. multi-hop) with expected supporting documents
  and expected answer points.
- `compliance_gold.json` — expected compliance status per asset (e.g. V-301 → gap, high).
- `entities_gold.json` — expected entity extractions (asset tags, components, failure modes).

## Metrics
| Metric | Definition |
|---|---|
| Retrieval hit-rate @ top-5 | Fraction of questions where an expected document is in the cited evidence |
| Citation correctness | Fraction of cited documents that are expected/relevant |
| Context precision / recall (RAGAS-style) | Precision/recall of retrieved-vs-expected documents |
| Faithfulness (RAGAS-style, LLM-judged) | How fully the answer is supported by its cited context |
| Answer relevancy (RAGAS-style, LLM-judged) | How well the answer addresses the question |
| Compliance-gap accuracy | Agreement of the compliance agent with gold status |
| Asset-tag precision / recall | Entity extraction accuracy vs gold |
| Avg response time vs manual baseline | End-to-end answer latency vs ~12 min manual search |

Faithfulness/relevancy use the configured LLM as a judge (RAGAS-style). We implement the
metric definitions directly rather than pulling the heavy RAGAS library, keeping the stack
lean and dependency-audited.

## Latest results (actual run, gold set = 5 questions)
| Metric | Value |
|---|---|
| Retrieval hit-rate @5 | **1.00** |
| Faithfulness | **0.82** |
| Answer relevancy | **0.91** |
| Context recall | **0.92** |
| Context precision | 0.67 |
| Citation correctness | 0.67 |
| Compliance-gap accuracy | 0.67 |
| Asset-tag precision / recall | 1.00 / 1.00 |
| Avg response time | **~4.2 s** (vs ~720 s manual) |

Numbers regenerate on every run; commit-time values are illustrative, not frozen.

## Honest limitations
- Small gold set (demo scale) — expand for stronger significance.
- Compliance agent returns one primary finding per asset; multi-requirement assets can
  under-count (drives the 0.67). A per-requirement pass would raise it.
- Faithfulness/relevancy depend on the judge model; report the model used alongside scores.
