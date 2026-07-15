import { Badge } from "@/components/ui/badge"

export function PageHeader({
  eyebrow,
  title,
  description,
  status,
}: {
  eyebrow: string
  title: string
  description: string
  status?: string
}) {
  return (
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="font-mono text-xs font-medium tracking-[0.16em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {status ? <Badge variant="outline" className="w-fit font-mono">{status}</Badge> : null}
    </header>
  )
}
