"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useEffect } from "react";
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

// Improved force-directed layout algorithm
function calculateForceLayout(graphNodes: GraphNode[], graphEdges: GraphEdge[]): Node[] {
  const nodeCount = graphNodes.length;
  if (nodeCount === 0) return [];

  // Create adjacency information
  const adjacency = new Map<string, Set<string>>();
  graphEdges.forEach((e) => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, new Set());
    if (!adjacency.has(e.target)) adjacency.set(e.target, new Set());
    adjacency.get(e.source)!.add(e.target);
    adjacency.get(e.target)!.add(e.source);
  });

  // Initialize positions with better spacing
  const radius = Math.max(400, nodeCount * 50);
  const positions = new Map<string, { x: number; y: number }>();
  
  graphNodes.forEach((n, i) => {
    const angle = (i * 2 * Math.PI) / nodeCount;
    positions.set(n.id, {
      x: radius + Math.cos(angle) * radius,
      y: radius + Math.sin(angle) * radius,
    });
  });

  // Force-directed layout iterations
  const iterations = 100;
  const k = Math.sqrt((2 * radius * 2 * radius) / nodeCount); // Optimal distance
  const c = 0.1; // Cooling factor

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { x: number; y: number }>();
    
    // Initialize forces
    graphNodes.forEach((n) => {
      forces.set(n.id, { x: 0, y: 0 });
    });

    // Repulsive forces (all nodes repel each other)
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const n1 = graphNodes[i];
        const n2 = graphNodes[j];
        const pos1 = positions.get(n1.id)!;
        const pos2 = positions.get(n2.id)!;
        
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        const f1 = forces.get(n1.id)!;
        const f2 = forces.get(n2.id)!;
        f1.x += fx;
        f1.y += fy;
        f2.x -= fx;
        f2.y -= fy;
      }
    }

    // Attractive forces (connected nodes attract)
    graphEdges.forEach((edge) => {
      const pos1 = positions.get(edge.source);
      const pos2 = positions.get(edge.target);
      if (!pos1 || !pos2) return;
      
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      const f1 = forces.get(edge.source);
      const f2 = forces.get(edge.target);
      if (f1 && f2) {
        f1.x += fx;
        f1.y += fy;
        f2.x -= fx;
        f2.y -= fy;
      }
    });

    // Apply forces with cooling
    const temp = c * (1 - iter / iterations);
    graphNodes.forEach((n) => {
      const pos = positions.get(n.id)!;
      const force = forces.get(n.id)!;
      const displacement = Math.sqrt(force.x * force.x + force.y * force.y) || 1;
      
      pos.x += (force.x / displacement) * Math.min(displacement, temp * 50);
      pos.y += (force.y / displacement) * Math.min(displacement, temp * 50);
    });
  }

  // Convert to ReactFlow nodes
  return graphNodes.map((n) => {
    const pos = positions.get(n.id)!;
    const nodeType = n.type === "Entity" && n.properties?.type 
      ? n.properties.type 
      : n.type;
    
    return {
      id: n.id,
      position: { x: pos.x, y: pos.y },
      data: { label: n.label },
      style: {
        background: nodeColors[nodeType] || nodeColors.default,
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        padding: "10px 18px",
        fontSize: "12px",
        fontWeight: 600,
        minWidth: "80px",
        textAlign: "center" as const,
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

// Inner component that uses useReactFlow
function NetworkGraphView({ 
  initialNodes, 
  initialEdges 
}: { 
  initialNodes: Node[]; 
  initialEdges: Edge[]; 
}) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when initial nodes change
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      // Fit view after a short delay to ensure nodes are rendered
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [initialNodes, setNodes, fitView]);

  // Update edges when initial edges change
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
  );
}

export default function NetworkPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: graph, isLoading } = useNetworkGraph(caseId);

  const initialNodes = useMemo(
    () => (graph?.nodes && graph?.edges ? calculateForceLayout(graph.nodes, graph.edges) : []),
    [graph]
  );
  const initialEdges = useMemo(
    () => (graph?.edges ? toFlowEdges(graph.edges) : []),
    [graph]
  );

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
          <ReactFlowProvider>
            <NetworkGraphView 
              initialNodes={initialNodes} 
              initialEdges={initialEdges} 
            />
          </ReactFlowProvider>
        </div>
      )}
    </div>
  );
}
