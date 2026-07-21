"use client"

import { FormEvent, useReducer, useState } from "react"
import { CircleHelpIcon, ClipboardCheckIcon, FileWarningIcon, ShieldCheckIcon } from "lucide-react"

import { CitationList } from "@/components/citation-list"
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge } from "@/components/status-badge"
import { checkCompliance } from "@/lib/api/client"
import type { ComplianceReport } from "@/lib/api/types"
import { titleCase } from "@/lib/format"
import { idleRequestState, requestStateReducer } from "@/lib/request-state"

export function ComplianceWorkbench() {
  const [assetTag, setAssetTag] = useState("V-301")
  const [request, dispatch] = useReducer(
    requestStateReducer<ComplianceReport>,
    idleRequestState<ComplianceReport>()
  )
  const report = request.data
  const busy = request.status === "loading"

  async function run(event: FormEvent) {
    event.preventDefault()
    dispatch({ type: "start" })
    try {
      dispatch({
        type: "succeed",
        data: await checkCompliance(assetTag.trim().toUpperCase()),
      })
    } catch (caught) {
      dispatch({
        type: "fail",
        error:
          caught instanceof Error
            ? caught.message
            : "The compliance check could not be completed.",
      })
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Check compliance</CardTitle>
          <CardDescription>Pick a piece of equipment to check its required paperwork.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="compliance-asset">Equipment tag</FieldLabel>
                <InputGroup>
                  <InputGroupAddon><ClipboardCheckIcon /></InputGroupAddon>
                  <InputGroupInput id="compliance-asset" value={assetTag} maxLength={64} onChange={(event) => setAssetTag(event.target.value.toUpperCase())} />
                </InputGroup>
                <FieldDescription>Try V-301 — it's missing a certificate on purpose.</FieldDescription>
              </Field>
              {request.error ? <p className="text-sm text-destructive">{request.error}</p> : null}
              <Button type="submit" disabled={!assetTag.trim() || busy}>
                {busy ? <Spinner data-icon="inline-start" /> : <ClipboardCheckIcon data-icon="inline-start" />}
                {busy ? "Checking" : "Check compliance"}
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
              <CardTitle>{report.requirement ?? "Couldn't identify the requirement"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <StatusBadge status={report.status} />
              <Badge variant={report.risk_level === "high" ? "destructive" : "outline"}>{report.risk_level} risk</Badge>
            </CardContent>
          </Card>

          {report.status === "gap" ? (
            <Alert variant="destructive">
              <FileWarningIcon />
              <AlertTitle>Required paperwork is missing</AlertTitle>
              <AlertDescription>{report.missing_evidence ?? "The specific missing item wasn't identified."}</AlertDescription>
            </Alert>
          ) : report.status === "ok" || report.status === "pass" ? (
            <Alert>
              <ShieldCheckIcon />
              <AlertTitle>All required paperwork is on file</AlertTitle>
              <AlertDescription>This requirement is fully backed by documents on record.</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>Couldn't reach a clear result</AlertTitle>
              <AlertDescription>
                PlantBrain couldn't clearly confirm or flag this. Review the documents before acting.
              </AlertDescription>
            </Alert>
          )}

          {report.note ? (
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>{report.note}</AlertDescription>
            </Alert>
          ) : null}

          {report.reason ? (
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>Why it's unclear</AlertTitle>
              <AlertDescription>{titleCase(report.reason)}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Documents on file</CardTitle>
              <CardDescription>The records PlantBrain found for this requirement.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {report.evidence_found.map((evidence) => <Badge key={evidence} variant="outline">{evidence}</Badge>)}
              {!report.evidence_found.length ? <p className="text-sm text-muted-foreground">No matching documents were found.</p> : null}
            </CardContent>
            {report.citations ? (
              <CardContent className="border-t border-border pt-4">
                <CitationList citations={report.citations} />
              </CardContent>
            ) : null}
          </Card>
        </div>
      ) : (
        <Card className="min-h-[28rem] items-center justify-center">
          <CardContent className="text-center">
            {busy ? <Spinner className="mx-auto size-8" /> : <ClipboardCheckIcon className="mx-auto size-8 text-muted-foreground" />}
            <p className="mt-4 font-medium">{busy ? "Checking the records…" : "No check run yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {busy
                ? "Clearing the previous result…"
                : "Try V-301 to see a missing pressure-test certificate flagged."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
