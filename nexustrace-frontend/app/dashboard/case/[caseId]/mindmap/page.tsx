"use client";

import { useParams } from "next/navigation";
import { useMemo, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  useReactFlow,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { useMindmap } from "@/hooks/useCases";
import { BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { MindmapNode } from "@/types/graph";

const nodeColors: Record<string, string> = {
  root: "#8b5cf6", // Purple for root case node
  level1: "#06b6d4", // Cyan for first level
  level2: "#f59e0b", // Amber for second level  
  level3: "#ec4899", // Pink for third level
  default: "#64748b", // Slate for deeper levels
};

const DAGRE_RANK_SEP = 200;
const DAGRE_NODE_SEP = 110;

function estimateNodeSize(label: string, level: number) {
  const width = level === 0 ? 180 : Math.max(130, Math.min(label.length * 7, 240));
  const lineCount = Math.max(1, Math.ceil(label.length / 18));
  const height = level === 0 ? 150 : Math.max(60, 36 + lineCount * 14);
  return { width, height };
}

function buildMindmapGraph(
  node: MindmapNode,
  level: number = 0,
  parentId: string | null = null,
  nodes: Node[] = [],
  edges: Edge[] = [],
  sizes: Map<string, { width: number; height: number }> = new Map()
): { nodes: Node[]; edges: Edge[]; sizes: Map<string, { width: number; height: number }> } {
  const nodeColor =
    level === 0
      ? nodeColors.root
      : level === 1
      ? nodeColors.level1
      : level === 2
      ? nodeColors.level2
      : level === 3
      ? nodeColors.level3
      : nodeColors.default;

  const size = estimateNodeSize(node.label, level);
  sizes.set(node.id, size);

  nodes.push({
    id: node.id,
    position: { x: 0, y: 0 },
    data: { label: node.label },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: {
      background: nodeColor,
      color: "#fff",
      border: "2px solid rgba(255, 255, 255, 0.2)",
      borderRadius: level === 0 ? "50%" : "10px",
      padding: level === 0 ? "28px" : "10px 16px",
      fontSize: level === 0 ? "14px" : "10px",
      fontWeight: level === 0 ? 700 : 600,
      minWidth: `${size.width}px`,
      minHeight: `${size.height}px`,
      maxWidth: level === 0 ? "180px" : "240px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center" as const,
      boxShadow:
        level === 0
          ? "0 8px 24px rgba(139, 92, 246, 0.4)"
          : "0 4px 12px rgba(0, 0, 0, 0.3)",
      wordBreak: "break-word" as const,
      whiteSpace: "normal" as const,
      overflow: "hidden" as const,
    },
  });

  if (parentId) {
    edges.push({
      id: `edge-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      animated: true,
      style: {
        stroke: nodeColor,
        strokeWidth: 2.5,
      },
      type: "smoothstep",
    });
  }

  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      buildMindmapGraph(child, level + 1, node.id, nodes, edges, sizes);
    });
  }

  return { nodes, edges, sizes };
}

function applyVerticalLayout(
  nodes: Node[],
  edges: Edge[],
  sizes: Map<string, { width: number; height: number }>
): { nodes: Node[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    ranksep: DAGRE_RANK_SEP,
    nodesep: DAGRE_NODE_SEP,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    const size = sizes.get(node.id) || { width: 160, height: 80 };
    graph.setNode(node.id, size);
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const size = sizes.get(node.id) || { width: 160, height: 80 };
    const position = graph.node(node.id) || { x: 0, y: 0 };
    return {
      ...node,
      position: {
        x: position.x - size.width / 2,
        y: position.y - size.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Inner component that uses useReactFlow
function MindmapView({
  initialNodes,
  initialEdges,
}: {
  initialNodes: Node[];
  initialEdges: Edge[];
}) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      // Delay fitView to ensure nodes are rendered
      setTimeout(() => {
        fitView({ 
          padding: 0.5,  // Even more padding to ensure all nodes are visible
          duration: 1200,
          minZoom: 0.15,  // Can zoom out much more to see wide layouts
          maxZoom: 0.8,   // Don't zoom in too much to keep nodes spaced
        });
      }, 250);  // Longer delay for rendering
    }
  }, [initialNodes, setNodes, fitView]);

  useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      fitViewOptions={{
        padding: 0.5,
        minZoom: 0.15,
        maxZoom: 0.8,
      }}
      minZoom={0.05}  // Can zoom way out for large graphs
      maxZoom={1.2}   // Limited max zoom to prevent seeing overlaps
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: true,
      }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      zoomOnScroll={true}
      zoomOnPinch={true}
      panOnScroll={false}
      panOnDrag={true}
      preventScrolling={true}
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
        nodeColor={(node) => (node.style?.background as string) || "#8b5cf6"}
      />
    </ReactFlow>
  );
}

export default function MindmapPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: mindmapData, isLoading } = useMindmap(caseId);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!mindmapData?.root) return { initialNodes: [], initialEdges: [] };

    const { nodes, edges, sizes } = buildMindmapGraph(mindmapData.root);
    const layouted = applyVerticalLayout(nodes, edges, sizes);

    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [mindmapData]);

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
          <BrainCircuit className="h-6 w-6 text-primary" />
          Case Mindmap
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hierarchical visualization of case entities and relationships
        </p>
      </div>

      {initialNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <BrainCircuit className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            No mindmap data yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Process evidence to generate the mindmap
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 250px)", minHeight: "600px" }}>
          <ReactFlowProvider>
            <MindmapView initialNodes={initialNodes} initialEdges={initialEdges} />
          </ReactFlowProvider>
        </div>
      )}
    </div>
  );
}
