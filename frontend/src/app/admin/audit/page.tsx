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
        description="Review document, ingestion, AI, and security activity with actors, resources, and timestamps preserved for operational trust."
        status={logs ? `${logs.total} AUDIT EVENTS` : "UNAVAILABLE"}
      />
      {!logs ? <DataUnavailable label="Audit log" /> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card size="sm">
          <CardHeader><CardDescription>Audit events</CardDescription><CardTitle className="font-mono text-3xl">{logs?.total ?? "—"}</CardTitle></CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader><CardDescription>Security events</CardDescription><CardTitle className="font-mono text-3xl">{security?.total ?? "—"}</CardTitle></CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader><CardDescription>Control posture</CardDescription><CardTitle className="flex items-center gap-2 text-base"><ShieldCheckIcon className="size-4 text-primary" /> Read-only AI agents</CardTitle></CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Actor and resource trail from GET /api/audit-logs.</CardDescription>
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
                  <TableCell><Badge variant="outline">{log.actor}</Badge></TableCell>
                  <TableCell>{titleCase(log.action.replaceAll(".", " "))}</TableCell>
                  <TableCell>
                    <div><p className="text-sm">{titleCase(log.resource_type)}</p><p className="font-mono text-[0.68rem] text-muted-foreground">{log.resource_id}</p></div>
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
            <article key={event.id} className="rounded-lg border bg-background/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="destructive"><AlertTriangleIcon data-icon="inline-start" />{titleCase(event.event_type)}</Badge>
                <time className="font-mono text-[0.68rem] text-muted-foreground">{formatDateTime(event.created_at)}</time>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{event.detail}</p>
              <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground">{event.resource_id}</p>
            </article>
          ))}
          {security && !security.items.length ? <p className="text-sm text-muted-foreground">No security events returned.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
