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
    <header className="grid gap-6 border-b border-border pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-primary" aria-hidden="true" />
          <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-primary uppercase">
            {eyebrow}
          </p>
        </div>
        <h1 className="mt-4 max-w-4xl font-heading text-[clamp(2rem,5vw,4.4rem)] leading-[0.96] font-semibold tracking-[-0.055em] text-foreground">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>

      {status ? (
        <div className="w-fit border border-border bg-card px-3 py-2.5 lg:min-w-48">
          <p className="font-mono text-[0.58rem] tracking-[0.14em] text-muted-foreground uppercase">System state</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="size-2 bg-primary" aria-hidden="true" />
            <span className="font-mono text-[0.68rem] font-semibold tracking-[0.08em] text-foreground uppercase">{status}</span>
          </div>
        </div>
      ) : null}
    </header>
  )
}
