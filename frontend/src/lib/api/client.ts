import type {
  ApiErrorShape,
  AssetDetail,
  AssetSummary,
  AssetTimelineItem,
  AuditLog,
  ComplianceReport,
  CopilotAnswer,
  DocumentDetail,
  DocumentChunksResponse,
  DocumentSummary,
  EvaluationCase,
  EvaluationRun,
  LatestEvaluationRun,
  Health,
  IngestionJob,
  KnowledgeGraph,
  ListResponse,
  RcaReport,
  SecurityEvent,
  SimilarLessonsResponse,
  UploadedDocument,
} from "@/lib/api/types"

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000"

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000
const LONG_REQUEST_TIMEOUT_MS = 120_000

function publicErrorMessage(status: number, backendMessage?: string) {
  if (status >= 400 && status < 500 && backendMessage) return backendMessage
  if (status === 502 || status === 503 || status === 504) {
    return "The PlantBrain service is temporarily unavailable."
  }
  if (status >= 500) return "The PlantBrain service could not complete the request."
  return `Request failed with status ${status}`
}

async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<T> {
  const bodyIsFormData = init?.body instanceof FormData
  const deadline = AbortSignal.timeout(timeoutMs)
  const signal = init?.signal
    ? AbortSignal.any([init.signal, deadline])
    : deadline
  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...init,
      signal,
      headers: {
        ...(bodyIsFormData ? {} : init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(
        "The PlantBrain service did not respond in time.",
        408,
        "request_timeout"
      )
    }
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new ApiError(
      "The PlantBrain backend is unavailable.",
      0,
      "network_error"
    )
  }

  if (!response.ok) {
    let payload: ApiErrorShape | undefined
    try {
      payload = (await response.json()) as ApiErrorShape
    } catch {
      payload = undefined
    }
    const backendError = payload?.error ?? payload?.detail?.error
    throw new ApiError(
      publicErrorMessage(response.status, backendError?.message),
      response.status,
      backendError?.code
    )
  }

  return (await response.json()) as T
}

export function getHealth() {
  return request<Health>("/health")
}

export function getDocuments(query?: URLSearchParams) {
  const suffix = query?.size ? `?${query.toString()}` : ""
  return request<ListResponse<DocumentSummary>>(`/api/documents${suffix}`)
}

export function getDocument(documentId: string) {
  return request<DocumentDetail>(
    `/api/documents/${encodeURIComponent(documentId)}`
  )
}

export function getDocumentChunks(documentId: string) {
  return request<DocumentChunksResponse>(
    `/api/documents/${encodeURIComponent(documentId)}/chunks`
  )
}

export function uploadDocument(file: File, plantId?: string) {
  const formData = new FormData()
  formData.append("file", file)
  if (plantId) formData.append("plant_id", plantId)
  return request<UploadedDocument>("/api/documents/upload", {
    method: "POST",
    body: formData,
  }, LONG_REQUEST_TIMEOUT_MS)
}

export function ingestDocument(documentId: string) {
  return request<{ ingestion_job_id: string; status: string }>(
    `/api/documents/${encodeURIComponent(documentId)}/ingest`,
    { method: "POST" },
    LONG_REQUEST_TIMEOUT_MS
  )
}

export function getIngestionJob(jobId: string) {
  return request<IngestionJob>(
    `/api/ingestion-jobs/${encodeURIComponent(jobId)}`
  )
}

export function getAssets() {
  return request<ListResponse<AssetSummary>>("/api/assets")
}

export function getAsset(assetTag: string) {
  return request<AssetDetail>(`/api/assets/${encodeURIComponent(assetTag)}`)
}

export function getAssetTimeline(assetTag: string) {
  return request<{ items: AssetTimelineItem[] }>(
    `/api/assets/${encodeURIComponent(assetTag)}/timeline`
  )
}

export function getAssetGraph(assetTag: string) {
  return request<KnowledgeGraph>(
    `/api/assets/${encodeURIComponent(assetTag)}/graph`
  )
}

export function askCopilot(question: string, assetTag?: string) {
  return request<CopilotAnswer>("/api/copilot/ask", {
    method: "POST",
    body: JSON.stringify({ question, ...(assetTag ? { asset_tag: assetTag } : {}) }),
  })
}

export function generateRca(assetTag: string, issue: string) {
  return request<RcaReport>("/api/rca/generate", {
    method: "POST",
    body: JSON.stringify({ asset_tag: assetTag, issue }),
  })
}

export function findSimilarLessons(failureMode: string) {
  return request<SimilarLessonsResponse>("/api/lessons/similar", {
    method: "POST",
    body: JSON.stringify({ failure_mode: failureMode }),
  })
}

export function checkCompliance(assetTag: string) {
  return request<ComplianceReport>("/api/compliance/check", {
    method: "POST",
    body: JSON.stringify({ asset_tag: assetTag }),
  })
}

export function getEvaluationCases() {
  return request<ListResponse<EvaluationCase>>("/api/evaluation/cases")
}

export function startEvaluation() {
  return request<{ run_id: string; status: string }>("/api/evaluation/run", {
    method: "POST",
  }, LONG_REQUEST_TIMEOUT_MS)
}

export function getEvaluationRun(runId: string) {
  return request<EvaluationRun>(
    `/api/evaluation/runs/${encodeURIComponent(runId)}`
  )
}

export function getLatestEvaluationRun() {
  return request<LatestEvaluationRun>("/api/evaluation/runs")
}

export function getAuditLogs() {
  return request<ListResponse<AuditLog>>("/api/audit-logs")
}

export function getSecurityEvents() {
  return request<ListResponse<SecurityEvent>>("/api/security-events")
}
