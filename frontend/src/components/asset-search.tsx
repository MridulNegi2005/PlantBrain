"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRightIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <Field>
        <FieldLabel htmlFor="asset-search">Search the plant index</FieldLabel>
        <InputGroup>
          <InputGroupAddon><SearchIcon /></InputGroupAddon>
          <InputGroupInput
            id="asset-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try P-204A"
            autoComplete="off"
          />
        </InputGroup>
        <FieldDescription>Search by asset tag or equipment type. Results update immediately.</FieldDescription>
      </Field>

      {results.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((asset) => (
            <Card key={asset.asset_tag}>
              <CardHeader>
                <CardDescription>{asset.asset_type}</CardDescription>
                <CardTitle className="font-mono text-2xl text-primary">{asset.asset_tag}</CardTitle>
                <CardAction>
                  <Link
                    href={`/assets/${encodeURIComponent(asset.asset_tag)}`}
                    aria-label={`Open ${asset.asset_tag}`}
                    className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                  >
                    <ArrowUpRightIcon />
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="outline">{asset.document_count} documents</Badge>
                {asset.open_risks ? <Badge variant="secondary">{asset.open_risks} open risk</Badge> : null}
                {asset.compliance_gaps ? <Badge variant="destructive">{asset.compliance_gaps} gap</Badge> : null}
                {!asset.open_risks && !asset.compliance_gaps ? <Badge variant="outline">No open findings</Badge> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchIcon /></EmptyMedia>
            <EmptyTitle>No matching asset</EmptyTitle>
            <EmptyDescription>Check the tag spelling or search by equipment type.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
