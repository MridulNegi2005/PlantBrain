"use client"

import { useRef, useState } from "react"
import {
  CheckIcon,
  CircleDashedIcon,
  FileUpIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react"

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
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { getIngestionJob, ingestDocument, uploadDocument } from "@/lib/api/client"
import type { DocumentStatus, IngestionJob, UploadedDocument } from "@/lib/api/types"
import { titleCase } from "@/lib/format"
import { cn } from "@/lib/utils"

const states: DocumentStatus[] = [
  "uploaded",
  "extracting",
  "chunking",
  "embedding",
  "graph_building",
  "completed",
]

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
  const [job, setJob] = useState<IngestionJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function chooseFile(nextFile: File | undefined) {
    if (!nextFile) return
    const validationError = validateFile(nextFile)
    setError(validationError)
    if (validationError) return
    setFile(nextFile)
    setUploaded(null)
    setJob(null)
  }

  async function runUpload() {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const document = await uploadDocument(file)
      setUploaded(document)
      const queued = await ingestDocument(document.id)

      for (let attempt = 0; attempt < 45; attempt += 1) {
        const current = await getIngestionJob(queued.ingestion_job_id)
        setJob(current)
        if (current.status === "completed") break
        if (current.status === "failed") {
          throw new Error(current.error ?? "The ingestion job failed.")
        }
        await new Promise((resolve) => window.setTimeout(resolve, 900))
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The upload could not be completed.")
    } finally {
      setBusy(false)
    }
  }

  const currentIndex = job?.current_state_index ?? (uploaded ? 0 : -1)
  const progress = Math.max(0, ((currentIndex + 1) / states.length) * 100)

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Upload plant evidence</CardTitle>
          <CardDescription>Files are validated locally, then sent directly to the FastAPI upload endpoint.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="evidence-file">Evidence file</FieldLabel>
              <button
                type="button"
                className={cn(
                  "flex min-h-56 w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-background/50 p-6 text-center transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  file && "border-primary/60 bg-primary/5"
                )}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  chooseFile(event.dataTransfer.files[0])
                }}
              >
                <span className="flex size-12 items-center justify-center rounded-full border bg-card text-primary">
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
                className="sr-only"
                aria-invalid={Boolean(error)}
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
              <FieldDescription>Uploaded document text is treated as untrusted data, never as AI instructions.</FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-4" /> Server-side type, size, and hash checks still apply.
          </div>
          <Button onClick={runUpload} disabled={!file || busy}>
            {busy ? <Spinner data-icon="inline-start" /> : <FileUpIcon data-icon="inline-start" />}
            {busy ? "Processing" : "Upload and ingest"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingestion status</CardTitle>
          <CardDescription>One job across extraction, chunking, embeddings, and graph construction.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Progress value={progress}>
            <ProgressLabel>Knowledge pipeline</ProgressLabel>
            <ProgressValue />
          </Progress>

          <ol className="evidence-spine flex flex-col gap-5 pl-8" aria-label="Ingestion stages">
            {states.map((state, index) => {
              const completed = currentIndex > index || job?.status === "completed"
              const current = currentIndex === index && job?.status !== "completed"
              return (
                <li key={state} className="relative min-h-10 before:absolute before:-left-[1.92rem] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-primary before:bg-background">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={cn("text-sm font-medium", index > currentIndex && "text-muted-foreground")}>{titleCase(state)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {state === "uploaded" && "File accepted and fingerprinted"}
                        {state === "extracting" && "Text, tables, and OCR content extracted"}
                        {state === "chunking" && "Evidence split with page provenance"}
                        {state === "embedding" && "Retrieval vectors generated"}
                        {state === "graph_building" && "Assets and relationships connected"}
                        {state === "completed" && "Document available to search and agents"}
                      </p>
                    </div>
                    {completed ? <CheckIcon className="size-4 text-primary" /> : current ? <Spinner /> : <CircleDashedIcon className="size-4 text-muted-foreground" />}
                  </div>
                </li>
              )
            })}
          </ol>

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
            <p className="text-sm text-muted-foreground">Choose a file to begin. Pipeline events will appear here from the ingestion job endpoint.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
