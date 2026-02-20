from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    email: str
    id: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
