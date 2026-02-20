from fastapi import APIRouter, Depends
from typing import List
from neo4j import Session
from app.db.neo4j import get_db_session
from app.auth.router import get_current_user
from app.schemas.rag import RAGQuery, RAGResponse, ExplanationResponse, QueryHistory
from app.rag.service import RAGService
from app.cases.service import CaseService

router = APIRouter()

@router.post("/ask", response_model=RAGResponse)
def ask_rag(
    query: RAGQuery,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    # Verify access
    CaseService(session, current_user["user_id"]).get_case(query.case_id)
    
    service = RAGService(session)
    return service.ask_question(current_user["user_id"], query)

@router.get("/explanation/{query_id}", response_model=ExplanationResponse)
def get_explanation(
    query_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    # In a real app we'd verify the query belongs to a case the user owns.
    service = RAGService(session)
    return service.get_explanation(query_id)

@router.get("/history/{case_id}", response_model=List[QueryHistory])
def get_query_history(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    # Verify access
    CaseService(session, current_user["user_id"]).get_case(case_id)
    
    service = RAGService(session)
    return service.get_query_history(case_id)

@router.get("/history", response_model=List[QueryHistory])
def get_all_query_history(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = RAGService(session)
    return service.get_all_query_history(current_user["user_id"])
