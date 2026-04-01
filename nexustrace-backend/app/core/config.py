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

    PASSWORD_RESET_TOKEN_TTL_MINUTES: int = 30

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "NexusTrace Security"
    FRONTEND_URL: str = "http://localhost:3000"
    SENDGRID_API_KEY: str = ""
    EMAIL_PROVIDER: str = "auto"
    MAILERSEND_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
