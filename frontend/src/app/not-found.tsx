import Link from "next/link"
import { ArrowLeftIcon, SearchXIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <span className="flex size-14 items-center justify-center rounded-sm border bg-card text-primary">
        <SearchXIcon className="size-6" />
      </span>
      <div className="max-w-md">
        <p className="font-mono text-xs tracking-[0.16em] text-primary uppercase">Record not found</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
          This evidence record is not in the plant index.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The identifier may be stale, or the source has not been ingested into PlantBrain yet.
        </p>
      </div>
      <Link href="/documents" className={buttonVariants({ variant: "outline" })}>
        <ArrowLeftIcon data-icon="inline-start" /> Back to document register
      </Link>
    </div>
  )
}
