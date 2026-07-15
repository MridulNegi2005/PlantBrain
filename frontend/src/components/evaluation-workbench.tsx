"use client"

import { useState } from "react"
import { ActivityIcon, GaugeIcon, PlayIcon, RefreshCwIcon, TimerIcon } from "lucide-react"

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

const EVALUATION_POLL_ATTEMPTS = 30
const EVALUATION_POLL_INTERVAL_MS = 1000

export function EvaluationWorkbench({ cases, total }: { cases: EvaluationCase[]; total: number }) {
  const [run, setRun] = useState<EvaluationRun | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function refreshRun(runId: string) {
    const current = await getEvaluationRun(runId)
    setRun(current)
    if (current.status === "failed") {
      throw new Error(`Evaluation run ${current.id} failed.`)
    }
    return current
  }

  async function runEvaluation() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const started = await startEvaluation()
      setRun({ id: started.run_id, status: started.status })
      let completed = false

      for (let attempt = 0; attempt < EVALUATION_POLL_ATTEMPTS; attempt += 1) {
        const current = await refreshRun(started.run_id)
        if (current.status === "completed") {
          completed = true
          break
        }
        await new Promise((resolve) =>
          window.setTimeout(resolve, EVALUATION_POLL_INTERVAL_MS)
        )
      }

      if (!completed) {
        setNotice(
          "The run is still active. Automatic polling paused to avoid an endless request loop; use Check latest results to refresh this run."
        )
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The evaluation run failed.")
    } finally {
      setBusy(false)
    }
  }

  async function checkLatestResults() {
    if (!run) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const current = await refreshRun(run.id)
      if (current.status !== "completed") {
        setNotice("The run is still active. Its latest backend state is shown below.")
      } else if (!current.metrics) {
        setNotice("The backend marked this run completed but did not return metrics.")
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The evaluation status could not be refreshed.")
    } finally {
      setBusy(false)
    }
  }

  const needsRefresh = Boolean(run && (!run.metrics || run.status !== "completed"))
  const statusTitle = !run
    ? "No completed run loaded"
    : run.status === "completed" && !run.metrics
      ? "Completed without metrics"
      : `Evaluation ${run.status}`
  const statusDescription = !run
    ? "Start the benchmark to retrieve measured extraction, retrieval, citation, compliance, and RAGAS metrics."
    : run.status === "completed" && !run.metrics
      ? `Run ${run.id} completed, but the response did not include a metrics payload.`
      : busy
        ? `Run ${run.id} is being monitored. Metrics appear when the backend marks it completed.`
        : `Run ${run.id} is not being polled automatically. Check its latest backend state when ready.`

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Benchmark control</CardTitle>
          <CardDescription>{total} labeled cases available from the evaluation service.</CardDescription>
          <CardAction>
            <div className="flex flex-wrap justify-end gap-2">
              {needsRefresh ? (
                <Button variant="outline" onClick={checkLatestResults} disabled={busy}>
                  {busy ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
                  Check latest results
                </Button>
              ) : null}
              <Button onClick={runEvaluation} disabled={busy}>
                {busy ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
                {busy ? "Running benchmark" : "Run evaluation"}
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {cases.slice(0, 8).map((item) => <Badge key={item.id} variant="outline">{item.id} · {titleCase(item.category)}</Badge>)}
          </div>
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Evaluation unavailable</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {notice ? (
            <Alert className="mt-4">
              <AlertTitle>Run status saved</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
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
          <AlertTitle>{statusTitle}</AlertTitle>
          <AlertDescription>{statusDescription}</AlertDescription>
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
