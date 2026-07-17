import type { EvaluationMetrics, EvaluationRun } from "@/lib/api/types"

export const evaluationMetricKeys = [
  "asset_tag_precision",
  "asset_tag_recall",
  "retrieval_hit_rate_top5",
  "citation_correctness",
  "compliance_gap_accuracy",
  "ragas_faithfulness",
  "ragas_answer_relevancy",
  "ragas_context_precision",
  "ragas_context_recall",
  "avg_response_time_sec",
  "manual_baseline_sec",
] as const satisfies readonly (keyof EvaluationMetrics)[]

export type DisplayEvaluationRun = Omit<EvaluationRun, "metrics"> & {
  metrics?: EvaluationMetrics
}

export function hasCompleteEvaluationMetrics(
  metrics?: Partial<EvaluationMetrics>
): metrics is EvaluationMetrics {
  return Boolean(metrics) && evaluationMetricKeys.every(
    (key) => typeof metrics?.[key] === "number"
  )
}

export function normalizeEvaluationRun(run: EvaluationRun): DisplayEvaluationRun {
  return {
    ...run,
    metrics:
      run.status === "completed" && hasCompleteEvaluationMetrics(run.metrics)
        ? run.metrics
        : undefined,
  }
}
