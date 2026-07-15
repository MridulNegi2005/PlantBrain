import Link from "next/link"

import { DataUnavailable } from "@/components/data-unavailable"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDocuments } from "@/lib/api/client"
import { formatDate, titleCase } from "@/lib/format"

export const metadata = { title: "Documents" }

export default async function DocumentsPage() {
  const result = await getDocuments().catch(() => null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Evidence register"
        title="Every source entering the knowledge layer."
        description="Review document type, ingestion state, linked asset tags, and provenance identifiers without leaving the operational context."
        status={result ? `${result.total} RECORDS` : "UNAVAILABLE"}
      />
      {!result ? <DataUnavailable label="Document register" /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Document register</CardTitle>
          <CardDescription>Live response from GET /api/documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Indexed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result?.items.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/documents/${encodeURIComponent(document.id)}`}
                        className="font-medium underline-offset-4 hover:text-primary hover:underline"
                      >
                        {document.filename}
                      </Link>
                      <p className="font-mono text-[0.68rem] text-muted-foreground">{document.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>{titleCase(document.doc_type)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {document.asset_tags?.map((tag) => (
                        <Badge key={tag} variant="outline" render={<Link href={`/assets/${encodeURIComponent(tag)}`} />}>
                          {tag}
                        </Badge>
                      ))}
                      {!document.asset_tags?.length ? <span className="text-muted-foreground">—</span> : null}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={document.status} /></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(document.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
