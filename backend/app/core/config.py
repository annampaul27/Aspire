from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aspire AI Engine"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Cryptographic JWT Settings
    JWT_SECRET_KEY: str = "aspireai-deterministic-sha256-jwt-secret-key-super-secure-2026"
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

    # SaaS Billing & Dual Payment Gateways (Razorpay & Stripe)
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = "whsec_aspire_test_secret_2026"
    RAZORPAY_KEY_ID: str = "rzp_test_aspire_2026"
    RAZORPAY_KEY_SECRET: str = "rzp_test_secret_aspire_2026"
    RAZORPAY_WEBHOOK_SECRET: str = "rzp_webhook_secret_2026"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        extra="allow",
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8"
    )

settings = Settings()
