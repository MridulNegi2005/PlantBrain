import { DataUnavailable } from "@/components/data-unavailable"
import { EvaluationWorkbench } from "@/components/evaluation-workbench"
import { PageHeader } from "@/components/page-header"
import { getEvaluationCases } from "@/lib/api/client"

export const metadata = { title: "Evaluation" }

export default async function EvaluationPage() {
  const result = await getEvaluationCases().catch(() => null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="System evaluation"
        title="Show what the AI gets right—and where it does not."
        description="Run the labeled benchmark and inspect retrieval, citation, compliance, RAGAS, and response-time metrics returned by the evaluation service."
        status="MEASURED RESULTS ONLY"
      />
      {!result ? <DataUnavailable label="Evaluation cases" /> : null}
      {result ? <EvaluationWorkbench cases={result.items} total={result.total} /> : null}
    </div>
  )
}
