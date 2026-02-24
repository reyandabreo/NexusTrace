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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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

// Hierarchical tree layout for mindmap
function calculateTreeLayout(
  node: MindmapNode,
  level: number = 0,
  parentX: number = 0,
  parentY: number = 0,
  siblingIndex: number = 0,
  totalSiblings: number = 1,
  nodes: Node[] = [],
  edges: Edge[] = []
): { nodes: Node[]; edges: Edge[] } {
  const horizontalSpacing = 280;
  const verticalSpacing = 150;
  const rootX = 500;
  const rootY = 100;

  let x: number;
  let y: number;

  if (level === 0) {
    // Root node at the top center
    x = rootX;
    y = rootY;
  } else {
    // Calculate position based on level and sibling index
    y = rootY + level * verticalSpacing;
    
    // Spread children horizontally
    const totalWidth = (totalSiblings - 1) * horizontalSpacing;
    const startX = parentX - totalWidth / 2;
    x = startX + siblingIndex * horizontalSpacing;
  }

  // Add node with appropriate color based on level
  const nodeColor = 
    level === 0 ? nodeColors.root :
    level === 1 ? nodeColors.level1 :
    level === 2 ? nodeColors.level2 :
    level === 3 ? nodeColors.level3 :
    nodeColors.default;

  nodes.push({
    id: node.id,
    position: { x, y },
    data: { label: node.label },
    style: {
      background: nodeColor,
      color: "#fff",
      border: "2px solid rgba(255, 255, 255, 0.2)",
      borderRadius: level === 0 ? "50%" : "16px",
      padding: level === 0 ? "24px" : "12px 20px",
      fontSize: level === 0 ? "14px" : "12px",
      fontWeight: level === 0 ? 700 : 600,
      minWidth: level === 0 ? "120px" : "100px",
      minHeight: level === 0 ? "120px" : "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center" as const,
      boxShadow: level === 0 
        ? "0 8px 24px rgba(139, 92, 246, 0.4)" 
        : "0 4px 12px rgba(0, 0, 0, 0.3)",
    },
  });

  // Add edge to parent if not root
  if (level > 0) {
    edges.push({
      id: `edge-${node.id}`,
      source: String(parentX), // We'll fix this with proper parent ID tracking
      target: node.id,
      animated: true,
      style: { 
        stroke: nodeColor, 
        strokeWidth: 2,
      },
      type: "smoothstep",
    });
  }

  // Process children
  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      calculateTreeLayout(
        child,
        level + 1,
        x,
        y,
        index,
        node.children!.length,
        nodes,
        edges
      );
    });
  }

  return { nodes, edges };
}

