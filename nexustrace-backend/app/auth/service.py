from neo4j import Session
from fastapi import HTTPException, status
import uuid
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserLogin, Token

class AuthService:
    def __init__(self, session: Session):
        self.session = session

    def register_user(self, user: UserCreate):
        # Check if user exists
        query_check = "MATCH (u:User {username: $username}) RETURN u"
        result = self.session.run(query_check, username=user.username).single()
        
        if result:
            raise HTTPException(status_code=400, detail="Username already registered")

        # Create user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user.password)
        query_create = """
        CREATE (u:User {
            id: $user_id,
            username: $username, 
            email: $email, 
            password_hash: $password_hash,
            created_at: timestamp()
        })
        RETURN u.username as username, u.email as email, u.id as id
        """
        self.session.run(query_create, 
                         user_id=user_id,
                         username=user.username, 
                         email=user.email, 
                         password_hash=hashed_password)
        
        return {"username": user.username, "email": user.email, "id": user_id}

    def login_user(self, user: UserLogin):
        query = "MATCH (u:User {username: $username}) RETURN u.username as username, u.password_hash as password_hash, u.id as user_id, u.role as role"
        result = self.session.run(query, username=user.username).single()

        if not result or not verify_password(user.password, result["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Include user_id and role in the token
        access_token = create_access_token(data={
            "sub": user.username,
            "user_id": result["user_id"],
            "role": result.get("role", "user") # Default to user if role not set
        })
        return {"access_token": access_token, "token_type": "bearer"}

    def get_me(self, user_id: str):
        query = "MATCH (u:User {id: $user_id}) RETURN u.username as username, u.email as email, u.id as id"
        result = self.session.run(query, user_id=user_id).single()
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        return {"username": result["username"], "email": result["email"], "id": result["id"]}
