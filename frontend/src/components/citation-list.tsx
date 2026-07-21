import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import type { Citation } from "@/lib/api/types"

export function CitationList({
  citations,
  emptyLabel = "No sources listed.",
}: {
  citations: Citation[]
  emptyLabel?: string
}) {
  if (!citations.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="evidence-spine flex flex-col gap-4 pl-7">
      {citations.map((citation, index) => (
        <article
          key={`${citation.document_id ?? citation.document}-${citation.page}-${citation.chunk_id ?? index}`}
          className="relative border border-border bg-background p-4 before:absolute before:-left-[1.68rem] before:top-5 before:size-3 before:border-2 before:border-primary before:bg-background"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{citation.document}</p>
            <Badge variant="outline">
              {citation.page === null ? "Page unavailable" : `Page ${citation.page}`}
            </Badge>
          </div>
          {citation.quote ? (
            <blockquote className="mt-3 border-l-2 border-primary/60 pl-3 text-sm leading-relaxed text-muted-foreground">
              “{citation.quote}”
            </blockquote>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[0.68rem] text-muted-foreground">
            <span>{citation.chunk_id ?? "Reference unavailable"}</span>
            {citation.document_id ? (
              <Link
                href={`/documents/${encodeURIComponent(citation.document_id)}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Open document
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
