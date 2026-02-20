export interface Case {
  id?: string;
  case_id?: string;
  title?: string;
  name?: string;
  description: string;
  status?: "open" | "closed" | "in_progress";
  created_at: string | number;
  updated_at?: string;
  owner_id?: string;
  evidence_count?: number;
}

export interface CreateCaseRequest {
  name: string;
  description: string;
}

export interface Evidence {
  evidence_id: string;
  filename: string;
  file_type: string;
  created_at: string | null;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: string;
  description: string;
  source: string;
  entities: string[];
  risk_score?: number;
}

export interface Entity {
  id: string;
  name: string;
  type: "person" | "organization" | "location" | "device" | "email" | "ip" | "phone" | "other";
  mentions: number;
  risk_score?: number;
  properties?: Record<string, string>;
}

export interface PrioritizedLead {
  id: string;
  entity: string;
  entity_type: string;
  risk_score: number;
  reason: string;
  connections: number;
  last_seen: string;
}
