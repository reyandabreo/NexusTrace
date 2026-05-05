from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

class ChatHistoryMessage(BaseModel):
    role: str  # "user" or "assistant" 
    content: str

class RAGQuery(BaseModel):
    case_id: str
    question: str
    chat_history: Optional[List[ChatHistoryMessage]] = None
    provider: Literal["auto", "openai", "gemini"] = "auto"

class SourceAttribution(BaseModel):
    filename: str
    evidence_id: str = ""
    file_type: str = ""
    pages_referenced: List[int] = Field(default_factory=list)

class RAGResponse(BaseModel):
    query_id: str
    answer: str
    cited_chunks: List[str]
    reasoning_summary: str
    confidence_score: float
    sources: List[SourceAttribution] = Field(default_factory=list)
    provider_requested: Literal["auto", "openai", "gemini"] = "auto"
    provider_used: str = "unknown"

class ExplanationResponse(BaseModel):
    query_id: str
    retrieved_chunks: List[Dict[str, Any]] = Field(default_factory=list)
    graph_path: List[str] = Field(default_factory=list)
    reasoning: str = ""
    # Legacy fields kept for backward compatibility with older clients.
    question: Optional[str] = None
    graph_expansion: List[Dict[str, Any]] = Field(default_factory=list)

class QueryHistory(BaseModel):
    query_id: str
    case_id: str
    question: str
    answer: Optional[str] = None
    timestamp: int
    chunks_retrieved: Optional[int] = 0
