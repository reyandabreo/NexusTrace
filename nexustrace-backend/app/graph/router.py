from fastapi import APIRouter, Depends, HTTPException
from neo4j import Session
from app.db.neo4j import get_db_session
from app.auth.router import get_current_user
from app.graph.timeline import TimelineService
from app.schemas.graph import GraphResponse, MindmapResponse, TimelineEvent, PrioritizedLead
from typing import List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/timeline/{case_id}", response_model=List[TimelineEvent])
def get_timeline(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    """
    Extract chronological events from case evidence.
    Returns events sorted by timestamp with entity mentions and risk scores.
    """
    try:
        service = TimelineService(session, current_user["user_id"])
        return service.get_timeline(case_id)
    except Exception as e:
        logger.error(f"Error in get_timeline: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prioritized/{case_id}", response_model=List[PrioritizedLead])
def get_prioritized(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    """
    Return entities ranked by risk and importance.
    Entities are scored based on mention frequency, risk indicators, and graph connections.
    """
    try:
        service = TimelineService(session, current_user["user_id"])
        return service.get_prioritized(case_id)
    except Exception as e:
        logger.error(f"Error in get_prioritized: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entities/{case_id}")
def get_entities(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    try:
        service = TimelineService(session, current_user["user_id"])
        return service.get_entities(case_id)
    except Exception as e:
        logger.error(f"Error in get_entities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entity/{entity_id}")
def get_entity(
    entity_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    try:
        service = TimelineService(session, current_user["user_id"])
        entity = service.get_entity(entity_id)
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        return entity
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_entity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/network/{case_id}", response_model=GraphResponse)
def get_network(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    try:
        service = TimelineService(session, current_user["user_id"])
        return service.get_network(case_id)
    except Exception as e:
        logger.error(f"Error in get_network: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mindmap/{case_id}", response_model=MindmapResponse)
def get_mindmap(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    try:
        service = TimelineService(session, current_user["user_id"])
        result = service.get_mindmap(case_id)
        if not result:
             # Return empty shell or 404. Let's return 404 if case doesn't exist.
             raise HTTPException(status_code=404, detail="Case not found or no data for mindmap")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_mindmap: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
