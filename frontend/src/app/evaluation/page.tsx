import { DataUnavailable } from "@/components/data-unavailable"
import { EvaluationWorkbench } from "@/components/evaluation-workbench"
import { PageHeader } from "@/components/page-header"
import { getEvaluationCases, getLatestEvaluationRun } from "@/lib/api/client"

export const metadata = { title: "Accuracy" }

export default async function EvaluationPage() {
  const [casesResult, latestResult] = await Promise.allSettled([
    getEvaluationCases(),
    getLatestEvaluationRun(),
  ])
  const result = casesResult.status === "fulfilled" ? casesResult.value : null
  const latest = latestResult.status === "fulfilled" ? latestResult.value : undefined

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Accuracy"
        title="How accurate is PlantBrain?"
        description="We test PlantBrain against a set of questions with known correct answers, then measure how often it finds the right documents, cites them correctly, and how fast it responds."
        status="MEASURED RESULTS ONLY"
      />
      {!result ? <DataUnavailable label="Evaluation cases" /> : null}
      {result ? <EvaluationWorkbench cases={result.items} total={result.total} initialRun={latest} /> : null}
    </div>
  )
}
