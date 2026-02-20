import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "NexusTrace"
    APP_ENV: str = "development"
    
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_HOURS: int = 8
    
    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str
    
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    SPACY_MODEL: str = "en_core_web_sm"
    
    MAX_CHUNK_TOKENS: int = 600
    CHUNK_OVERLAP: int = 100
    TOP_K_RETRIEVAL: int = 5

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
