import Link from "next/link"
import { ArrowLeftIcon, FileTextIcon, GitBranchIcon } from "lucide-react"

import { DataUnavailable } from "@/components/data-unavailable"
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
import { Separator } from "@/components/ui/separator"
import { getAsset, getAssetTimeline, getDocuments } from "@/lib/api/client"
import { formatDate, titleCase } from "@/lib/format"

export default async function AssetProfilePage({ params }: { params: Promise<{ assetTag: string }> }) {
  const { assetTag: encodedTag } = await params
  const assetTag = decodeURIComponent(encodedTag).toUpperCase()
  const documentQuery = new URLSearchParams({ asset_tag: assetTag })
  const [assetResult, timelineResult, documentsResult] = await Promise.allSettled([
    getAsset(assetTag),
    getAssetTimeline(assetTag),
    getDocuments(documentQuery),
  ])
  const asset = assetResult.status === "fulfilled" ? assetResult.value : null
  const timeline = timelineResult.status === "fulfilled" ? timelineResult.value.items : []
  const documents = documentsResult.status === "fulfilled" ? documentsResult.value.items : []

  if (!asset) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/assets" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeftIcon data-icon="inline-start" /> Back to assets
        </Link>
        <DataUnavailable label={`Asset ${assetTag}`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/assets" className={`${buttonVariants({ variant: "ghost", size: "sm" })} w-fit`}>
        <ArrowLeftIcon data-icon="inline-start" /> Back to assets
      </Link>
      <PageHeader
        eyebrow={asset.asset_type}
        title={asset.asset_tag}
        description={asset.summary}
        status={asset.plant_id.toUpperCase()}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm"><CardHeader><CardDescription>Linked evidence</CardDescription><CardTitle className="font-mono text-3xl">{asset.document_count}</CardTitle></CardHeader></Card>
        <Card size="sm"><CardHeader><CardDescription>Open risks</CardDescription><CardTitle className="font-mono text-3xl">{asset.open_risks}</CardTitle></CardHeader></Card>
        <Card size="sm"><CardHeader><CardDescription>Compliance gaps</CardDescription><CardTitle className="font-mono text-3xl">{asset.compliance_gaps}</CardTitle></CardHeader></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance and evidence timeline</CardTitle>
            <CardDescription>Work orders, inspections, and incidents in operational sequence.</CardDescription>
          </CardHeader>
          <CardContent className="evidence-spine flex flex-col gap-5 pl-8">
            {timeline.map((item) => (
              <article key={`${item.type}-${item.id}`} className="relative rounded-lg border bg-background/50 p-4 before:absolute before:-left-[1.92rem] before:top-5 before:size-3 before:rounded-full before:border-2 before:border-primary before:bg-background">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{titleCase(item.type)}</Badge>
                    <span className="font-mono text-xs text-primary">{item.id}</span>
                  </div>
                  <time className="font-mono text-xs text-muted-foreground">{formatDate(item.date)}</time>
                </div>
                <p className="mt-3 text-sm font-medium">{item.title}</p>
                <Link
                  href={`/documents/${encodeURIComponent(item.document_id)}`}
                  className="mt-2 inline-flex font-mono text-[0.68rem] text-primary underline-offset-4 hover:underline"
                >
                  Open evidence: {item.document_id}
                </Link>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence packet</CardTitle>
            <CardDescription>Documents linked to this asset by the ingestion layer.</CardDescription>
            <CardAction><FileTextIcon className="size-4 text-muted-foreground" /></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {documents.map((document, index) => (
              <div key={document.id}>
                <div className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <Link
                      href={`/documents/${encodeURIComponent(document.id)}`}
                      className="block truncate text-sm font-medium underline-offset-4 hover:text-primary hover:underline"
                    >
                      {document.filename}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{titleCase(document.doc_type)}</p>
                  </div>
                  <StatusBadge status={document.status} />
                </div>
                {index < documents.length - 1 ? <Separator /> : null}
              </div>
            ))}
            {!documents.length ? <p className="text-sm text-muted-foreground">No linked documents returned.</p> : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Follow the evidence graph</CardTitle>
          <CardDescription>Inspect how this asset connects to work orders, failure modes, and procedures.</CardDescription>
          <CardAction>
            <Link href={`/graph?asset=${encodeURIComponent(asset.asset_tag)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <GitBranchIcon data-icon="inline-start" /> Open graph
            </Link>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  )
}
