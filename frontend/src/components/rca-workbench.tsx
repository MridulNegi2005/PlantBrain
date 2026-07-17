"use client"

import { FormEvent, useState } from "react"
import { AlertTriangleIcon, SearchCheckIcon, WrenchIcon } from "lucide-react"

import { CitationList } from "@/components/citation-list"
import { SimilarLessonsPanel } from "@/components/similar-lessons-panel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { findSimilarLessons, generateRca } from "@/lib/api/client"
import type { RcaReport, SimilarIncident } from "@/lib/api/types"
import { percent } from "@/lib/format"

export function RcaWorkbench() {
  const [assetTag, setAssetTag] = useState("P-204A")
  const [issue, setIssue] = useState("Repeated seal leakage and abnormal vibration")
  const [failureMode, setFailureMode] = useState("seal leakage")
  const [searchedFailureMode, setSearchedFailureMode] = useState("seal leakage")
  const [report, setReport] = useState<RcaReport | null>(null)
  const [incidents, setIncidents] = useState<SimilarIncident[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonsError, setLessonsError] = useState<string | null>(null)

  async function run(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setLessonsError(null)
    setReport(null)
    setIncidents(null)
    setSearchedFailureMode(failureMode.trim())

    const [rcaResult, lessonsResult] = await Promise.allSettled([
      generateRca(assetTag.trim().toUpperCase(), issue.trim()),
      findSimilarLessons(failureMode.trim()),
    ])

    if (rcaResult.status === "fulfilled") {
      setReport(rcaResult.value)
    } else {
      setError(
        rcaResult.reason instanceof Error
          ? rcaResult.reason.message
          : "The RCA report could not be generated."
      )
    }

    if (lessonsResult.status === "fulfilled") {
      setIncidents(lessonsResult.value.items)
    } else {
      setLessonsError(
        lessonsResult.reason instanceof Error
          ? lessonsResult.reason.message
          : "Historical lessons could not be retrieved."
      )
    }

    setBusy(false)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Investigation scope</CardTitle>
          <CardDescription>Describe the observed asset issue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="rca-asset">Asset tag</FieldLabel>
                <InputGroup>
                  <InputGroupAddon><SearchCheckIcon /></InputGroupAddon>
                  <InputGroupInput id="rca-asset" value={assetTag} maxLength={64} onChange={(event) => setAssetTag(event.target.value.toUpperCase())} />
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="rca-issue">Observed issue</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea id="rca-issue" value={issue} maxLength={2_000} onChange={(event) => setIssue(event.target.value)} />
                </InputGroup>
                <FieldDescription>Use symptoms and recurrence, not a presumed cause.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="rca-failure-mode">Failure mode to compare</FieldLabel>
                <InputGroup>
                  <InputGroupAddon><SearchCheckIcon /></InputGroupAddon>
                  <InputGroupInput
                    id="rca-failure-mode"
                    value={failureMode}
                    maxLength={500}
                    onChange={(event) => setFailureMode(event.target.value)}
                  />
                </InputGroup>
                <FieldDescription>Used to retrieve similar historical incidents independently of the RCA.</FieldDescription>
              </Field>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={!assetTag.trim() || !issue.trim() || !failureMode.trim() || busy}>
                {busy ? <Spinner data-icon="inline-start" /> : <SearchCheckIcon data-icon="inline-start" />}
                {busy ? "Investigating" : "Run investigation"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {report || incidents !== null || lessonsError ? (
        <div className="flex flex-col gap-4">
          {report ? (
            <>
              {report.reason ? (
                <Alert variant="destructive">
                  <AlertTriangleIcon />
                  <AlertTitle>RCA withheld</AlertTitle>
                  <AlertDescription>{report.reason}</AlertDescription>
                </Alert>
              ) : null}
              {report.note ? (
                <Alert>
                  <SearchCheckIcon />
                  <AlertTitle>Backend note</AlertTitle>
                  <AlertDescription>{report.note}</AlertDescription>
                </Alert>
              ) : null}
              <Card>
                <CardHeader>
                  <CardDescription>{report.asset}</CardDescription>
                  <CardTitle>{report.issue}</CardTitle>
                </CardHeader>
              </Card>
              <div className="grid gap-4 lg:grid-cols-2">
                {report.likely_causes.map((cause) => (
                  <Card key={cause.cause}>
                    <CardHeader>
                      <CardTitle>{cause.cause}</CardTitle>
                      <CardDescription>Evidence-backed likely cause</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <Progress value={cause.confidence * 100}>
                        <ProgressLabel>Confidence</ProgressLabel>
                        <ProgressValue>{() => percent(cause.confidence)}</ProgressValue>
                      </Progress>
                      <div className="flex flex-wrap gap-2">
                        {cause.evidence.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
                      </div>
                      {cause.citations ? <CitationList citations={cause.citations} /> : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {report.citations?.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Investigation evidence</CardTitle>
                    <CardDescription>Report-level citations returned by the RCA agent.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CitationList citations={report.citations} />
                  </CardContent>
                </Card>
              ) : null}
              <div className="grid gap-4 lg:grid-cols-2">
                <Alert>
                  <AlertTriangleIcon />
                  <AlertTitle>Missing checks</AlertTitle>
                  <AlertDescription>
                    {report.missing_checks.length ? (
                      <ul className="flex list-disc flex-col gap-1 pl-4">
                        {report.missing_checks.map((check) => <li key={check}>{check}</li>)}
                      </ul>
                    ) : <p>No missing checks were returned.</p>}
                  </AlertDescription>
                </Alert>
                <Alert>
                  <WrenchIcon />
                  <AlertTitle>Recommended actions</AlertTitle>
                  <AlertDescription>
                    {report.recommended_actions.length ? (
                      <ol className="flex list-decimal flex-col gap-1 pl-4">
                        {report.recommended_actions.map((action) => <li key={action}>{action}</li>)}
                      </ol>
                    ) : <p>No recommended actions were returned.</p>}
                  </AlertDescription>
                </Alert>
              </div>
            </>
          ) : null}

          <SimilarLessonsPanel
            failureMode={searchedFailureMode}
            incidents={incidents}
            error={lessonsError}
          />
        </div>
      ) : (
        <Card className="min-h-[30rem] items-center justify-center">
          <CardContent className="text-center">
            {busy ? <Spinner className="mx-auto size-8" /> : <SearchCheckIcon className="mx-auto size-8 text-muted-foreground" />}
            <p className="mt-4 font-medium">{busy ? "Investigating plant memory" : "No investigation generated yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Run the prepared P-204A investigation to retrieve likely causes, evidence, and similar lessons.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
