from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class EvidenceCreate(BaseModel):
    case_id: str
    file_type: str  # json, csv, txt, pdf

class EvidenceResponse(BaseModel):
    evidence_id: str
    filename: str
    chunk_count: int
    status: str

class ChunkResponse(BaseModel):
    chunk_id: str
    text: str
    score: float
    timestamp: Optional[str]
    entities: List[Dict[str, Any]]
