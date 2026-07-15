import Link from "next/link"
import {
  ArrowUpRightIcon,
  DatabaseIcon,
  FileCheck2Icon,
  ShieldAlertIcon,
  WrenchIcon,
} from "lucide-react"

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
import { getAssets, getDocuments, getHealth, getSecurityEvents } from "@/lib/api/client"
import { formatDate, titleCase } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata = { title: "Plant overview" }

export default async function DashboardPage() {
  const [healthResult, documentsResult, assetsResult, securityResult] =
    await Promise.allSettled([
      getHealth(),
      getDocuments(),
      getAssets(),
      getSecurityEvents(),
    ])

  const health = healthResult.status === "fulfilled" ? healthResult.value : null
  const documents = documentsResult.status === "fulfilled" ? documentsResult.value : null
  const assets = assetsResult.status === "fulfilled" ? assetsResult.value : null
  const security = securityResult.status === "fulfilled" ? securityResult.value : null
  const openRisks = assets?.items.reduce((sum, asset) => sum + asset.open_risks, 0)
  const complianceGaps = assets?.items.reduce(
    (sum, asset) => sum + asset.compliance_gaps,
    0
  )

  const metrics = [
    { label: "Evidence documents", value: documents?.total, icon: FileCheck2Icon, detail: "indexed corpus" },
    { label: "Tracked assets", value: assets?.total, icon: DatabaseIcon, detail: "asset-first profiles" },
    { label: "Open risks", value: openRisks, icon: WrenchIcon, detail: "requires review" },
    { label: "Compliance gaps", value: complianceGaps, icon: ShieldAlertIcon, detail: "missing evidence" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Plant control dossier"
        title="Operational knowledge, with its evidence attached."
        description="Monitor the health of Shakti Petrochem Unit-2, move from risk signals to asset history, and keep every AI conclusion traceable to plant records."
        status={health?.status === "ok" ? "SYSTEM ONLINE" : "BACKEND OFFLINE"}
      />

      {!health || !documents || !assets ? <DataUnavailable label="Plant overview data" /> : null}

      <section aria-label="Plant metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} size="sm">
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardAction>
                  <Icon className="size-4 text-muted-foreground" />
                </CardAction>
                <CardTitle className="font-mono text-3xl tracking-[-0.06em]">
                  {metric.value ?? "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{metric.detail}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Asset attention queue</CardTitle>
            <CardDescription>Risk and evidence gaps ranked from the live asset index.</CardDescription>
            <CardAction>
              <Link href="/assets" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View all
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {assets?.items.map((asset, index) => (
              <div key={asset.asset_tag}>
                <Link
                  href={`/assets/${encodeURIComponent(asset.asset_tag)}`}
                  className="grid gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-primary">{asset.asset_tag}</span>
                      <span className="text-sm font-medium">{asset.asset_type}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {asset.document_count} linked documents
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {asset.open_risks > 0 ? <Badge variant="secondary">{asset.open_risks} risk</Badge> : null}
                    {asset.compliance_gaps > 0 ? <Badge variant="destructive">{asset.compliance_gaps} gap</Badge> : null}
                    {asset.open_risks === 0 && asset.compliance_gaps === 0 ? <Badge variant="outline">Clear</Badge> : null}
                  </div>
                </Link>
                {index < (assets?.items.length ?? 0) - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge layer</CardTitle>
              <CardDescription>Infrastructure status from the health endpoint.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">API service</span>
                <StatusBadge status={health?.status ?? "offline"} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">PostgreSQL</span>
                <StatusBadge status={health?.db_connected ? "connected" : "offline"} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">pgvector</span>
                <StatusBadge status={health?.pgvector_enabled ? "enabled" : "offline"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security watch</CardTitle>
              <CardDescription>Recent guarded events from uploaded evidence.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {security?.items.slice(0, 2).map((event) => (
                <div key={event.id} className="evidence-spine pl-6">
                  <p className="text-sm font-medium">{titleCase(event.event_type)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-muted-foreground">
                    {event.resource_id} · {formatDate(event.created_at)}
                  </p>
                </div>
              ))}
              {security && security.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No security events recorded.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recently indexed evidence</CardTitle>
            <CardDescription>Latest documents returned by the ingestion registry.</CardDescription>
            <CardAction>
              <Link href="/documents" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Document register
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {documents?.items.slice(0, 6).map((document) => (
              <Link
                key={document.id}
                href={`/documents/${encodeURIComponent(document.id)}`}
                className="rounded-lg border bg-background/50 p-3 transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-medium">{document.filename}</p>
                  <StatusBadge status={document.status} />
                </div>
                <p className="mt-3 font-mono text-[0.68rem] text-muted-foreground">
                  {titleCase(document.doc_type)} · {formatDate(document.created_at)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
