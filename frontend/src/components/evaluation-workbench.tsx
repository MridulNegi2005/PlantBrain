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
import type { EvaluationCase, EvaluationMetrics, LatestEvaluationRun } from "@/lib/api/types"
import { normalizeEvaluationRun, type DisplayEvaluationRun } from "@/lib/evaluation-run"
import { percent, titleCase } from "@/lib/format"

const metricDefinitions: Array<{ key: keyof EvaluationMetrics; label: string }> = [
  { key: "asset_tag_precision", label: "Right equipment tagged" },
  { key: "asset_tag_recall", label: "No equipment missed" },
  { key: "retrieval_hit_rate_top5", label: "Found the right document" },
  { key: "citation_correctness", label: "Cited the correct source" },
  { key: "compliance_gap_accuracy", label: "Compliance gaps spotted correctly" },
  { key: "ragas_faithfulness", label: "Answers stay true to the source" },
  { key: "ragas_answer_relevancy", label: "Answers stay on topic" },
  { key: "ragas_context_precision", label: "Uses the right evidence" },
  { key: "ragas_context_recall", label: "Finds all the evidence" },
]

const EVALUATION_POLL_ATTEMPTS = 30
const EVALUATION_POLL_INTERVAL_MS = 1000

function hydrateLatestRun(latest?: LatestEvaluationRun): DisplayEvaluationRun | null {
  if (!latest?.id) return null
  return normalizeEvaluationRun({
    id: latest.id,
    status: latest.status,
    completed_at: latest.completed_at,
    metrics: latest.metrics,
    error: latest.error,
  })
}

export function EvaluationWorkbench({
  cases,
  total,
  initialRun,
}: {
  cases: EvaluationCase[]
  total: number
  initialRun?: LatestEvaluationRun
}) {
  const [run, setRun] = useState<DisplayEvaluationRun | null>(() => hydrateLatestRun(initialRun))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function refreshRun(runId: string) {
    const current = normalizeEvaluationRun(await getEvaluationRun(runId))
    setRun(current)
    if (current.status === "failed") {
      throw new Error(current.error || `Evaluation run ${current.id} failed.`)
    }
    return current
  }

  async function runEvaluation() {
    setBusy(true)
    setError(null)
    setNotice(null)
    setRun(null)
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
          "This is taking longer than usual. The test is still running — use Check latest results to see the scores when it's done."
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
        setNotice("The test is still running. The latest status is shown below.")
      } else if (!current.metrics) {
        setNotice("The test finished but didn't return any scores.")
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The evaluation status could not be refreshed.")
    } finally {
      setBusy(false)
    }
  }

  const needsRefresh = Boolean(run && (!run.metrics || run.status !== "completed"))
  const statusTitle = !run
    ? "No test run yet"
    : run.status === "completed" && !run.metrics
      ? "Finished, but no scores came back"
      : run.status === "failed"
        ? "The test failed"
        : `Test ${run.status}`
  const statusDescription = !run
    ? "Run the test to see how accurately PlantBrain finds documents, cites sources, and spots compliance gaps."
    : run.status === "completed" && !run.metrics
      ? "The test finished but didn't return any scores."
      : run.status === "failed"
        ? run.error || "The test stopped before any scores were produced."
        : busy
          ? "Running the test — scores will appear here as soon as it finishes."
          : "This test isn't refreshing on its own. Use Check latest results when you're ready."

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Run the accuracy test</CardTitle>
          <CardDescription>{total} test questions with known correct answers.</CardDescription>
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
                {busy ? "Testing…" : "Run the test"}
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
              <AlertTitle>Couldn't run the test</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {notice ? (
            <Alert className="mt-4">
              <AlertTitle>Status saved</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {run?.metrics ? (
        <>
          <section className="grid gap-px border border-border bg-border md:grid-cols-2 xl:grid-cols-3" aria-label="Evaluation metrics">
            {metricDefinitions.map((definition) => {
              const value = run.metrics?.[definition.key]
              if (typeof value !== "number") return null
              return (
                <div key={definition.key} className="bg-card p-4">
                  <div>
                    <p className="technical-label">Score</p>
                    <h3 className="mt-1 text-sm font-semibold">{definition.label}</h3>
                  </div>
                  <div className="mt-6">
                    <Progress value={value * 100}>
                      <ProgressLabel>Score</ProgressLabel>
                      <ProgressValue>{() => percent(value)}</ProgressValue>
                    </Progress>
                  </div>
                </div>
              )
            })}
          </section>

          <section className="grid gap-px border border-border bg-border md:grid-cols-3">
            <div className="bg-card p-5">
              <div className="flex items-center justify-between"><p className="technical-label">PlantBrain answers in</p><TimerIcon className="size-4 text-primary" /></div>
              <p className="mt-5 font-mono text-4xl tracking-[-0.07em]">{run.metrics.avg_response_time_sec}s</p>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center justify-between"><p className="technical-label">Doing it by hand</p><GaugeIcon className="size-4 text-muted-foreground" /></div>
              <p className="mt-5 font-mono text-4xl tracking-[-0.07em]">{Math.round(run.metrics.manual_baseline_sec / 60)}m</p>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center justify-between"><p className="technical-label">Test status</p><ActivityIcon className="size-4 text-primary" /></div>
              <p className="mt-5 font-mono text-2xl text-primary">{run.status.toUpperCase()}</p>
            </div>
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
          <CardTitle>The test questions</CardTitle>
          <CardDescription>Fixed questions with known answers — the scores above come straight from the system, nothing is made up here.</CardDescription>
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
