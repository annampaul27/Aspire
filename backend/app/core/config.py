from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkillSetu AI Engine"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Cryptographic JWT Settings
    JWT_SECRET_KEY: str = "skillsetu-deterministic-sha256-jwt-secret-key-super-secure-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS Origins (Allowing Next.js frontend on localhost:3000)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    # ATS & AI Services Settings
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    CHROMA_DB_PATH: str = "./chroma_db"
    USE_OFFLINE_CACHE: bool = True

    # Relational Database URL (PostgreSQL in production/cloud, SQLite fallback for local dev)
    DATABASE_URL: str = ""

    class Config:
        case_sensitive = True
        extra = "allow"
        env_file = (".env", "backend/.env")
        env_file_encoding = "utf-8"

settings = Settings()
