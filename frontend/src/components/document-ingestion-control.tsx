"use client"

import { useState } from "react"
import { RefreshCwIcon, RotateCcwIcon } from "lucide-react"

import { IngestionTimeline } from "@/components/ingestion-timeline"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { getIngestionJob, ingestDocument } from "@/lib/api/client"
import type { DocumentStatus, IngestionJob } from "@/lib/api/types"
import {
  INGESTION_POLL_ATTEMPTS,
  INGESTION_POLL_INTERVAL_MS,
  INGESTION_STATES,
} from "@/lib/ingestion"

type DocumentIngestionControlProps = {
  documentId: string
  initialStatus: DocumentStatus
}

export function DocumentIngestionControl({
  documentId,
  initialStatus,
}: DocumentIngestionControlProps) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<IngestionJob | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function refreshJob(id: string) {
    const current = await getIngestionJob(id)
    setJob(current)
    if (current.status === "failed") {
      throw new Error(current.error ?? "Processing failed. Please try again.")
    }
    return current
  }

  async function runIngestion() {
    setBusy(true)
    setError(null)
    setNotice(null)
    setJob(null)

    try {
      const queued = await ingestDocument(documentId)
      setJobId(queued.ingestion_job_id)
      let reachedTerminalState = false

      for (let attempt = 0; attempt < INGESTION_POLL_ATTEMPTS; attempt += 1) {
        const current = await refreshJob(queued.ingestion_job_id)
        if (current.status === "completed") {
          reachedTerminalState = true
          break
        }
        await new Promise((resolve) =>
          window.setTimeout(resolve, INGESTION_POLL_INTERVAL_MS)
        )
      }

      if (!reachedTerminalState) {
        setNotice(
          "Still processing. Use Check latest to see the newest status without starting over."
        )
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Couldn't re-process this document. Please try again."
      )
    } finally {
      setBusy(false)
    }
  }

  async function checkLatestState() {
    if (!jobId) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const current = await refreshJob(jobId)
      if (current.status !== "completed") {
        setNotice("Still processing. The latest step is shown above.")
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The job status could not be refreshed."
      )
    } finally {
      setBusy(false)
    }
  }

  const initialIndex = INGESTION_STATES.indexOf(
    initialStatus as (typeof INGESTION_STATES)[number]
  )
  const currentIndex = job?.current_state_index ?? Math.max(initialIndex, 0)
  const currentStatus = job?.status ?? initialStatus

  return (
    <Card>
      <CardHeader>
        <CardTitle>Re-process this document</CardTitle>
        <CardDescription>
          Run PlantBrain over this document again — useful if it was updated or didn't finish the first time.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border bg-background p-3">
          <div>
            <p className="text-xs text-muted-foreground">Current status</p>
            <p className="mt-1 font-mono text-xs">{jobId ?? documentId}</p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>

        <IngestionTimeline currentIndex={currentIndex} status={currentStatus} />

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Processing failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {notice ? (
          <Alert>
            <AlertTitle>Still processing</AlertTitle>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2">
        {jobId ? (
          <Button variant="outline" onClick={checkLatestState} disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
            Check latest
          </Button>
        ) : null}
        <Button onClick={runIngestion} disabled={busy}>
          {busy ? <Spinner data-icon="inline-start" /> : <RotateCcwIcon data-icon="inline-start" />}
          {busy ? "Working…" : "Re-process"}
        </Button>
      </CardFooter>
    </Card>
  )
}
