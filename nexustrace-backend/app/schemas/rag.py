from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class RAGQuery(BaseModel):
    case_id: str
    question: str

class RAGResponse(BaseModel):
    query_id: str
    answer: str
    cited_chunks: List[str]
    reasoning_summary: str
    confidence_score: float

class ExplanationResponse(BaseModel):
    query_id: str
    question: str
    retrieved_chunks: List[Dict[str, Any]]
    graph_expansion: List[Dict[str, Any]]

class QueryHistory(BaseModel):
    query_id: str
    case_id: str
    question: str
    answer: Optional[str] = None
    timestamp: int
    chunks_retrieved: Optional[int] = 0
