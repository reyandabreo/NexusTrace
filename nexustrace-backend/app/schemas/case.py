from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CaseCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CaseResponse(BaseModel):
    case_id: str
    name: str
    description: Optional[str] = None
    created_at: int # Neo4j timestamp to int
