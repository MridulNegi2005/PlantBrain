import { GraphWorkbench } from "@/components/graph-workbench"
import { PageHeader } from "@/components/page-header"
import { getAssetGraph } from "@/lib/api/client"

export const metadata = { title: "Connections" }

export default async function GraphPage({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const query = await searchParams
  const assetTag = (query.asset ?? "P-204A").toUpperCase()
  const graph = await getAssetGraph(assetTag).catch(() => null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Connections"
        title="See how everything connects."
        description="A visual map linking equipment to its work orders, failure types, and procedures — so you can follow the story instead of digging through files."
        status="EDGE CONFIDENCE VISIBLE"
      />
      <GraphWorkbench initialGraph={graph} initialAsset={assetTag} />
    </div>
  )
}
