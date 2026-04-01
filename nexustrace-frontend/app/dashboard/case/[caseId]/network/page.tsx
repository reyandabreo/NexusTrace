"use client";

import { useParams } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
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
import { useNetworkGraph, useNetworkRelations } from "@/hooks/useCases";
import { Network } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { GraphNode, GraphEdge, RelationTypeCount } from "@/types/graph";

const DEFAULT_RELATIONS = ["HAS_EVIDENCE", "MENTIONS"] as const;

const relationLabels: Record<string, string> = {
  HAS_EVIDENCE: "Case to Evidence",
  HAS_ENTITY: "Case to Entity",
  HAS_CHUNK: "Evidence to Chunk",
  MENTIONS: "Mentions",
  CO_OCCURS: "Co-occurs",
};

const relationOrder = [
  "HAS_EVIDENCE",
  "MENTIONS",
  "CO_OCCURS",
  "HAS_ENTITY",
  "HAS_CHUNK",
];

const CO_OCCURS_LEVELS = [
  { id: "compact", label: "Compact (50/100)", maxEntities: 50, maxEdges: 100 },
  { id: "standard", label: "Standard (100/250)", maxEntities: 100, maxEdges: 250 },
  { id: "expanded", label: "Expanded (180/450)", maxEntities: 180, maxEdges: 450 },
];

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
  Chunk: "#0ea5e9",
  default: "#8b8fa3",
};

const edgeColors: Record<string, string> = {
  HAS_EVIDENCE: "#8b5cf6",
  HAS_ENTITY: "#f59e0b",
  HAS_CHUNK: "#0ea5e9",
  MENTIONS: "#22c55e",
  CO_OCCURS: "#06b6d4",
  default: "#1f2335",
};

function formatRelationLabel(relation: string) {
  if (relationLabels[relation]) {
    return relationLabels[relation];
  }
  return relation
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

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
    style: {
      stroke: edgeColors[e.label] || edgeColors.default,
      strokeWidth: e.label === "CO_OCCURS" ? 2.5 : 2,
    },
    labelStyle: { fill: edgeColors[e.label] || "#8b8fa3", fontSize: 10 },
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
      // Fit view after a short delay to ensure nodes are rendered with generous padding
      setTimeout(() => {
        fitView({ 
          padding: 0.5,  // Much more padding to see entire graph
          duration: 1000,
          minZoom: 0.1,   // Allow zooming out very far
          maxZoom: 1.5,   // Allow zooming in reasonably
        });
      }, 150);
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
      fitViewOptions={{
        padding: 0.5,
        minZoom: 0.1,
        maxZoom: 1.5,
      }}
      minZoom={0.05}   // Can zoom out extremely far to see huge graphs
      maxZoom={2}      // Can zoom in for details
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
        nodeColor={(node) => (node.style?.background as string) || "#3b82f6"}
      />
    </ReactFlow>
  );
}

