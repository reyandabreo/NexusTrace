from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatHistoryMessage(BaseModel):
    role: str  # "user" or "assistant" 
    content: str

class RAGQuery(BaseModel):
    case_id: str
    question: str
    chat_history: Optional[List[ChatHistoryMessage]] = None

class SourceAttribution(BaseModel):
    filename: str
    evidence_id: str = ""
    file_type: str = ""
    pages_referenced: List[int] = []

class RAGResponse(BaseModel):
    query_id: str
    answer: str
    cited_chunks: List[str]
    reasoning_summary: str
    confidence_score: float
    sources: List[SourceAttribution] = []

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
