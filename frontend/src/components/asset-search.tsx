"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRightIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import type { AssetSummary } from "@/lib/api/types"

export function AssetSearch({ assets }: { assets: AssetSummary[] }) {
  const [query, setQuery] = useState("")
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return assets
    return assets.filter(
      (asset) =>
        asset.asset_tag.toLowerCase().includes(normalized) ||
        asset.asset_type.toLowerCase().includes(normalized)
    )
  }, [assets, query])

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <Field>
          <FieldLabel htmlFor="asset-search">Find equipment</FieldLabel>
          <InputGroup>
            <InputGroupAddon><SearchIcon /></InputGroupAddon>
            <InputGroupInput
              id="asset-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try P-204A or 'pump'"
              autoComplete="off"
            />
          </InputGroup>
          <FieldDescription>Search by tag (e.g. P-204A) or type (e.g. pump). Results update as you type.</FieldDescription>
        </Field>
        <div className="border-l-2 border-primary pl-3">
          <p className="font-mono text-2xl font-medium tabular-nums">{results.length}</p>
          <p className="technical-label mt-1">Matches</p>
        </div>
      </div>

      {results.length ? (
        <div className="border border-border bg-card">
          <div className="hidden grid-cols-[3rem_9rem_minmax(0,1fr)_auto_2rem] gap-4 border-b border-border px-5 py-3 md:grid">
            {['No.', 'Tag', 'Equipment', 'Status', ''].map((label) => (
              <span key={label} className="technical-label">{label}</span>
            ))}
          </div>
          {results.map((asset, index) => (
            <Link
              key={asset.asset_tag}
              href={`/assets/${encodeURIComponent(asset.asset_tag)}`}
              aria-label={`Open ${asset.asset_tag}`}
              className="group grid gap-3 border-b border-border px-4 py-5 transition-colors last:border-b-0 hover:bg-muted md:grid-cols-[3rem_9rem_minmax(0,1fr)_auto_2rem] md:items-center md:gap-4 md:px-5"
            >
              <span className="font-mono text-[0.62rem] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
              <span className="font-mono text-lg font-semibold tracking-[-0.04em] text-primary">{asset.asset_tag}</span>
              <div>
                <p className="text-sm font-medium">{asset.asset_type}</p>
                <p className="mt-1 font-mono text-[0.62rem] text-muted-foreground">{asset.document_count} linked documents</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {asset.open_risks ? <Badge variant="secondary">{asset.open_risks} open risk</Badge> : null}
                {asset.compliance_gaps ? <Badge variant="destructive">{asset.compliance_gaps} gap</Badge> : null}
                {!asset.open_risks && !asset.compliance_gaps ? <Badge variant="outline">All clear</Badge> : null}
              </div>
              <ArrowUpRightIcon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchIcon /></EmptyMedia>
            <EmptyTitle>No equipment found</EmptyTitle>
            <EmptyDescription>Check the spelling, or try searching by type like "pump" or "tank".</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
