export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties?: Record<string, string>;
  risk_score?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight?: number;
}

export interface NetworkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RelationTypeCount {
  type: string;
  count: number;
}

export interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
  type?: string;
}

export interface MindmapData {
  root: MindmapNode;
}

export interface AttackChainTechnique {
  technique_id: string;
  technique_name: string;
  tactic: string;
  stage: string;
  confidence: number;
  evidence_event_ids: string[];
  rationale: string;
}

export interface AttackChainStage {
  stage: string;
  confidence: number;
  summary: string;
  event_count: number;
  techniques: AttackChainTechnique[];
}

export interface AttackChainGap {
  stage: string;
  reason: string;
  recommended_artifacts: string[];
}

export interface AttackChainFlowStep {
  title: string;
  time_window: string;
  summary: string;
  related_stages: string[];
  supporting_event_ids: string[];
}

export interface AttackChainResponse {
  case_id: string;
  overall_confidence: number;
  chain_status: string;
  timeline_event_count: number;
  identified_stages: AttackChainStage[];
  uncovered_stages: AttackChainGap[];
  logical_flow: AttackChainFlowStep[];
  narrative_overview: string;
  generated_at: string;
}


