from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from neo4j import Session
from app.db.neo4j import get_db_session

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_db_session)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        role: str = payload.get("role", "user")
        token_version: int = payload.get("token_version", 0)
        
        print(f"DEBUG: Token decoded. User: {username}, ID: {user_id}, Role: {role}")
        
        if username is None or user_id is None:
            print("DEBUG: Missing username or user_id in token")
            raise credentials_exception
    except JWTError as e:
        print(f"DEBUG: JWT Error: {e}")
        raise credentials_exception

    # Validate token version against current user record
    try:
        result = session.run(
            """
            MATCH (u:User {id: $user_id})
            RETURN coalesce(u.token_version, 0) as token_version
            """,
            user_id=user_id
        ).single()
    except Exception as e:
        print(f"DEBUG: Token version lookup failed: {e}")
        raise credentials_exception

    if not result:
        raise credentials_exception

    current_version = int(result["token_version"] or 0)
    if current_version != int(token_version or 0):
        raise credentials_exception
    
    return {"user_id": user_id, "username": username, "role": role}
