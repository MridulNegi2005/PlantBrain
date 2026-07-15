import { Badge } from "@/components/ui/badge"
import { titleCase } from "@/lib/format"

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const variant =
    normalized === "failed" || normalized === "gap" || normalized === "high"
      ? "destructive"
      : normalized === "completed" || normalized === "pass" || normalized === "ok"
        ? "default"
        : normalized === "uploaded" || normalized === "running" || normalized === "queued"
          ? "secondary"
          : "outline"

  return <Badge variant={variant}>{titleCase(status)}</Badge>
}
