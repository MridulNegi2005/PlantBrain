import { describe, expect, it } from "vitest"

import type { EvaluationMetrics } from "@/lib/api/types"
import { normalizeEvaluationRun } from "@/lib/evaluation-run"

const completeMetrics: EvaluationMetrics = {
  asset_tag_precision: 1,
  asset_tag_recall: 1,
  retrieval_hit_rate_top5: 1,
  citation_correctness: 0.4,
  compliance_gap_accuracy: 0,
  ragas_faithfulness: 0,
  ragas_answer_relevancy: 0,
  ragas_context_precision: 0.4,
  ragas_context_recall: 1,
  avg_response_time_sec: 0.2,
  manual_baseline_sec: 720,
}

describe("normalizeEvaluationRun", () => {
  it("keeps complete numeric metrics for a completed run", () => {
    expect(normalizeEvaluationRun({ id: "eval_1", status: "completed", metrics: completeMetrics }).metrics)
      .toEqual(completeMetrics)
  })

  it("drops partial metrics so failed runs cannot render undefined or NaN values", () => {
    const run = normalizeEvaluationRun({
      id: "eval_2",
      status: "failed",
      metrics: { retrieval_hit_rate_top5: 1 },
      error: "Evaluation failed.",
    })

    expect(run.metrics).toBeUndefined()
    expect(run.error).toBe("Evaluation failed.")
  })

  it("does not display metrics before the backend marks a run completed", () => {
    expect(normalizeEvaluationRun({ id: "eval_3", status: "running", metrics: completeMetrics }).metrics)
      .toBeUndefined()
  })
})
