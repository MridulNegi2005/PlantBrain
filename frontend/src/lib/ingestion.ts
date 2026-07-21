import type { DocumentStatus } from "@/lib/api/types"

export const INGESTION_STATES = [
  "uploaded",
  "extracting",
  "chunking",
  "embedding",
  "graph_building",
  "completed",
] as const satisfies readonly DocumentStatus[]

export const INGESTION_LABELS: Record<
  (typeof INGESTION_STATES)[number],
  string
> = {
  uploaded: "Received",
  extracting: "Reading the document",
  chunking: "Breaking it into sections",
  embedding: "Making it searchable",
  graph_building: "Connecting to your equipment",
  completed: "Ready",
}

export const INGESTION_DESCRIPTIONS: Record<
  (typeof INGESTION_STATES)[number],
  string
> = {
  uploaded: "File received and checked",
  extracting: "Pulling out the text, tables, and scanned pages",
  chunking: "Splitting it into passages, keeping page numbers",
  embedding: "Indexing it so questions can find it",
  graph_building: "Linking it to the equipment it mentions",
  completed: "Done — you can search and ask about it now",
}

export const INGESTION_POLL_ATTEMPTS = 8
export const INGESTION_POLL_INTERVAL_MS = 750
