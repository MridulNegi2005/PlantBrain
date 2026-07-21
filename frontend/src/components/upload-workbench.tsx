"use client"

import { useRef, useState } from "react"
import {
  CheckIcon,
  FileUpIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react"

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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getIngestionJob, ingestDocument, uploadDocument } from "@/lib/api/client"
import type { IngestionJob, UploadedDocument } from "@/lib/api/types"
import {
  INGESTION_POLL_ATTEMPTS,
  INGESTION_POLL_INTERVAL_MS,
} from "@/lib/ingestion"
import { cn } from "@/lib/utils"

const allowedExtensions = ["pdf", "png", "jpg", "jpeg", "csv", "xlsx", "txt"]
const maxSizeBytes = 20 * 1024 * 1024

function validateFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!extension || !allowedExtensions.includes(extension)) {
    return "Choose a PDF, PNG, JPG, CSV, XLSX, or TXT file."
  }
  if (file.size > maxSizeBytes) return "The file exceeds the 20 MB upload limit."
  return null
}

export function UploadWorkbench() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploaded, setUploaded] = useState<UploadedDocument | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<IngestionJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function chooseFile(nextFile: File | undefined) {
    if (!nextFile) return
    const validationError = validateFile(nextFile)
    setError(validationError)
    setUploaded(null)
    setJob(null)
    setJobId(null)
    setNotice(null)
    if (validationError) {
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setFile(nextFile)
  }

  async function runUpload() {
    if (!file) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const document = await uploadDocument(file)
      setUploaded(document)
      const queued = await ingestDocument(document.id)
      setJobId(queued.ingestion_job_id)
      let reachedTerminalState = false

      for (let attempt = 0; attempt < INGESTION_POLL_ATTEMPTS; attempt += 1) {
        const current = await getIngestionJob(queued.ingestion_job_id)
        setJob(current)
        if (current.status === "completed") {
          reachedTerminalState = true
          break
        }
        if (current.status === "failed") {
          throw new Error(current.error ?? "Processing failed. Please try again.")
        }
        if (attempt < INGESTION_POLL_ATTEMPTS - 1) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, INGESTION_POLL_INTERVAL_MS)
          )
        }
      }

      if (!reachedTerminalState) {
        setNotice(
          "This is taking longer than usual. It's still processing in the background — use Check latest to see the newest status."
        )
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The upload could not be completed.")
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
      const current = await getIngestionJob(jobId)
      setJob(current)
      if (current.status === "failed") {
        throw new Error(current.error ?? "The ingestion job failed.")
      }
      if (current.status !== "completed") {
        setNotice("Still processing. The latest step is shown above.")
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't refresh the status. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const currentIndex = job?.current_state_index ?? (uploaded ? 0 : -1)

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Upload a document</CardTitle>
          <CardDescription>We check the file on your device first, then send it securely to PlantBrain.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="evidence-file">Document</FieldLabel>
              <button
                type="button"
                className={cn(
                  "flex min-h-56 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-sm border border-dashed bg-background p-6 text-center transition-colors hover:border-primary hover:bg-muted focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  file && "border-primary bg-muted"
                )}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  chooseFile(event.dataTransfer.files[0])
                }}
              >
                <span className="flex size-12 items-center justify-center rounded-sm border bg-card text-primary">
                  <FileUpIcon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {file ? file.name : "Drop a file here or choose from this device"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB ready to upload` : "PDF, image, spreadsheet, or text · maximum 20 MB"}
                  </span>
                </span>
              </button>
              <Input
                ref={inputRef}
                id="evidence-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.txt"
                className="hidden"
                aria-invalid={Boolean(error)}
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
              <FieldDescription>For safety, text inside documents is treated as information only — never as commands the AI will follow.</FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-4" /> Every file is scanned and verified on our servers too.
          </div>
          <div className="flex flex-wrap gap-2">
            {jobId && job?.status !== "completed" && job?.status !== "failed" ? (
              <Button variant="outline" onClick={checkLatestState} disabled={busy}>
                <RefreshCwIcon data-icon="inline-start" />
                Check latest
              </Button>
            ) : null}
            <Button onClick={runUpload} disabled={!file || busy}>
              {busy ? <Spinner data-icon="inline-start" /> : <FileUpIcon data-icon="inline-start" />}
              {busy ? "Processing" : "Upload & process"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>Watch PlantBrain read the document, break it into searchable pieces, and connect it to your equipment.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <IngestionTimeline
            currentIndex={currentIndex}
            status={job?.status ?? uploaded?.status}
          />

          {uploaded ? (
            <Alert>
              {job?.status === "failed" ? <XIcon /> : <CheckIcon />}
              <AlertTitle>{uploaded.filename}</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{uploaded.id}</span>
                <StatusBadge status={job?.status ?? uploaded.status} />
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">Choose a file to begin. Each step will appear here as it happens.</p>
          )}
          {notice ? (
            <Alert>
              <AlertTitle>Polling paused</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
