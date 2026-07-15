"use client"

import { FormEvent, useState } from "react"
import { AlertTriangleIcon, SearchCheckIcon, WrenchIcon } from "lucide-react"

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
import { generateRca } from "@/lib/api/client"
import type { RcaReport } from "@/lib/api/types"
import { percent } from "@/lib/format"

export function RcaWorkbench() {
  const [assetTag, setAssetTag] = useState("P-204A")
  const [issue, setIssue] = useState("Repeated seal leakage and abnormal vibration")
  const [report, setReport] = useState<RcaReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setReport(await generateRca(assetTag.trim().toUpperCase(), issue.trim()))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The RCA report could not be generated.")
    } finally {
      setBusy(false)
    }
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
                  <InputGroupInput id="rca-asset" value={assetTag} onChange={(event) => setAssetTag(event.target.value.toUpperCase())} />
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="rca-issue">Observed issue</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea id="rca-issue" value={issue} onChange={(event) => setIssue(event.target.value)} />
                </InputGroup>
                <FieldDescription>Use symptoms and recurrence, not a presumed cause.</FieldDescription>
              </Field>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={!assetTag.trim() || !issue.trim() || busy}>
                {busy ? <Spinner data-icon="inline-start" /> : <SearchCheckIcon data-icon="inline-start" />}
                {busy ? "Investigating" : "Generate RCA"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {report ? (
        <div className="flex flex-col gap-4">
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
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Alert>
              <AlertTriangleIcon />
              <AlertTitle>Missing checks</AlertTitle>
              <AlertDescription>
                <ul className="flex list-disc flex-col gap-1 pl-4">
                  {report.missing_checks.map((check) => <li key={check}>{check}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
            <Alert>
              <WrenchIcon />
              <AlertTitle>Recommended actions</AlertTitle>
              <AlertDescription>
                <ol className="flex list-decimal flex-col gap-1 pl-4">
                  {report.recommended_actions.map((action) => <li key={action}>{action}</li>)}
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      ) : (
        <Card className="min-h-[30rem] items-center justify-center">
          <CardContent className="text-center">
            <SearchCheckIcon className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 font-medium">No RCA generated yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Run the prepared P-204A investigation to retrieve likely causes and evidence.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
