import { BracesIcon, FileSearchIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { DocumentChunksResponse } from "@/lib/api/types"

export function DocumentChunksPanel({ chunks }: { chunks: DocumentChunksResponse }) {
  const hasNoExtractedEvidence = chunks.stub || chunks.total === 0 || !chunks.items.length

  return (
    <section className="border border-border bg-card" aria-labelledby="evidence-chunks-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
        <div>
          <p className="technical-label">Retrieval surface</p>
          <h2 id="evidence-chunks-title" className="mt-1 text-lg font-semibold tracking-[-0.02em]">
            Page-grounded evidence chunks
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={hasNoExtractedEvidence ? "destructive" : "outline"}>
            {hasNoExtractedEvidence ? "No extracted chunks" : `${chunks.total} chunks`}
          </Badge>
          <BracesIcon className="size-4 text-muted-foreground" />
        </div>
      </div>

      {hasNoExtractedEvidence ? (
        <div className="p-4 sm:p-5">
          <Alert>
            <FileSearchIcon />
            <AlertTitle>Extraction has not produced real chunks yet</AlertTitle>
            <AlertDescription>
              No usable evidence chunks are available. Run ingestion successfully before using this document in retrieval or citations.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <ol className="divide-y divide-border">
        {chunks.items.map((chunk, index) => (
          <li key={chunk.chunk_id} className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[8rem_minmax(0,1fr)_auto]">
            <div>
              <p className="font-mono text-[0.62rem] text-muted-foreground">
                {String(index + 1).padStart(2, "0")} / PAGE {chunk.page ?? "N/A"}
              </p>
              <p className="mt-2 break-all font-mono text-[0.65rem] text-primary">{chunk.chunk_id}</p>
            </div>
            <blockquote className="border-l-2 border-primary pl-4 text-sm leading-6 text-foreground">
              {chunk.text}
            </blockquote>
            <div className="flex flex-wrap content-start gap-2 lg:max-w-48 lg:justify-end">
              {chunk.asset_tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
              {chunk.bbox ? (
                <Badge variant="secondary">
                  XY {Math.round(chunk.bbox.x0)},{Math.round(chunk.bbox.y0)}
                </Badge>
              ) : (
                <Badge variant="outline">No coordinates</Badge>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
