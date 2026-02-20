from typing import List
from fastapi import APIRouter, Depends
from neo4j import Session
from app.db.neo4j import get_db_session
from app.auth.router import get_current_user
from app.schemas.case import CaseCreate, CaseResponse
from app.cases.service import CaseService

router = APIRouter()

@router.post("/", response_model=CaseResponse)
def create_case(
    case: CaseCreate, 
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = CaseService(session, current_user["user_id"])
    return service.create_case(case)

@router.get("/", response_model=List[CaseResponse])
def get_cases(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = CaseService(session, current_user["user_id"])
    return service.get_cases()

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = CaseService(session, current_user["user_id"])
    return service.get_case(case_id)

@router.delete("/{case_id}")
def delete_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = CaseService(session, current_user["user_id"])
    return service.delete_case(case_id)
