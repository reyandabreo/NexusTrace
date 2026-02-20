from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import List
from neo4j import Session
from app.db.neo4j import get_db_session
from app.auth.router import get_current_user
from app.ingestion.service import IngestionService
from app.cases.service import CaseService

router = APIRouter()

@router.post("/upload")
async def upload_evidence(
    case_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    # Verify case ownership
    case_service = CaseService(session, current_user["user_id"])
    # case_service.get_case(case_id)  # Raises 404/403 if not found/owned
    
    service = IngestionService(session, current_user["user_id"])
    return await service.process_evidence(case_id, file)

@router.get("/case/{case_id}")
def get_case_evidence(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    # Verify case ownership
    case_service = CaseService(session, current_user["user_id"])
    # case_service.get_case(case_id)  # Raises 404/403 if not found/owned
    
    service = IngestionService(session, current_user["user_id"])
    return service.get_evidence_for_case(case_id)

@router.get("/{evidence_id}")
def get_evidence(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = IngestionService(session, current_user["user_id"])
    evidence = service.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence