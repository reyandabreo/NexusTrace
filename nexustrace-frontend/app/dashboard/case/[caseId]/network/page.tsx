"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNetworkGraph } from "@/hooks/useCases";
import { Network } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GraphNode, GraphEdge } from "@/types/graph";

const nodeColors: Record<string, string> = {
  // Entity types (from properties.type)
  PERSON: "#3b82f6",
  ORG: "#a855f7",
  GPE: "#22c55e", // Geopolitical entity (location)
  DATE: "#f59e0b",
  EMAIL: "#06b6d4",
  PHONE: "#ec4899",
  // Node types (from type field)
  Case: "#ef4444",
  Evidence: "#8b5cf6",
  Entity: "#64748b",
  default: "#8b8fa3",
};

function toFlowNodes(graphNodes: GraphNode[]): Node[] {
  return graphNodes.map((n, i) => {
    // For Entity nodes, use the entity type from properties
    const nodeType = n.type === "Entity" && n.properties?.type 
      ? n.properties.type 
      : n.type;
    
    return {
      id: n.id,
      position: {
        x: 200 + Math.cos((i * 2 * Math.PI) / graphNodes.length) * 300,
        y: 200 + Math.sin((i * 2 * Math.PI) / graphNodes.length) * 300,
      },
      data: { label: n.label },
      style: {
        background: nodeColors[nodeType] || nodeColors.default,
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        padding: "8px 16px",
        fontSize: "12px",
        fontWeight: 600,
      },
    };
  });
}

function toFlowEdges(graphEdges: GraphEdge[]): Edge[] {
  return graphEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    style: { stroke: "#1f2335", strokeWidth: 2 },
    labelStyle: { fill: "#8b8fa3", fontSize: 10 },
  }));
}

export default function NetworkPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: graph, isLoading } = useNetworkGraph(caseId);

  const initialNodes = useMemo(
    () => (graph?.nodes ? toFlowNodes(graph.nodes) : []),
    [graph]
  );
  const initialEdges = useMemo(
    () => (graph?.edges ? toFlowEdges(graph.edges) : []),
    [graph]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-150 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Network className="h-6 w-6 text-primary" />
          Network Graph
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Interactive visualization of entity relationships
        </p>
      </div>

      {initialNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <Network className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            No graph data yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Process evidence to build the network graph
          </p>
        </div>
      ) : (
        <div className="h-150 rounded-2xl border border-border bg-card overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1f2335" gap={20} />
            <Controls
              style={{
                background: "#111318",
                border: "1px solid #1f2335",
                borderRadius: "12px",
              }}
            />
            <MiniMap
              style={{
                background: "#0b0d14",
                border: "1px solid #1f2335",
                borderRadius: "12px",
              }}
              nodeColor={(node) => (node.style?.background as string) || "#3b82f6"}
            />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
