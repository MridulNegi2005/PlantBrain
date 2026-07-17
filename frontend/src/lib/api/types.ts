export type ListResponse<T> = {
  items: T[]
  total: number
}

export type Health = {
  status: string
  db_connected: boolean
  pgvector_enabled: boolean
}

export type DocumentStatus =
  | "registered"
  | "uploaded"
  | "queued"
  | "processing"
  | "extracting"
  | "chunking"
  | "embedding"
  | "graph_building"
  | "completed"
  | "failed"

export type DocumentSummary = {
  id: string
  filename: string
  doc_type: string
  status: DocumentStatus
  asset_tags?: string[]
  created_at: string
}

export type DocumentDetail = DocumentSummary & {
  page_count: number | null
  chunks_count: number
}

export type DocumentChunk = {
  chunk_id: string
  page: number
  text: string
  bbox: {
    x0: number
    y0: number
    x1: number
    y1: number
  } | null
  asset_tags: string[]
}

export type DocumentChunksResponse = ListResponse<DocumentChunk> & {
  stub: boolean
}

export type UploadedDocument = {
  id: string
  filename: string
  doc_type: string
  status: DocumentStatus
  hash_sha256: string
  created_at: string
}

export type IngestionJob = {
  id: string
  document_id: string
  status: DocumentStatus
  states: DocumentStatus[]
  current_state_index: number
  error: string | null
  updated_at: string
}

export type AssetSummary = {
  asset_tag: string
  asset_type: string
  document_count: number
  open_risks: number
  compliance_gaps: number
}

export type AssetDetail = AssetSummary & {
  plant_id: string
  summary: string
}

export type AssetTimelineItem = {
  type: string
  id: string
  date: string
  title: string
  document_id: string
}

export type GraphNode = {
  id: string
  type: string
  label: string
}

export type GraphEdge = {
  source: string
  target: string
  type: string
  confidence: number
}

export type KnowledgeGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type Citation = {
  document: string
  page: number
  chunk_id?: string
  quote?: string
}

export type CopilotAnswer = {
  answer: string | null
  reason?: string
  confidence?: number
  citations: Citation[]
  graph_path?: string[]
  missing_evidence?: string[]
  recommended_next_actions?: string[]
  note?: string
}

export type RcaCause = {
  cause: string
  confidence: number
  evidence: string[]
}

export type RcaReport = {
  asset: string
  issue: string
  likely_causes: RcaCause[]
  missing_checks: string[]
  recommended_actions: string[]
  reason?: string
  note?: string
}

export type SimilarIncident = {
  incident_id: string
  similarity: number
  summary: string
  citations: Array<{
    document: string
    page: number
  }>
}

export type SimilarLessonsResponse = {
  items: SimilarIncident[]
}

export type ComplianceReport = {
  asset: string
  requirement: string | null
  status: "ok" | "pass" | "gap" | "unknown"
  evidence_found: string[]
  missing_evidence: string | null
  risk_level: string
  note?: string
}

export type EvaluationCase = {
  id: string
  question: string
  category: string
}

export type EvaluationMetrics = {
  asset_tag_precision: number
  asset_tag_recall: number
  retrieval_hit_rate_top5: number
  citation_correctness: number
  compliance_gap_accuracy: number
  ragas_faithfulness: number
  ragas_answer_relevancy: number
  ragas_context_precision: number
  ragas_context_recall: number
  avg_response_time_sec: number
  manual_baseline_sec: number
}

export type EvaluationRun = {
  id: string
  status: string
  completed_at?: string | null
  metrics?: EvaluationMetrics
}

export type LatestEvaluationRun = {
  id: string | null
  status: string
  completed_at?: string | null
  metrics: Partial<EvaluationMetrics>
}

export type AuditLog = {
  id: string
  actor: string
  action: string
  resource_type: string
  resource_id: string
  created_at: string
}

export type SecurityEvent = {
  id: string
  event_type: string
  resource_id: string
  detail: string
  created_at: string
}

export type ApiErrorShape = {
  error?: {
    code?: string
    message?: string
  }
  detail?: {
    error?: {
      code?: string
      message?: string
    }
  }
}
