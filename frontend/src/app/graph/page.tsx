import { GraphWorkbench } from "@/components/graph-workbench"
import { PageHeader } from "@/components/page-header"
import { getAssetGraph } from "@/lib/api/client"

export const metadata = { title: "Knowledge graph" }

export default async function GraphPage({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const query = await searchParams
  const assetTag = (query.asset ?? "P-204A").toUpperCase()
  const graph = await getAssetGraph(assetTag).catch(() => null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Provenance graph"
        title="See how operational facts connect."
        description="Explore assets, work orders, failure modes, and procedures as evidence-scored relationships instead of isolated search results."
        status="EDGE CONFIDENCE VISIBLE"
      />
      <GraphWorkbench initialGraph={graph} initialAsset={assetTag} />
    </div>
  )
}
