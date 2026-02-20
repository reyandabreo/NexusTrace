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
