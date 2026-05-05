from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class GraphNode(BaseModel):
    id: str
    label: str
    type: str # Case, Evidence, Entity
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str # HAS_EVIDENCE, MENTIONS, etc.

class RelationTypeCount(BaseModel):
    type: str
    count: int

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class MindmapNode(BaseModel):
    id: str
    label: str
    type: str # root, evidence, entity_type, entity
    children: List['MindmapNode'] = []

MindmapNode.update_forward_refs()

class MindmapResponse(BaseModel):
    root: MindmapNode

class TimelineEvent(BaseModel):
    id: str
    timestamp: str
    event_type: str
    description: str
    source: str
    entities: List[str]
    risk_score: Optional[float] = None

class PrioritizedLead(BaseModel):
    id: str
    entity: str
    entity_type: str
    risk_score: float
    reason: str
    connections: int
    last_seen: str
    risk_breakdown: Optional[Dict[str, float]] = None
    top_risk_drivers: Optional[List[str]] = None
    counterfactual_explanations: Optional[List[str]] = None


class AttackChainTechnique(BaseModel):
    technique_id: str
    technique_name: str
    tactic: str
    stage: str
    confidence: float
    evidence_event_ids: List[str]
    rationale: str


class AttackChainStage(BaseModel):
    stage: str
    confidence: float
    summary: str
    event_count: int
    techniques: List[AttackChainTechnique]


class AttackChainGap(BaseModel):
    stage: str
    reason: str
    recommended_artifacts: List[str]


class AttackChainFlowStep(BaseModel):
    title: str
    time_window: str
    summary: str
    related_stages: List[str]
    supporting_event_ids: List[str]


class AttackChainResponse(BaseModel):
    case_id: str
    overall_confidence: float
    chain_status: str
    timeline_event_count: int
    identified_stages: List[AttackChainStage]
    uncovered_stages: List[AttackChainGap]
    logical_flow: List[AttackChainFlowStep]
    narrative_overview: str
    generated_at: str



