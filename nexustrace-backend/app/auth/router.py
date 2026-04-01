from fastapi import APIRouter, Depends
from neo4j import Session
from app.db.neo4j import get_db_session
from app.auth.service import AuthService
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ChangePasswordRequest,
    ActionResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
)
from app.core.security import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, session: Session = Depends(get_db_session)):
    service = AuthService(session)
    return service.register_user(user)

@router.post("/login", response_model=Token)
def login(user: UserLogin, session: Session = Depends(get_db_session)):
    service = AuthService(session)
    return service.login_user(user)

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: dict = Depends(get_current_user), session: Session = Depends(get_db_session)):
    service = AuthService(session)
    return service.get_me(current_user["user_id"])

@router.post("/change-password", response_model=ActionResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = AuthService(session)
    return service.change_password(
        current_user["user_id"],
        payload.current_password,
        payload.new_password
    )

@router.post("/logout-all", response_model=ActionResponse)
def logout_all_sessions(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db_session)
):
    service = AuthService(session)
    return service.logout_all_sessions(current_user["user_id"])

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    session: Session = Depends(get_db_session)
):
    service = AuthService(session)
    return service.request_password_reset(payload.identifier)

@router.post("/reset-password", response_model=ActionResponse)
def reset_password(
    payload: ResetPasswordRequest,
    session: Session = Depends(get_db_session)
):
    service = AuthService(session)
    return service.reset_password(payload.token, payload.new_password)
