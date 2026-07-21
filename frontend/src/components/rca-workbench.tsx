"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
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
import { findSimilarLessons, generateRca, getAssets } from "@/lib/api/client"
import type { AssetSummary, RcaReport, SimilarIncident } from "@/lib/api/types"
import { percent } from "@/lib/format"

function withheldReason(reason?: string | null) {
  switch (reason) {
    case "unsafe_evidence":
      return "PlantBrain blocked a suspicious document and won't guess without safe sources."
    case "no_supporting_evidence":
      return "PlantBrain couldn't find documents to back up a diagnosis, so it won't guess."
    default:
      return reason ?? "No diagnosis could be produced."
  }
}

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
  const [assets, setAssets] = useState<AssetSummary[]>([])
  const [assetMenuOpen, setAssetMenuOpen] = useState(false)
  const assetFieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAssets()
      .then((result) => setAssets(result.items))
      .catch(() => setAssets([]))
  }, [])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (assetFieldRef.current && !assetFieldRef.current.contains(event.target as Node)) {
        setAssetMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const matchingAssets = useMemo(() => {
    const query = assetTag.trim().toLowerCase()
    const pool = query
      ? assets.filter(
          (asset) =>
            asset.asset_tag.toLowerCase().includes(query) ||
            asset.asset_type.toLowerCase().includes(query)
        )
      : assets
    return pool.slice(0, 8)
  }, [assets, assetTag])

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
          <CardTitle>What happened?</CardTitle>
          <CardDescription>Describe the problem you're seeing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="rca-asset">Equipment tag</FieldLabel>
                <div ref={assetFieldRef} className="relative">
                  <InputGroup>
                    <InputGroupAddon><SearchCheckIcon /></InputGroupAddon>
                    <InputGroupInput
                      id="rca-asset"
                      value={assetTag}
                      maxLength={64}
                      autoComplete="off"
                      onFocus={() => setAssetMenuOpen(true)}
                      onChange={(event) => {
                        setAssetTag(event.target.value.toUpperCase())
                        setAssetMenuOpen(true)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setAssetMenuOpen(false)
                      }}
                    />
                  </InputGroup>
                  {assetMenuOpen && matchingAssets.length ? (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto border border-border bg-card shadow-lg">
                      {matchingAssets.map((asset) => (
                        <button
                          key={asset.asset_tag}
                          type="button"
                          onClick={() => {
                            setAssetTag(asset.asset_tag)
                            setAssetMenuOpen(false)
                          }}
                          className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
                        >
                          <span className="font-mono text-sm font-semibold text-primary">{asset.asset_tag}</span>
                          <span className="text-xs text-muted-foreground">{asset.asset_type}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <FieldDescription>Start typing to pick from your plant's equipment.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="rca-issue">What's going wrong</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea id="rca-issue" value={issue} maxLength={2_000} onChange={(event) => setIssue(event.target.value)} />
                </InputGroup>
                <FieldDescription>Describe the symptoms — no need to guess the cause.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="rca-failure-mode">Type of failure to compare</FieldLabel>
                <InputGroup>
                  <InputGroupAddon><SearchCheckIcon /></InputGroupAddon>
                  <InputGroupInput
                    id="rca-failure-mode"
                    value={failureMode}
                    maxLength={500}
                    onChange={(event) => setFailureMode(event.target.value)}
                  />
                </InputGroup>
                <FieldDescription>Used to find similar past failures on record.</FieldDescription>
              </Field>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={!assetTag.trim() || !issue.trim() || !failureMode.trim() || busy}>
                {busy ? <Spinner data-icon="inline-start" /> : <SearchCheckIcon data-icon="inline-start" />}
                {busy ? "Working…" : "Find likely causes"}
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
                  <AlertTitle>No diagnosis available</AlertTitle>
                  <AlertDescription>{withheldReason(report.reason)}</AlertDescription>
                </Alert>
              ) : null}
              {report.note ? (
                <Alert>
                  <SearchCheckIcon />
                  <AlertTitle>Note</AlertTitle>
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
                      <CardDescription>Likely cause, backed by documents</CardDescription>
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
                    <CardTitle>Sources</CardTitle>
                    <CardDescription>The documents this diagnosis is based on.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CitationList citations={report.citations} />
                  </CardContent>
                </Card>
              ) : null}
              <div className="grid gap-4 lg:grid-cols-2">
                <Alert>
                  <AlertTriangleIcon />
                  <AlertTitle>Still worth checking</AlertTitle>
                  <AlertDescription>
                    {report.missing_checks.length ? (
                      <ul className="flex list-disc flex-col gap-1 pl-4">
                        {report.missing_checks.map((check) => <li key={check}>{check}</li>)}
                      </ul>
                    ) : <p>Nothing outstanding.</p>}
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
                    ) : <p>No actions suggested.</p>}
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
            <p className="mt-4 font-medium">{busy ? "Looking through the records…" : "No diagnosis yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Try the example: describe the issue with pump P-204A to see likely causes, sources, and similar past failures.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
