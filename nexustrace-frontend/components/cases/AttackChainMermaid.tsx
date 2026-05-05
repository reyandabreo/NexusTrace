"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAttackChain } from "@/hooks/useCases";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttackChainFlowStep } from "@/types/graph";

type Tone = "critical" | "warning" | "info" | "neutral";

type StepNodeData = {
  index: number;
  title: string;
  timeWindow: string;
  summary: string;
  stageCount: number;
  eventCount: number;
  tone: Tone;
};

type StageNodeData = {
  stage: string;
};

type EvidenceNodeData = {
  count: number;
};

type DiagramDensity = "compact" | "comfortable";

const toneClasses: Record<Tone, { border: string; pill: string; heading: string }> = {
  critical: {
    border: "border-[#dc2626]/30",
    pill: "border-[#dc2626]/30 bg-[#dc2626]/10 text-[#dc2626]",
    heading: "text-[#dc2626]",
  },
  warning: {
    border: "border-[#f59e0b]/30",
    pill: "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]",
    heading: "text-[#f59e0b]",
  },
  info: {
    border: "border-primary/30",
    pill: "border-primary/30 bg-primary/10 text-primary",
    heading: "text-primary",
  },
  neutral: {
    border: "border-border",
    pill: "border-border bg-muted/40 text-muted-foreground",
    heading: "text-foreground",
  },
};

