from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    chunk_id: str
    query_id: str
    feedback_type: str # "positive", "negative"
    comment: Optional[str] = None
