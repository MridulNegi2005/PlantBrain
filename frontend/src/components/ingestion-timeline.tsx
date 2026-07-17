import {
  CheckIcon,
  CircleDashedIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import type { DocumentStatus } from "@/lib/api/types"
import { INGESTION_DESCRIPTIONS, INGESTION_STATES } from "@/lib/ingestion"
import { titleCase } from "@/lib/format"
import { cn } from "@/lib/utils"

type IngestionTimelineProps = {
  currentIndex: number
  status?: DocumentStatus
}

export function IngestionTimeline({ currentIndex, status }: IngestionTimelineProps) {
  const boundedIndex = Math.min(
    Math.max(currentIndex, -1),
    INGESTION_STATES.length - 1
  )
  const hasReliableFailureStage = status !== "failed" || currentIndex > 0
  const progress =
    status === "completed"
      ? 100
      : status === "failed" && !hasReliableFailureStage
        ? 0
      : Math.max(0, ((boundedIndex + 1) / INGESTION_STATES.length) * 100)

  return (
    <div className="flex flex-col gap-6">
      <Progress value={progress}>
        <ProgressLabel>Knowledge pipeline</ProgressLabel>
        <ProgressValue />
      </Progress>

      {status === "failed" && !hasReliableFailureStage ? (
        <p className="text-sm text-destructive">
          Ingestion failed, but the backend did not identify the failing stage.
        </p>
      ) : null}

      <ol className="evidence-spine flex flex-col gap-5 pl-8" aria-label="Ingestion stages">
        {INGESTION_STATES.map((state, index) => {
          const failedHere = status === "failed" && hasReliableFailureStage && boundedIndex === index
          const completed = status === "completed" || (!failedHere && boundedIndex > index)
          const current = boundedIndex === index && status !== "completed" && status !== "failed" && !failedHere

          return (
            <li
              key={state}
              className="relative min-h-10 before:absolute before:-left-[1.92rem] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-primary before:bg-background"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      index > boundedIndex && "text-muted-foreground"
                    )}
                  >
                    {titleCase(state)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {INGESTION_DESCRIPTIONS[state]}
                  </p>
                </div>
                {failedHere ? (
                  <TriangleAlertIcon className="size-4 text-destructive" />
                ) : completed ? (
                  <CheckIcon className="size-4 text-primary" />
                ) : current ? (
                  <Spinner />
                ) : (
                  <CircleDashedIcon className="size-4 text-muted-foreground" />
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
