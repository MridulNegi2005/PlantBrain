import Link from "next/link"
import { ArrowUpRightIcon, ShieldAlertIcon } from "lucide-react"

import { DataUnavailable } from "@/components/data-unavailable"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { getAssets, getDocuments, getHealth, getSecurityEvents } from "@/lib/api/client"
import { formatDate, titleCase } from "@/lib/format"

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
    { code: "DOC", label: "Documents", value: documents?.total, detail: "uploaded & searchable" },
    { code: "EQP", label: "Equipment tracked", value: assets?.total, detail: "across the plant" },
    { code: "RSK", label: "Open risks", value: openRisks, detail: "need attention" },
    { code: "GAP", label: "Compliance gaps", value: complianceGaps, detail: "missing records" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Plant overview"
        title="Everything about your plant, in one place."
        description="A live view of Shakti Petrochem Unit-2 — your equipment, documents, open risks, and the proof behind every answer."
        status={health?.db_connected ? "Connected" : "Not connected"}
      />

      {!health || !documents || !assets ? <DataUnavailable label="Plant overview data" /> : null}

      <section className="border border-border bg-card" aria-labelledby="plant-index-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="size-2 bg-primary" aria-hidden="true" />
            <h2 id="plant-index-title" className="font-mono text-[0.68rem] font-semibold tracking-[0.12em] uppercase">
              Plant summary
            </h2>
          </div>
          <span className="font-mono text-[0.62rem] tracking-[0.08em] text-muted-foreground uppercase">
            Live data
          </span>
        </div>
        <div className="stagger grid divide-y divide-border sm:grid-cols-2 sm:divide-x xl:grid-cols-4 xl:divide-y-0">
          {metrics.map((metric) => (
            <div key={metric.code} className="min-h-40 p-5 transition-colors hover:bg-muted/40">
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-[0.62rem] font-semibold text-primary">{metric.code}</span>
                <span className="font-mono text-[0.58rem] tracking-[0.08em] text-muted-foreground uppercase">{metric.detail}</span>
              </div>
              <p className="mt-7 font-mono text-5xl font-medium tracking-[-0.08em] tabular-nums">
                {metric.value ?? "—"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]">
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
            <div>
              <p className="technical-label">Needs attention</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">Equipment to review</h2>
            </div>
            <Link href="/assets" className="flex min-h-10 items-center gap-2 px-2 font-mono text-[0.65rem] font-semibold text-primary uppercase hover:text-foreground">
              View all <ArrowUpRightIcon className="size-3.5" />
            </Link>
          </div>

          <div>
            {assets?.items.map((asset, index) => (
              <Link
                key={asset.asset_tag}
                href={`/assets/${encodeURIComponent(asset.asset_tag)}`}
                className="group grid gap-3 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-muted sm:grid-cols-[3rem_8rem_minmax(0,1fr)_auto] sm:items-center sm:px-5 hover:sm:pl-6 [transition:background-color_150ms,padding_150ms]"
              >
                <span className="font-mono text-[0.62rem] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-mono text-sm font-semibold text-primary">{asset.asset_tag}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{asset.asset_type}</p>
                  <p className="mt-1 font-mono text-[0.62rem] text-muted-foreground">{asset.document_count} linked documents</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {asset.open_risks > 0 ? <Badge variant="secondary">{asset.open_risks} risk</Badge> : null}
                  {asset.compliance_gaps > 0 ? <Badge variant="destructive">{asset.compliance_gaps} gap</Badge> : null}
                  {asset.open_risks === 0 && asset.compliance_gaps === 0 ? <Badge variant="outline">Clear</Badge> : null}
                  <ArrowUpRightIcon className="size-4 text-muted-foreground transition-[color,transform] group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid content-start gap-5">
          <section className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="technical-label">System status</p>
              <h2 className="mt-1 text-base font-semibold">Everything running?</h2>
            </div>
            <dl className="divide-y divide-border px-4">
              {[
                ["App service", health?.status ?? "offline"],
                ["Database", health?.db_connected ? "connected" : "offline"],
                ["Smart search", health?.pgvector_enabled ? "ready" : "unavailable"],
              ].map(([label, status]) => (
                <div key={label} className="flex min-h-12 items-center justify-between gap-3 py-2">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd><StatusBadge status={String(status)} /></dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <ShieldAlertIcon className="size-4 text-destructive" />
              <div>
                <p className="technical-label">Security</p>
                <h2 className="mt-1 text-base font-semibold">Suspicious activity</h2>
              </div>
            </div>
            <div className="divide-y divide-border">
              {security?.items.slice(0, 2).map((event) => (
                <article key={event.id} className="p-4">
                  <p className="font-mono text-[0.65rem] font-semibold text-destructive uppercase">{titleCase(event.event_type)}</p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{event.detail ?? "No event detail was recorded."}</p>
                  <p className="mt-3 font-mono text-[0.6rem] text-muted-foreground">
                    {event.resource_id ?? "No resource ID"} / {formatDate(event.created_at)}
                  </p>
                </article>
              ))}
              {security && security.items.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No suspicious activity detected.</p>
              ) : null}
            </div>
          </section>
        </div>
      </section>

      <section className="border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <p className="technical-label">Documents</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">Recently added</h2>
          </div>
          <Link href="/documents" className="font-mono text-[0.65rem] font-semibold text-primary uppercase hover:text-foreground">View all documents</Link>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3">
          {documents?.items.slice(0, 6).map((document) => (
            <Link
              key={document.id}
              href={`/documents/${encodeURIComponent(document.id)}`}
              className="group min-w-0 border-b border-border p-4 transition-colors hover:bg-muted md:border-r xl:[&:nth-child(3n)]:border-r-0 xl:[&:nth-last-child(-n+3)]:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="truncate text-sm font-semibold group-hover:text-primary">{document.filename}</p>
                <StatusBadge status={document.status} />
              </div>
              <p className="mt-5 font-mono text-[0.62rem] text-muted-foreground">
                {titleCase(document.doc_type)} / {formatDate(document.created_at)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
