"use client"

import { FormEvent, useMemo, useReducer, useState } from "react"
import { GitBranchIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { getAssetGraph } from "@/lib/api/client"
import type { GraphEdge, GraphNode, KnowledgeGraph } from "@/lib/api/types"
import { percent } from "@/lib/format"
import { idleRequestState, requestStateReducer, type RequestState } from "@/lib/request-state"

type LoadedGraph = { assetTag: string; graph: KnowledgeGraph }
type PositionedNode = GraphNode & { x: number; y: number; half: number }

// Left-to-right lanes: the asset flows into its documents, which flow into the
// failure modes and components they mention. One column per node type keeps the
// graph readable no matter how many documents an asset has.
const LANES: { type: string; label: string; x: number; half: number }[] = [
  { type: "Asset", label: "Equipment", x: 70, half: 50 },
  { type: "Document", label: "Documents", x: 300, half: 60 },
  { type: "FailureMode", label: "Failure modes", x: 545, half: 60 },
  { type: "Component", label: "Components", x: 775, half: 60 },
]
const LANE_INDEX = new Map(LANES.map((lane, index) => [lane.type, index]))
const VIEW_W = 850
const ROW_GAP = 42

const RELATIONSHIP: Record<string, string> = {
  ASSET_HAS_DOCUMENT: "Document on file",
  DOCUMENT_MENTIONS_FAILURE: "Mentions failure",
  DOCUMENT_MENTIONS_COMPONENT: "Mentions component",
  FAILURE_AFFECTS_COMPONENT: "Affects component",
}

function relationshipLabel(type: string) {
  return RELATIONSHIP[type] ?? type.replaceAll("_", " ").toLowerCase()
}

function truncate(label: string, n = 15) {
  return label.length > n ? `${label.slice(0, n - 1)}…` : label
}

function layout(nodes: GraphNode[]) {
  const byLane = LANES.map((lane) => nodes.filter((node) => node.type === lane.type))
  const maxCount = Math.max(1, ...byLane.map((column) => column.length))
  const height = Math.max(320, maxCount * ROW_GAP + 96)

  const positioned: PositionedNode[] = []
  byLane.forEach((column, laneIndex) => {
    const lane = LANES[laneIndex]
    const span = (column.length - 1) * ROW_GAP
    const top = Math.max(58, (height - span) / 2 + 10)
    column.forEach((node, rowIndex) => {
      positioned.push({ ...node, x: lane.x, y: top + rowIndex * ROW_GAP, half: lane.half })
    })
  })
  return { positioned, height }
}

export function GraphWorkbench({ initialGraph, initialAsset }: { initialGraph: KnowledgeGraph | null; initialAsset: string }) {
  const [assetTag, setAssetTag] = useState(initialAsset)
  const initialRequest: RequestState<LoadedGraph> = initialGraph
    ? { status: "success", data: { assetTag: initialAsset, graph: initialGraph }, error: null }
    : idleRequestState<LoadedGraph>()
  const [request, dispatch] = useReducer(requestStateReducer<LoadedGraph>, initialRequest)
  const graph = request.data?.graph ?? null
  const loadedAsset = request.data?.assetTag ?? null
  const [selectedNode, setSelectedNode] = useState<string | null>(
    initialGraph?.nodes.find((node) => node.type === "Asset")?.id ?? null
  )
  const busy = request.status === "loading"

  const { positioned, height, byId } = useMemo(() => {
    const { positioned, height } = layout(graph?.nodes ?? [])
    return { positioned, height, byId: new Map(positioned.map((node) => [node.id, node])) }
  }, [graph])

  async function loadGraph(event: FormEvent) {
    event.preventDefault()
    const tag = assetTag.trim().toUpperCase()
    if (!tag) return
    dispatch({ type: "start" })
    setSelectedNode(null)
    try {
      const next = await getAssetGraph(tag)
      dispatch({ type: "succeed", data: { assetTag: tag, graph: next } })
      setSelectedNode(next.nodes.find((node) => node.type === "Asset")?.id ?? null)
    } catch (caught) {
      dispatch({
        type: "fail",
        error: caught instanceof Error ? caught.message : "The graph could not be loaded.",
      })
    }
  }

  const connectedEdges = graph?.edges.filter(
    (edge) => edge.source === selectedNode || edge.target === selectedNode
  ) ?? []
  const neighborIds = new Set<string>()
  connectedEdges.forEach((edge) => {
    neighborIds.add(edge.source)
    neighborIds.add(edge.target)
  })

  const laneCount = (type: string) => positioned.filter((node) => node.type === type).length
  const selectedLabel = selectedNode ? byId.get(selectedNode)?.label ?? selectedNode : null

  function neighborOf(edge: GraphEdge) {
    const otherId = edge.source === selectedNode ? edge.target : edge.source
    return byId.get(otherId)?.label ?? otherId
  }

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent>
          <form onSubmit={loadGraph}>
            <Field>
              <FieldLabel htmlFor="graph-asset">Show connections for</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <InputGroup>
                  <InputGroupAddon><SearchIcon /></InputGroupAddon>
                  <InputGroupInput
                    id="graph-asset"
                    value={assetTag}
                    onChange={(event) => setAssetTag(event.target.value.toUpperCase())}
                    placeholder="P-204A"
                  />
                </InputGroup>
                <Button type="submit" disabled={!assetTag.trim() || busy}>
                  {busy ? <Spinner data-icon="inline-start" /> : <GitBranchIcon data-icon="inline-start" />}
                  Show map
                </Button>
              </div>
              <FieldDescription>Click any card to trace just its connections.</FieldDescription>
              {request.error ? <p className="text-sm text-destructive">{request.error}</p> : null}
            </Field>
          </form>
        </CardContent>
      </Card>

      {graph ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Card>
            <CardHeader>
              <CardTitle>Connections map</CardTitle>
              <CardDescription>How {loadedAsset} links to its documents, failure modes, and parts. Click a card to trace it.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-sm border bg-background">
                <svg
                  viewBox={`0 0 ${VIEW_W} ${height}`}
                  role="img"
                  aria-label={`Connections for ${loadedAsset}`}
                  className="min-w-[680px] w-full"
                  style={{ height: Math.min(height, 560) }}
                >
                  {/* lane headers */}
                  {LANES.map((lane) => (
                    <text
                      key={lane.type}
                      x={lane.x}
                      y={26}
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize="10"
                      letterSpacing="0.12em"
                      style={{ textTransform: "uppercase", fontFamily: "var(--font-geist-mono, ui-monospace, monospace)" }}
                    >
                      {lane.label}{lane.type !== "Asset" ? ` (${laneCount(lane.type)})` : ""}
                    </text>
                  ))}

                  {/* edges (drawn behind cards) */}
                  {graph.edges.map((edge, index) => {
                    const source = byId.get(edge.source)
                    const target = byId.get(edge.target)
                    if (!source || !target) return null
                    // always draw left-to-right: the source lane sits left of the target lane
                    const forward = (LANE_INDEX.get(source.type) ?? 0) <= (LANE_INDEX.get(target.type) ?? 0)
                    const a = forward ? source : target
                    const b = forward ? target : source
                    const sx = a.x + a.half
                    const tx = b.x - b.half
                    const mx = (sx + tx) / 2
                    const active = edge.source === selectedNode || edge.target === selectedNode
                    return (
                      <path
                        key={`${edge.source}-${edge.type}-${edge.target}-${index}`}
                        d={`M ${sx} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${tx} ${b.y}`}
                        fill="none"
                        stroke={active ? "var(--primary)" : "var(--border)"}
                        strokeWidth={active ? 1.6 : 1}
                        opacity={active ? 0.9 : 0.14}
                      />
                    )
                  })}

                  {/* nodes */}
                  {positioned.map((node) => {
                    const isSelected = node.id === selectedNode
                    const isNeighbor = neighborIds.has(node.id)
                    const dim = selectedNode && !isSelected && !isNeighbor
                    const w = node.half * 2
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x} ${node.y})`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${node.type}: ${node.label}`}
                        onClick={() => setSelectedNode(node.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") setSelectedNode(node.id)
                        }}
                        className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-[var(--ring)]"
                        opacity={dim ? 0.32 : 1}
                      >
                        <title>{node.label}</title>
                        <rect
                          x={-node.half}
                          y={-14}
                          width={w}
                          height={28}
                          rx="3"
                          fill={isSelected ? "var(--primary)" : "var(--card)"}
                          stroke={isSelected ? "var(--primary)" : isNeighbor ? "var(--primary)" : "var(--border)"}
                          strokeWidth={isSelected ? 2 : 1.4}
                        />
                        <text
                          textAnchor="middle"
                          y="4"
                          fill={isSelected ? "var(--primary-foreground)" : "var(--foreground)"}
                          fontSize="11"
                          fontWeight={node.type === "Asset" ? 700 : 500}
                          style={{ fontFamily: node.type === "Document" ? "var(--font-geist-mono, ui-monospace, monospace)" : "inherit" }}
                        >
                          {truncate(node.label)}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
              <p className="mt-3 font-mono text-[0.62rem] text-muted-foreground">
                Highlighted lines show what connects to the selected card — the multi-hop trail the copilot follows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selectedLabel ? truncate(selectedLabel, 28) : "Nothing selected"}</CardTitle>
              <CardDescription>
                {selectedNode
                  ? `${connectedEdges.length} connection${connectedEdges.length === 1 ? "" : "s"}`
                  : "Click a card to see its connections"}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0">
              <ScrollArea className="h-[30rem] pr-3">
                <div className="flex flex-col gap-3">
                  {connectedEdges.map((edge, index) => (
                    <button
                      key={`${edge.source}-${edge.type}-${index}`}
                      type="button"
                      onClick={() => {
                        const otherId = edge.source === selectedNode ? edge.target : edge.source
                        setSelectedNode(otherId)
                      }}
                      className="w-full text-left"
                    >
                      <div className="py-2">
                        <p className="technical-label">{relationshipLabel(edge.type)}</p>
                        <p className="mt-1.5 text-sm font-medium hover:text-primary">{neighborOf(edge)}</p>
                        {edge.confidence != null ? (
                          <Badge variant="outline" className="mt-2">{percent(edge.confidence)} sure</Badge>
                        ) : null}
                      </div>
                      {index < connectedEdges.length - 1 ? <Separator /> : null}
                    </button>
                  ))}
                  {!connectedEdges.length ? <p className="text-sm text-muted-foreground">Nothing connected to this item.</p> : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Empty className="min-h-[30rem] border">
          <EmptyHeader>
            <EmptyMedia variant="icon">{busy ? <Spinner /> : <GitBranchIcon />}</EmptyMedia>
            <EmptyTitle>{busy ? `Loading ${assetTag.trim().toUpperCase()}…` : "No map yet"}</EmptyTitle>
            <EmptyDescription>
              {busy
                ? "Building the connections map…"
                : "Enter a piece of equipment above to see how it connects to everything else."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
