import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  BoxesIcon,
  FileTextIcon,
  FingerprintIcon,
} from "lucide-react"

import { DataUnavailable } from "@/components/data-unavailable"
import { DocumentIngestionControl } from "@/components/document-ingestion-control"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiError, getDocument } from "@/lib/api/client"
import { formatDate, titleCase } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata = { title: "Evidence record" }

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>
}) {
  const { documentId } = await params

  const result = await getDocument(documentId).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound()
    return null
  })

  if (!result) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/documents"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
        >
          <ArrowLeftIcon data-icon="inline-start" /> Back to documents
        </Link>
        <DataUnavailable label={`Document ${documentId}`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/documents"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
      >
        <ArrowLeftIcon data-icon="inline-start" /> Back to documents
      </Link>

      <PageHeader
        eyebrow="Evidence record"
        title={result.filename}
        description="Inspect the source record, linked assets, indexing coverage, and ingestion state behind operational answers."
        status={result.status.toUpperCase()}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Document metrics">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Document type</CardDescription>
            <CardTitle>{titleCase(result.doc_type)}</CardTitle>
            <CardAction><FileTextIcon className="size-4 text-muted-foreground" /></CardAction>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Pages</CardDescription>
            <CardTitle className="font-mono text-3xl">{result.page_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Evidence chunks</CardDescription>
            <CardTitle className="font-mono text-3xl">{result.chunks_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Index status</CardDescription>
            <CardTitle><StatusBadge status={result.status} /></CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Provenance identity</CardTitle>
              <CardDescription>Stable identifiers returned by the document registry.</CardDescription>
              <CardAction><FingerprintIcon className="size-4 text-muted-foreground" /></CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Document ID</p>
                <p className="mt-1 break-all font-mono text-sm">{result.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Indexed at</p>
                <time className="mt-1 block font-mono text-sm" dateTime={result.created_at}>
                  {formatDate(result.created_at)}
                </time>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked assets</CardTitle>
              <CardDescription>Asset profiles connected during entity extraction.</CardDescription>
              <CardAction><BoxesIcon className="size-4 text-muted-foreground" /></CardAction>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {result.asset_tags?.map((assetTag) => (
                <Badge
                  key={assetTag}
                  variant="outline"
                  render={<Link href={`/assets/${encodeURIComponent(assetTag)}`} />}
                >
                  {assetTag}
                </Badge>
              ))}
              {!result.asset_tags?.length ? (
                <p className="text-sm text-muted-foreground">
                  No asset tags were linked to this record.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <DocumentIngestionControl
          documentId={result.id}
          initialStatus={result.status}
        />
      </section>
    </div>
  )
}
