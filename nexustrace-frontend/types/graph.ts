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

export interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
  type?: string;
}

export interface MindmapData {
  root: MindmapNode;
}
