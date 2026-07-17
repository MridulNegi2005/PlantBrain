import { AlertTriangleIcon, ShieldCheckIcon } from "lucide-react"

import { DataUnavailable } from "@/components/data-unavailable"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAuditLogs, getSecurityEvents } from "@/lib/api/client"
import { formatDateTime, titleCase } from "@/lib/format"

export const metadata = { title: "Audit log" }

export default async function AuditPage() {
  const [logsResult, securityResult] = await Promise.allSettled([
    getAuditLogs(),
    getSecurityEvents(),
  ])
  const logs = logsResult.status === "fulfilled" ? logsResult.value : null
  const security = securityResult.status === "fulfilled" ? securityResult.value : null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Audit and security trail"
        title="Every consequential action leaves a record."
        description="Review document, ingestion, AI, and security activity with attribution state, resources, and timestamps preserved for operational trust."
        status={logs ? `${logs.total} EVENTS SHOWN` : "UNAVAILABLE"}
      />
      {!logs ? <DataUnavailable label="Audit log" /> : null}

      <section className="grid gap-px border border-border bg-border lg:grid-cols-3" aria-label="Audit summary">
        <div className="bg-card p-5">
          <p className="technical-label">Audit events shown</p>
          <p className="mt-5 font-mono text-4xl tracking-[-0.07em]">{logs?.total ?? "—"}</p>
        </div>
        <div className="bg-card p-5">
          <p className="technical-label">Security events shown</p>
          <p className="mt-5 font-mono text-4xl tracking-[-0.07em]">{security?.total ?? "—"}</p>
        </div>
        <div className="bg-card p-5">
          <p className="technical-label">Control posture</p>
          <p className="mt-5 flex items-center gap-2 text-base font-semibold"><ShieldCheckIcon className="size-4 text-primary" /> Read-only AI agents</p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Latest actor and resource window returned by GET /api/audit-logs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Event ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDateTime(log.created_at)}</TableCell>
                  <TableCell><Badge variant="outline">{log.actor ?? "unattributed"}</Badge></TableCell>
                  <TableCell>{titleCase(log.action.replaceAll(".", " "))}</TableCell>
                  <TableCell>
                    <div><p className="text-sm">{titleCase(log.resource_type ?? "unknown resource")}</p><p className="font-mono text-[0.68rem] text-muted-foreground">{log.resource_id ?? "No resource ID"}</p></div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security events</CardTitle>
          <CardDescription>Prompt injection and document-safety controls surfaced separately from routine activity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {security?.items.map((event) => (
            <article key={event.id} className="rounded-sm border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="destructive"><AlertTriangleIcon data-icon="inline-start" />{titleCase(event.event_type)}</Badge>
                <time className="font-mono text-[0.68rem] text-muted-foreground">{formatDateTime(event.created_at)}</time>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{event.detail ?? "No event detail was recorded."}</p>
              <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground">{event.resource_id ?? "No resource ID"}</p>
            </article>
          ))}
          {security && !security.items.length ? <p className="text-sm text-muted-foreground">No security events returned.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
