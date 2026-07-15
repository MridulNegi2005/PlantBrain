import { AssetSearch } from "@/components/asset-search"
import { DataUnavailable } from "@/components/data-unavailable"
import { PageHeader } from "@/components/page-header"
import { getAssets } from "@/lib/api/client"

export const metadata = { title: "Assets" }

export default async function AssetsPage() {
  const result = await getAssets().catch(() => null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Asset intelligence"
        title="Start with the equipment, not the folder tree."
        description="Find a plant asset and move directly into its linked documents, failure history, compliance evidence, and knowledge graph."
        status={result ? `${result.total} ASSETS` : "UNAVAILABLE"}
      />
      {!result ? <DataUnavailable label="Asset index" /> : null}
      {result ? <AssetSearch assets={result.items} /> : null}
    </div>
  )
}