function truncateText(value: string, max = 120): string {
  if (!value) return "No summary available.";
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function pickTone(relatedStages: string[]): Tone {
  const joined = relatedStages.join(" ").toLowerCase();
  if (/impact|exfil|lateral|command\s*and\s*control|privilege/.test(joined)) {
    return "critical";
  }
  if (/execution|persistence|defense\s*evasion|credential/.test(joined)) {
    return "warning";
  }
  if (/initial\s*access|recon|discovery/.test(joined)) {
    return "info";
  }
  return "neutral";
}

function StepNode({ data }: NodeProps<Node<StepNodeData>["data"]>) {
  const tone = toneClasses[data.tone || "neutral"];

  return (
    <div className={`w-[300px] rounded-xl border bg-card shadow-sm ${tone.border}`}>
      <Handle type="target" id="left" position={Position.Left} className="!opacity-0" />
      <Handle type="target" id="top" position={Position.Top} className="!opacity-0" />
      <Handle type="source" id="right" position={Position.Right} className="!opacity-0" />
      <Handle type="source" id="bottom" position={Position.Bottom} className="!opacity-0" />

      <div className="border-b border-border/70 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${tone.pill}`}>
              {data.index}
            </span>
            <p className={`truncate text-sm font-semibold ${tone.heading}`}>{data.title}</p>
          </div>
          <span className="rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
            {data.timeWindow}
          </span>
        </div>
      </div>

      <div className="p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">{data.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
            {data.stageCount} related stage{data.stageCount === 1 ? "" : "s"}
          </span>
          <span className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
            {data.eventCount} supporting event{data.eventCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}

function StageNode({ data }: NodeProps<Node<StageNodeData>["data"]>) {
  return (
    <div className="min-w-[190px] rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-center text-[11px] font-medium text-primary shadow-sm">
      <Handle type="source" id="bottom" position={Position.Bottom} className="!opacity-0" />
      {data.stage}
    </div>
  );
}

function EvidenceNode({ data }: NodeProps<Node<EvidenceNodeData>["data"]>) {
  return (
    <div className="min-w-[120px] rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-center text-[10px] font-medium text-muted-foreground">
      <Handle type="target" id="top" position={Position.Top} className="!opacity-0" />
      Evidence: {data.count}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  step: StepNode,
  stage: StageNode,
  evidence: EvidenceNode,
};

function buildDiagram(flow: AttackChainFlowStep[], density: DiagramDensity): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const xStep = density === "compact" ? 305 : 360;
  const upperY = density === "compact" ? 140 : 130;
  const lowerY = density === "compact" ? 250 : 280;
  const stageOffsetY = density === "compact" ? 98 : 110;
  const evidenceOffsetY = density === "compact" ? 118 : 130;
  const stageOffsetX = density === "compact" ? 50 : 55;
  const evidenceOffsetX = density === "compact" ? 80 : 90;

  flow.forEach((step, index) => {
    const x = index * xStep;
    const y = index % 2 === 0 ? upperY : lowerY;
    const stepId = `step-${index}`;
    const firstStage = step.related_stages[0] || "Unmapped Stage";
    const supportCount = step.supporting_event_ids?.length || 0;

    nodes.push({
      id: stepId,
      type: "step",
      position: { x, y },
      data: {
        index: index + 1,
        title: truncateText(step.title || `Step ${index + 1}`, 42),
        timeWindow: truncateText(step.time_window || "Unknown time", 24),
        summary: truncateText(step.summary, 130),
        stageCount: step.related_stages?.length || 0,
        eventCount: supportCount,
        tone: pickTone(step.related_stages || []),
      },
    });

    const stageId = `stage-${index}`;
    nodes.push({
      id: stageId,
      type: "stage",
      position: { x: x + stageOffsetX, y: y - stageOffsetY },
      data: { stage: truncateText(firstStage, 30) },
      selectable: false,
      draggable: false,
    });

    edges.push({
      id: `stage-to-step-${index}`,
      source: stageId,
      sourceHandle: "bottom",
      target: stepId,
      targetHandle: "top",
      type: "smoothstep",
      animated: false,
      style: { stroke: "#94a3b8", strokeDasharray: "4 4", strokeWidth: 1.4 },
    });

    if (supportCount > 0) {
      const evidenceId = `evidence-${index}`;
      nodes.push({
        id: evidenceId,
        type: "evidence",
        position: { x: x + evidenceOffsetX, y: y + evidenceOffsetY },
        data: { count: supportCount },
        selectable: false,
        draggable: false,
      });

      edges.push({
        id: `step-to-evidence-${index}`,
        source: stepId,
        sourceHandle: "bottom",
        target: evidenceId,
        targetHandle: "top",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#64748b", strokeDasharray: "3 3", strokeWidth: 1.3 },
      });
    }

    if (index > 0) {
      edges.push({
        id: `chain-${index - 1}-${index}`,
        source: `step-${index - 1}`,
        sourceHandle: "right",
        target: stepId,
        targetHandle: "left",
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#475569",
          width: 16,
          height: 16,
        },
        style: { stroke: "#475569", strokeWidth: 2.1 },
      });
    }
  });

  return { nodes, edges };
}

function FlowCanvas({
  initialNodes,
  initialEdges,
  fitTrigger,
}: {
  initialNodes: Node[];
  initialEdges: Edge[];
  fitTrigger: number;
}) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);

    requestAnimationFrame(() => {
      fitView({
        padding: 0.25,
        duration: 450,
        minZoom: 0.35,
        maxZoom: 1.5,
      });
    });
  }, [fitTrigger, fitView, initialEdges, initialNodes, setEdges, setNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      fitViewOptions={{ padding: 0.25, minZoom: 0.35, maxZoom: 1.5 }}
      minZoom={0.2}
      maxZoom={2}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      panOnScroll={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#cbd5e1" gap={20} size={1} />
      <Controls
        showInteractive={false}
        style={{
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.75rem",
          background: "hsl(var(--card))",
        }}
      />
      <MiniMap
        pannable
        zoomable
        style={{
          width: 140,
          height: 90,
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.5rem",
          background: "hsl(var(--card))",
        }}
        nodeColor={(node) => {
          if (node.type === "stage") return "#2563eb";
          if (node.type === "evidence") return "#64748b";
          return "#0f172a";
        }}
      />
    </ReactFlow>
  );
}

export default function AttackChainMermaid({ caseId }: { caseId: string }) {
  const { data, isLoading, isError } = useAttackChain(caseId);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [density, setDensity] = useState<DiagramDensity>("comfortable");

  const flow = data?.logical_flow ?? [];

  const totalSupportingEvents = useMemo(() => {
    return flow.reduce((acc, step) => acc + (step.supporting_event_ids?.length || 0), 0);
  }, [flow]);

  const uniqueStageCount = useMemo(() => {
    return new Set(flow.flatMap((step) => step.related_stages || []).filter(Boolean)).size;
  }, [flow]);

  const diagram = useMemo(() => {
    if (!flow.length) {
      return { nodes: [], edges: [] };
    }
    return buildDiagram(flow, density);
  }, [density, flow]);

  const legend = [
    { name: "Flow Step", chip: "rounded border border-border bg-card" },
    { name: "Mapped Stage", chip: "rounded-full border border-primary/30 bg-primary/10" },
    { name: "Evidence Signal", chip: "rounded border border-border bg-muted/30" },
    { name: "Sequence Link", chip: "rounded border border-border bg-slate-100" },
  ];

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4 sm:p-5 space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !flow.length) {
    return null;
  }

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Incident Visual Summary</h3>
            <p className="text-xs text-muted-foreground">Interactive sequence map with stage and evidence context</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/20 p-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-2 text-xs",
                density === "compact" && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              onClick={() => setDensity("compact")}
            >
              Compact
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-2 text-xs",
                density === "comfortable" && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              onClick={() => setDensity("comfortable")}
            >
              Comfortable
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setFitTrigger((value) => value + 1)}
            >
              Recenter
            </Button>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Flow Steps</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{flow.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Mapped Stages</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{uniqueStageCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Evidence Links</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{totalSupportingEvents}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Interaction</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">Drag, zoom, inspect</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {legend.map((item) => (
            <span
              key={item.name}
              className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground"
            >
              <span className={cn("h-2.5 w-2.5", item.chip)} />
              {item.name}
            </span>
          ))}
        </div>

        <div className="h-[420px] w-full overflow-hidden rounded-lg border border-dashed border-border bg-gradient-to-b from-muted/5 to-muted/20 sm:h-[500px]">
          <ReactFlowProvider>
            <FlowCanvas
              initialNodes={diagram.nodes}
              initialEdges={diagram.edges}
              fitTrigger={fitTrigger}
            />
          </ReactFlowProvider>
        </div>
      </CardContent>
    </Card>
  );
}