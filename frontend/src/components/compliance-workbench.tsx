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
          <CardTitle>Evidence check</CardTitle>
          <CardDescription>Compare an asset packet with its required evidence.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="compliance-asset">Asset tag</FieldLabel>
                <InputGroup>
                  <InputGroupAddon><ClipboardCheckIcon /></InputGroupAddon>
                  <InputGroupInput id="compliance-asset" value={assetTag} maxLength={64} onChange={(event) => setAssetTag(event.target.value.toUpperCase())} />
                </InputGroup>
                <FieldDescription>V-301 is prepared with an intentional certificate gap.</FieldDescription>
              </Field>
              {request.error ? <p className="text-sm text-destructive">{request.error}</p> : null}
              <Button type="submit" disabled={!assetTag.trim() || busy}>
                {busy ? <Spinner data-icon="inline-start" /> : <ClipboardCheckIcon data-icon="inline-start" />}
                {busy ? "Checking" : "Check evidence"}
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
              <CardTitle>{report.requirement ?? "Requirement not identified"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <StatusBadge status={report.status} />
              <Badge variant={report.risk_level === "high" ? "destructive" : "outline"}>{report.risk_level} risk</Badge>
            </CardContent>
          </Card>

          {report.status === "gap" ? (
            <Alert variant="destructive">
              <FileWarningIcon />
              <AlertTitle>Required evidence is missing</AlertTitle>
              <AlertDescription>{report.missing_evidence ?? "The API did not specify the missing evidence."}</AlertDescription>
            </Alert>
          ) : report.status === "ok" || report.status === "pass" ? (
            <Alert>
              <ShieldCheckIcon />
              <AlertTitle>Evidence requirement satisfied</AlertTitle>
              <AlertDescription>The returned packet supports this compliance requirement.</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>Compliance result is inconclusive</AlertTitle>
              <AlertDescription>
                The backend could not determine a pass or gap. Review the evidence packet before taking action.
              </AlertDescription>
            </Alert>
          )}

          {report.note ? (
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>Backend note</AlertTitle>
              <AlertDescription>{report.note}</AlertDescription>
            </Alert>
          ) : null}

          {report.reason ? (
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>Why the result is inconclusive</AlertTitle>
              <AlertDescription>{titleCase(report.reason)}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Evidence found</CardTitle>
              <CardDescription>Documents matched by the compliance agent.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {report.evidence_found.map((evidence) => <Badge key={evidence} variant="outline">{evidence}</Badge>)}
              {!report.evidence_found.length ? <p className="text-sm text-muted-foreground">No supporting evidence was returned.</p> : null}
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
            <p className="mt-4 font-medium">{busy ? "Checking the evidence packet" : "No evidence check run"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {busy
                ? "The previous result has been cleared while this asset is checked."
                : "Run V-301 to inspect the missing pressure-test certificate story."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
