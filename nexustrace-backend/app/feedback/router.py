from fastapi import APIRouter, Depends
from neo4j import Session
from app.db.neo4j import get_db_session
from app.auth.router import get_current_user
from app.schemas.feedback import FeedbackCreate
from app.feedback.service import FeedbackService

router = APIRouter()

@router.post("/")
def submit_feedback(
    feedback: FeedbackCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = FeedbackService(session, current_user["user_id"])
    return service.submit_feedback(feedback)