// Better tree layout with proper parent tracking and dynamic spacing
function buildMindmapTree(
  node: MindmapNode,
  level: number = 0,
  parentId: string | null = null,
  siblingIndex: number = 0,
  totalSiblings: number = 1,
  parentX: number = 500,
  parentY: number = 100
): { nodes: Node[]; edges: Edge[] } {
  // Much more aggressive spacing to prevent overlap completely
  const baseHorizontalSpacing = 450; // Massively increased from 350
  
  // Calculate spacing based on siblings - exponential scaling for many nodes
  let horizontalSpacing = baseHorizontalSpacing;
  if (totalSiblings > 15) {
    horizontalSpacing = baseHorizontalSpacing + (totalSiblings - 15) * 60;
  } else if (totalSiblings > 10) {
    horizontalSpacing = baseHorizontalSpacing + (totalSiblings - 10) * 50;
  } else if (totalSiblings > 5) {
    horizontalSpacing = baseHorizontalSpacing + (totalSiblings - 5) * 40;
  } else if (totalSiblings > 2) {
    horizontalSpacing = baseHorizontalSpacing + (totalSiblings - 2) * 30;
  }
  
  const verticalSpacing = 250; // Increased from 200
  const rootX = 500;
  const rootY = 100;

  let x: number;
  let y: number;

  if (level === 0) {
    x = rootX;
    y = rootY;
  } else {
    y = parentY + verticalSpacing;
    // Calculate total width needed for all siblings with extra padding
    const totalWidth = (totalSiblings - 1) * horizontalSpacing;
    const startX = parentX - totalWidth / 2;
    x = startX + siblingIndex * horizontalSpacing;
  }

  const nodeColor = 
    level === 0 ? nodeColors.root :
    level === 1 ? nodeColors.level1 :
    level === 2 ? nodeColors.level2 :
    level === 3 ? nodeColors.level3 :
    nodeColors.default;

  // Calculate node width - keep nodes more compact
  const labelLength = node.label?.length || 10;
  const minWidth = level === 0 ? 140 : Math.max(80, Math.min(labelLength * 6, 200));

  const currentNode: Node = {
    id: node.id,
    position: { x, y },
    data: { label: node.label },
    style: {
      background: nodeColor,
      color: "#fff",
      border: "2px solid rgba(255, 255, 255, 0.2)",
      borderRadius: level === 0 ? "50%" : "10px",
      padding: level === 0 ? "28px" : "10px 16px",
      fontSize: level === 0 ? "14px" : "10px",
      fontWeight: level === 0 ? 700 : 600,
      minWidth: `${minWidth}px`,
      maxWidth: level === 0 ? "140px" : "200px",
      minHeight: level === 0 ? "140px" : "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center" as const,
      boxShadow: level === 0 
        ? "0 8px 24px rgba(139, 92, 246, 0.4)" 
        : "0 4px 12px rgba(0, 0, 0, 0.3)",
      wordBreak: "break-word" as const,
      whiteSpace: "normal" as const,
      overflow: "hidden" as const,
    },
  };

  const nodes: Node[] = [currentNode];
  const edges: Edge[] = [];

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
    node.children.forEach((child, index) => {
      const childResult = buildMindmapTree(
        child,
        level + 1,
        node.id,
        index,
        node.children!.length,
        x,
        y
      );
      nodes.push(...childResult.nodes);
      edges.push(...childResult.edges);
    });
  }

  return { nodes, edges };
}

// Collision detection and resolution to prevent node overlap
function resolveOverlaps(nodes: Node[]): Node[] {
  const resolvedNodes = [...nodes];
  const minDistance = 100; // Increased from 50px - much larger buffer between nodes
  const maxIterations = 5; // Multiple passes to ensure all overlaps are resolved
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let adjustmentMade = false;
    
    // Group nodes by y position (level)
    const levels = new Map<number, Node[]>();
    resolvedNodes.forEach(node => {
      const y = Math.round(node.position.y / 50) * 50; // Group by 50px tolerance
      if (!levels.has(y)) {
        levels.set(y, []);
      }
      levels.get(y)!.push(node);
    });
    
    // Resolve overlaps within each level
    levels.forEach((levelNodes) => {
      // Sort by x position
      levelNodes.sort((a, b) => a.position.x - b.position.x);
      
      // Check for overlaps and adjust positions
      for (let i = 0; i < levelNodes.length - 1; i++) {
        const current = levelNodes[i];
        const next = levelNodes[i + 1];
        
        // Calculate actual node widths from style
        const currentWidth = parseInt(current.style?.maxWidth as string || "200") || 200;
        const nextWidth = parseInt(next.style?.maxWidth as string || "200") || 200;
        
        // Add padding to account for actual rendered size
        const currentRight = current.position.x + (currentWidth / 2) + 30; // +30px padding
        const nextLeft = next.position.x - (nextWidth / 2) - 30; // -30px padding
        const gap = nextLeft - currentRight;
        
        // If nodes overlap or are too close
        if (gap < minDistance) {
          const adjustment = (minDistance - gap + 20) / 2; // Add extra 20px buffer
          // Move current left and next right
          current.position.x -= adjustment;
          next.position.x += adjustment;
          adjustmentMade = true;
        }
      }
    });
    
    // If no adjustments were made in this iteration, we're done
    if (!adjustmentMade) {
      break;
    }
  }
  
  return resolvedNodes;
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
    
    const { nodes, edges } = buildMindmapTree(mindmapData.root);
    
    // Apply collision detection and resolution to prevent overlaps
    const resolvedNodes = resolveOverlaps(nodes);
    
    return { initialNodes: resolvedNodes, initialEdges: edges };
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