export default function NetworkPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: relationOptions, isLoading: relationsLoading } = useNetworkRelations(caseId);
  const [selectedRelations, setSelectedRelations] = useState<string[]>([...DEFAULT_RELATIONS]);
  const [coOccursLevel, setCoOccursLevel] = useState(CO_OCCURS_LEVELS[0].id);

  const coOccursLimits = useMemo(() => {
    return CO_OCCURS_LEVELS.find((level) => level.id === coOccursLevel) || CO_OCCURS_LEVELS[0];
  }, [coOccursLevel]);

  const activeCoOccursLimits = useMemo(
    () => (selectedRelations.includes("CO_OCCURS") ? coOccursLimits : undefined),
    [selectedRelations, coOccursLimits]
  );

  const { data: graph, isLoading } = useNetworkGraph(
    caseId,
    selectedRelations,
    activeCoOccursLimits
  );

  const orderedRelations = useMemo(() => {
    if (!relationOptions?.length) return [] as RelationTypeCount[];
    const orderMap = new Map(relationOrder.map((rel, index) => [rel, index]));
    return [...relationOptions].sort((a, b) => {
      const aOrder = orderMap.has(a.type) ? orderMap.get(a.type)! : 999;
      const bOrder = orderMap.has(b.type) ? orderMap.get(b.type)! : 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.count - a.count;
    });
  }, [relationOptions]);

  const defaultSelection = useMemo(() => {
    if (!relationOptions?.length) return [...DEFAULT_RELATIONS];
    const available = new Set(relationOptions.map((rel) => rel.type));
    const defaults = DEFAULT_RELATIONS.filter((rel) => available.has(rel));
    if (defaults.length) return defaults;
    return relationOptions.slice(0, 2).map((rel) => rel.type);
  }, [relationOptions]);

  useEffect(() => {
    if (!relationOptions?.length) return;
    const available = new Set(relationOptions.map((rel) => rel.type));
    const filtered = selectedRelations.filter((rel) => available.has(rel));
    if (filtered.length === 0) {
      setSelectedRelations(defaultSelection);
      return;
    }
    if (filtered.length !== selectedRelations.length) {
      setSelectedRelations(filtered);
    }
  }, [relationOptions, selectedRelations, defaultSelection]);

  const toggleRelation = (relation: string) => {
    setSelectedRelations((prev) => {
      if (prev.includes(relation)) {
        return prev.length > 1 ? prev.filter((rel) => rel !== relation) : prev;
      }
      return [...prev, relation];
    });
  };

  const selectAllRelations = () => {
    if (!relationOptions?.length) return;
    setSelectedRelations(relationOptions.map((rel) => rel.type));
  };

  const resetRelations = () => {
    setSelectedRelations(defaultSelection);
  };

  const initialNodes = useMemo(
    () => (graph?.nodes && graph?.edges ? calculateForceLayout(graph.nodes, graph.edges) : []),
    [graph]
  );
  const initialEdges = useMemo(
    () => (graph?.edges ? toFlowEdges(graph.edges) : []),
    [graph]
  );

  const graphStats = useMemo(
    () => ({
      nodes: graph?.nodes?.length || 0,
      edges: graph?.edges?.length || 0,
    }),
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-border text-xs">
            Nodes: {graphStats.nodes}
          </Badge>
          <Badge variant="outline" className="border-border text-xs">
            Edges: {graphStats.edges}
          </Badge>
          <Badge variant="outline" className="border-border text-xs">
            Relations: {selectedRelations.length}
          </Badge>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Relation Filters
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose which Neo4j relationships to render in the graph.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Co-occurs detail</span>
              <Select value={coOccursLevel} onValueChange={setCoOccursLevel}>
                <SelectTrigger size="sm" className="border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CO_OCCURS_LEVELS.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={resetRelations}
              className="border-border"
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={selectAllRelations}
              className="text-muted-foreground"
            >
              Select all
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {relationsLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`relation-skeleton-${index}`} className="h-7 w-28 rounded-full" />
            ))
          ) : orderedRelations.length ? (
            orderedRelations.map((relation) => {
              const isSelected = selectedRelations.includes(relation.type);
              return (
                <Button
                  key={relation.type}
                  variant="outline"
                  size="xs"
                  onClick={() => toggleRelation(relation.type)}
                  aria-pressed={isSelected}
                  className={cn(
                    "h-7 rounded-full border-border px-2 text-[11px]",
                    isSelected
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="font-medium">
                    {formatRelationLabel(relation.type)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-border px-1.5 py-0 text-[9px]",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {relation.count}
                  </Badge>
                </Button>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground">
              No relationships available yet. Upload evidence to build the graph.
            </p>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tip: Add CO_OCCURS to reveal entity-to-entity associations. Higher detail may be slower.
        </p>
      </div>

      {initialNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <Network className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            Nothing to display yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try different relations or process more evidence
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 250px)", minHeight: "700px" }}>
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
