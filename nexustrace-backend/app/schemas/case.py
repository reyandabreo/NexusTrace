from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class CaseCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CaseResponse(BaseModel):
    case_id: str
    name: str
    description: Optional[str] = None
    created_at: int # Neo4j timestamp to int
    status: Optional[str] = "open"
    evidence_count: Optional[int] = 0

class CaseUpdate(BaseModel):
    status: Optional[Literal["open", "in_progress", "closed"]] = None
    name: Optional[str] = None
    description: Optional[str] = None
