import { AssetSearch } from "@/components/asset-search"
import { DataUnavailable } from "@/components/data-unavailable"
import { PageHeader } from "@/components/page-header"
import { getAssets } from "@/lib/api/client"

export const metadata = { title: "Equipment" }

export default async function AssetsPage() {
  const result = await getAssets().catch(() => null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Equipment"
        title="Start with a piece of equipment."
        description="Pick any pump, vessel, or exchanger to see its documents, past failures, compliance records, and how it connects to everything else."
        status={result ? `${result.total} ASSETS` : "UNAVAILABLE"}
      />
      {!result ? <DataUnavailable label="Asset index" /> : null}
      {result ? <AssetSearch assets={result.items} /> : null}
    </div>
  )
}
