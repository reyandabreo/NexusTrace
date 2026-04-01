from typing import Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr

class UserLogin(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    identifier: str

class ForgotPasswordResponse(BaseModel):
    status: str
    reset_token: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ActionResponse(BaseModel):
    status: str

class UserResponse(BaseModel):
    username: str
    email: str
    id: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
