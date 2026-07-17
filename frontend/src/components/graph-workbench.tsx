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
import type { GraphNode, KnowledgeGraph } from "@/lib/api/types"
import { percent, titleCase } from "@/lib/format"
import { idleRequestState, requestStateReducer, type RequestState } from "@/lib/request-state"

type PositionedNode = GraphNode & { x: number; y: number }
type LoadedGraph = { assetTag: string; graph: KnowledgeGraph }

function positionNodes(nodes: GraphNode[]): PositionedNode[] {
  const centerX = 400
  const centerY = 230
  const radiusX = 285
  const radiusY = 155
  return nodes.map((node) => {
    if (node.type === "Asset") return { ...node, x: centerX, y: centerY }
    const nonAssetCount = Math.max(1, nodes.filter((item) => item.type !== "Asset").length)
    const nonAssetIndex = nodes.filter((item) => item.type !== "Asset").findIndex((item) => item.id === node.id)
    const angle = (Math.PI * 2 * nonAssetIndex) / nonAssetCount - Math.PI / 2
    return {
      ...node,
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    }
  })
}

export function GraphWorkbench({ initialGraph, initialAsset }: { initialGraph: KnowledgeGraph | null; initialAsset: string }) {
  const [assetTag, setAssetTag] = useState(initialAsset)
  const initialRequest: RequestState<LoadedGraph> = initialGraph
    ? {
        status: "success",
        data: { assetTag: initialAsset, graph: initialGraph },
        error: null,
      }
    : idleRequestState<LoadedGraph>()
  const [request, dispatch] = useReducer(
    requestStateReducer<LoadedGraph>,
    initialRequest
  )
  const graph = request.data?.graph ?? null
  const loadedAsset = request.data?.assetTag ?? null
  const [selectedNode, setSelectedNode] = useState<string | null>(
    initialGraph?.nodes.find((node) => node.type === "Asset")?.id ?? null
  )
  const busy = request.status === "loading"
  const nodes = useMemo(() => positionNodes(graph?.nodes ?? []), [graph])
  const positions = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])

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
        error:
          caught instanceof Error
            ? caught.message
            : "The graph could not be loaded.",
      })
    }
  }

  const connectedEdges = graph?.edges.filter(
    (edge) => edge.source === selectedNode || edge.target === selectedNode
  ) ?? []

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent>
          <form onSubmit={loadGraph}>
            <Field>
              <FieldLabel htmlFor="graph-asset">Asset graph</FieldLabel>
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
                  Load graph
                </Button>
              </div>
              <FieldDescription>Click a node to isolate its evidence-backed relationships.</FieldDescription>
              {request.error ? <p className="text-sm text-destructive">{request.error}</p> : null}
            </Field>
          </form>
        </CardContent>
      </Card>

      {graph ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Card>
            <CardHeader>
              <CardTitle>Relationship canvas</CardTitle>
              <CardDescription>{graph.nodes.length} nodes · {graph.edges.length} provenance-scored edges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-sm border bg-background">
                <svg viewBox="0 0 800 460" role="img" aria-label={`Knowledge graph for ${loadedAsset}`} className="h-auto min-h-[24rem] w-full">
                  <defs>
                    <marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-foreground)" />
                    </marker>
                  </defs>
                  {graph.edges.map((edge) => {
                    const source = positions.get(edge.source)
                    const target = positions.get(edge.target)
                    if (!source || !target) return null
                    const active = !selectedNode || edge.source === selectedNode || edge.target === selectedNode
                    const midX = (source.x + target.x) / 2
                    const midY = (source.y + target.y) / 2
                    return (
                      <g key={`${edge.source}-${edge.type}-${edge.target}`} opacity={active ? 1 : 0.18}>
                        <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="var(--muted-foreground)" strokeWidth={active ? 1.5 : 1} markerEnd="url(#graph-arrow)" />
                        <text x={midX} y={midY - 7} textAnchor="middle" fill="var(--muted-foreground)" fontSize="9" fontFamily="var(--font-geist-mono)">
                          {edge.type.replaceAll("_", " ")}
                        </text>
                      </g>
                    )
                  })}
                  {nodes.map((node) => {
                    const active = selectedNode === node.id
                    const connected = !selectedNode || active || connectedEdges.some((edge) => edge.source === node.id || edge.target === node.id)
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
                        className="cursor-pointer outline-none focus:[&>rect]:stroke-[var(--ring)]"
                        opacity={connected ? 1 : 0.35}
                      >
                        <rect
                          x={node.type === "Asset" ? -52 : -45}
                          y={node.type === "Asset" ? -30 : -26}
                          width={node.type === "Asset" ? 104 : 90}
                          height={node.type === "Asset" ? 60 : 52}
                          rx="2"
                          fill={active ? "var(--primary)" : "var(--card)"}
                          stroke={active ? "var(--primary)" : "var(--border)"}
                          strokeWidth={active ? 3 : 2}
                        />
                        <text textAnchor="middle" y="-3" fill={active ? "var(--primary-foreground)" : "var(--foreground)"} fontSize="12" fontWeight="650">{node.label}</text>
                        <text textAnchor="middle" y="15" fill={active ? "var(--primary-foreground)" : "var(--muted-foreground)"} fontSize="8" fontFamily="var(--font-geist-mono)">{node.type.toUpperCase()}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected node</CardTitle>
              <CardDescription>{selectedNode ?? "Choose a node"}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-0">
              <ScrollArea className="h-[30rem] pr-3">
                <div className="flex flex-col gap-3">
                  {connectedEdges.map((edge, index) => (
                    <div key={`${edge.source}-${edge.type}-${index}`}>
                      <div className="py-2">
                        <Badge variant="outline">{percent(edge.confidence)} confidence</Badge>
                        <p className="mt-2 text-sm font-medium">{titleCase(edge.type)}</p>
                        <p className="mt-1 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">{edge.source} → {edge.target}</p>
                      </div>
                      {index < connectedEdges.length - 1 ? <Separator /> : null}
                    </div>
                  ))}
                  {!connectedEdges.length ? <p className="text-sm text-muted-foreground">No connected edges returned for this node.</p> : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Empty className="min-h-[30rem] border">
          <EmptyHeader>
            <EmptyMedia variant="icon">{busy ? <Spinner /> : <GitBranchIcon />}</EmptyMedia>
            <EmptyTitle>{busy ? `Loading ${assetTag.trim().toUpperCase()}` : "No graph loaded"}</EmptyTitle>
            <EmptyDescription>
              {busy
                ? "The previous graph has been cleared while this asset is retrieved."
                : "Start the backend or enter an asset tag with graph data."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
