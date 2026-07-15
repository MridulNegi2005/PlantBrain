import type { DocumentStatus } from "@/lib/api/types"

export const INGESTION_STATES = [
  "uploaded",
  "extracting",
  "chunking",
  "embedding",
  "graph_building",
  "completed",
] as const satisfies readonly DocumentStatus[]

export const INGESTION_DESCRIPTIONS: Record<
  (typeof INGESTION_STATES)[number],
  string
> = {
  uploaded: "File accepted and fingerprinted",
  extracting: "Text, tables, and OCR content extracted",
  chunking: "Evidence split with page provenance",
  embedding: "Retrieval vectors generated",
  graph_building: "Assets and relationships connected",
  completed: "Document available to search and agents",
}

export const INGESTION_POLL_ATTEMPTS = 8
export const INGESTION_POLL_INTERVAL_MS = 750
