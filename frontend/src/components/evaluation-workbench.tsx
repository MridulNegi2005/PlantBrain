"use client"

import { useState } from "react"
import { ActivityIcon, GaugeIcon, PlayIcon, TimerIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { getEvaluationRun, startEvaluation } from "@/lib/api/client"
import type { EvaluationCase, EvaluationMetrics, EvaluationRun } from "@/lib/api/types"
import { percent, titleCase } from "@/lib/format"

const metricDefinitions: Array<{ key: keyof EvaluationMetrics; label: string }> = [
  { key: "asset_tag_precision", label: "Asset-tag precision" },
  { key: "asset_tag_recall", label: "Asset-tag recall" },
  { key: "retrieval_hit_rate_top5", label: "Top-5 retrieval hit rate" },
  { key: "citation_correctness", label: "Citation correctness" },
  { key: "compliance_gap_accuracy", label: "Compliance gap accuracy" },
  { key: "ragas_faithfulness", label: "RAGAS faithfulness" },
  { key: "ragas_answer_relevancy", label: "RAGAS answer relevancy" },
  { key: "ragas_context_precision", label: "RAGAS context precision" },
  { key: "ragas_context_recall", label: "RAGAS context recall" },
]

export function EvaluationWorkbench({ cases, total }: { cases: EvaluationCase[]; total: number }) {
  const [run, setRun] = useState<EvaluationRun | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runEvaluation() {
    setBusy(true)
    setError(null)
    try {
      const started = await startEvaluation()
      setRun({ id: started.run_id, status: started.status })
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const current = await getEvaluationRun(started.run_id)
        setRun(current)
        if (current.status === "completed" || current.status === "failed") break
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The evaluation run failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Benchmark control</CardTitle>
          <CardDescription>{total} labeled cases available from the evaluation service.</CardDescription>
          <CardAction>
            <Button onClick={runEvaluation} disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
              {busy ? "Running benchmark" : "Run evaluation"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {cases.slice(0, 8).map((item) => <Badge key={item.id} variant="outline">{item.id} · {titleCase(item.category)}</Badge>)}
          </div>
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {run?.metrics ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Evaluation metrics">
            {metricDefinitions.map((definition) => {
              const value = run.metrics?.[definition.key]
              if (typeof value !== "number") return null
              return (
                <Card key={definition.key} size="sm">
                  <CardHeader>
                    <CardTitle>{definition.label}</CardTitle>
                    <CardDescription>Measured from the completed benchmark run.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={value * 100}>
                      <ProgressLabel>Score</ProgressLabel>
                      <ProgressValue>{() => percent(value)}</ProgressValue>
                    </Progress>
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card size="sm">
              <CardHeader><CardDescription>PlantBrain response</CardDescription><CardTitle className="font-mono text-3xl">{run.metrics.avg_response_time_sec}s</CardTitle><CardAction><TimerIcon className="size-4 text-primary" /></CardAction></CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader><CardDescription>Manual baseline</CardDescription><CardTitle className="font-mono text-3xl">{Math.round(run.metrics.manual_baseline_sec / 60)}m</CardTitle><CardAction><GaugeIcon className="size-4 text-muted-foreground" /></CardAction></CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader><CardDescription>Run status</CardDescription><CardTitle className="font-mono text-2xl">{run.status.toUpperCase()}</CardTitle><CardAction><ActivityIcon className="size-4 text-primary" /></CardAction></CardHeader>
            </Card>
          </section>
        </>
      ) : (
        <Alert>
          {busy ? <Spinner /> : <ActivityIcon />}
          <AlertTitle>{run ? `Evaluation ${run.status}` : "No completed run loaded"}</AlertTitle>
          <AlertDescription>
            {run ? `Run ${run.id} is being monitored. Metrics appear only when the backend marks it completed.` : "Start the benchmark to retrieve measured extraction, retrieval, citation, compliance, and RAGAS metrics."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Benchmark cases</CardTitle>
          <CardDescription>Questions are backend-owned; this interface does not invent scores or labels.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {cases.map((item, index) => (
            <div key={item.id}>
              <div className="grid gap-2 py-2 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                <span className="font-mono text-xs text-primary">{item.id}</span>
                <span className="text-sm">{item.question}</span>
                <Badge variant="outline">{titleCase(item.category)}</Badge>
              </div>
              {index < cases.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
