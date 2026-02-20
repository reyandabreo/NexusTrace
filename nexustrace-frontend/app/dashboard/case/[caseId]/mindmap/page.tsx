"use client";

import { useParams } from "next/navigation";
import { useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMindmap } from "@/hooks/useCases";
import { BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { MindmapNode } from "@/types/graph";

// Improved hierarchical layout with better spacing
function flattenMindmap(
  node: MindmapNode,
  x: number = 0,
  y: number = 0,
  level: number = 0,
  nodes: Node[] = [],
  edges: Edge[] = [],
  parentY: number = 0
): { nodes: Node[]; edges: Edge[] } {
  const colors = ["#3b82f6", "#a855f7", "#22c55e", "#f59e0b", "#06b6d4", "#ec4899"];
  const color = colors[level % colors.length];

  // Calculate node dimensions based on level and label length
  const baseWidth = level === 0 ? 140 : 100;
  const labelLength = node.label?.length || 10;
  const nodeWidth = Math.max(baseWidth, labelLength * 8);
  const nodeHeight = level === 0 ? 60 : 50;

  nodes.push({
    id: node.id,
    position: { x, y },
    data: { label: node.label },
    style: {
      background: color,
      color: "#fff",
      border: "none",
      borderRadius: level === 0 ? "16px" : "12px",
      padding: level === 0 ? "14px 20px" : "10px 16px",
      fontSize: level === 0 ? "14px" : "12px",
      fontWeight: level === 0 ? 700 : 500,
      minWidth: `${nodeWidth}px`,
      textAlign: "center" as const,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap" as const,
    },
  });

  if (node.children && node.children.length > 0) {
    // Improved spacing calculations
    const horizontalSpacing = 280; // Increased from 250
    const baseVerticalSpacing = 120; // Increased from 100
    
    // Adapt vertical spacing based on number of children
    const verticalSpacing = node.children.length > 5 
      ? baseVerticalSpacing + (node.children.length * 5) 
      : baseVerticalSpacing;
    
    const totalHeight = (node.children.length - 1) * verticalSpacing;
    const startY = y - totalHeight / 2;

    node.children.forEach((child, i) => {
      const childY = startY + i * verticalSpacing;
      const childX = x + horizontalSpacing;

      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        style: { 
          stroke: "#1f2335", 
          strokeWidth: level === 0 ? 3 : 2,
        },
        animated: false,
        type: "smoothstep", // Smooth step edges look better in mindmaps
      });

      flattenMindmap(child, childX, childY, level + 1, nodes, edges, y);
    });
  }

  return { nodes, edges };
}

export default function MindmapPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: mindmapData, isLoading } = useMindmap(caseId);
  const { fitView } = useReactFlow();

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!mindmapData?.root) return { flowNodes: [], flowEdges: [] };
    const { nodes, edges } = flattenMindmap(mindmapData.root, 100, window.innerHeight / 2);
    return { flowNodes: nodes, flowEdges: edges };
  }, [mindmapData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Update nodes when flowNodes change
  useEffect(() => {
    if (flowNodes.length > 0) {
      setNodes(flowNodes);
      // Fit view after a short delay to ensure nodes are rendered
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [flowNodes, setNodes, fitView]);

  // Update edges when flowEdges change
  useEffect(() => {
    if (flowEdges.length > 0) {
      setEdges(flowEdges);
    }
  }, [flowEdges, setEdges]);

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
          Investigation Mindmap
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hierarchical breakdown of case intelligence
        </p>
      </div>

      {flowNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <BrainCircuit className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            No mindmap data yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Process evidence to generate the investigation mindmap
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
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
