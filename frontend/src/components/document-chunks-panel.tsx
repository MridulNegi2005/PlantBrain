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
          <p className="technical-label">Inside this document</p>
          <h2 id="evidence-chunks-title" className="mt-1 text-lg font-semibold tracking-[-0.02em]">
            Searchable passages
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={hasNoExtractedEvidence ? "destructive" : "outline"}>
            {hasNoExtractedEvidence ? "Not processed yet" : `${chunks.total} passages`}
          </Badge>
          <BracesIcon className="size-4 text-muted-foreground" />
        </div>
      </div>

      {hasNoExtractedEvidence ? (
        <div className="p-4 sm:p-5">
          <Alert>
            <FileSearchIcon />
            <AlertTitle>This document hasn't been processed yet</AlertTitle>
            <AlertDescription>
              PlantBrain hasn't pulled any searchable text from this document yet. Once it's processed, its passages will appear here and can be searched and cited.
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
                <Badge variant="secondary">Located on page</Badge>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
