import { BookOpenCheckIcon, FileTextIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SimilarIncident } from "@/lib/api/types"
import { percent } from "@/lib/format"

type SimilarLessonsPanelProps = {
  failureMode: string
  incidents: SimilarIncident[] | null
  error: string | null
}

export function SimilarLessonsPanel({
  failureMode,
  incidents,
  error,
}: SimilarLessonsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar lessons from plant memory</CardTitle>
        <CardDescription>
          Historical incidents retrieved for “{failureMode}”. Similarity supports comparison; it does not prove the same root cause.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <BookOpenCheckIcon />
            <AlertTitle>Historical lessons unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : incidents?.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {incidents.map((incident) => (
              <article
                key={incident.incident_id}
                className="rounded-lg border bg-background/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-primary">
                    {incident.incident_id}
                  </p>
                  <Badge variant="outline">
                    {percent(incident.similarity)} similar
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed">{incident.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2" aria-label="Incident citations">
                  {incident.citations.length ? (
                    incident.citations.map((citation, index) => (
                      <Badge
                        key={`${citation.document}-${citation.page}-${index}`}
                        variant="secondary"
                      >
                        <FileTextIcon data-icon="inline-start" />
                        {citation.document} · p.{citation.page}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="destructive">No citation returned</Badge>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <BookOpenCheckIcon className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No comparable incidents returned</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The backend found no historical lessons for this failure mode.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
