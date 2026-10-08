import os
from typing import List
from pydantic import BaseModel

class InterviewCoachSettings(BaseModel):
    """
    Autonomous Configuration for AI Interview Coach.
    Operates independently without requiring parent monorepo configuration.
    """
    APP_NAME: str = "Aspire Multimodal AI Interview Coach"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("INTERVIEW_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("INTERVIEW_PORT", "8005"))
    
    # LLM & Whisper Speech Configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "whisper-large-v3-turbo")

    # Speech Acoustics Thresholds
    OPTIMAL_WPM_MIN: float = 120.0
    OPTIMAL_WPM_MAX: float = 165.0
    
    # Common Verbal Filler Words & Tics
    FILLER_WORDS: List[str] = [
        "um", "uh", "like", "you know", "actually",
        "basically", "sort of", "kind of", "literally",
        "right", "i mean", "so yeah", "honestly"
    ]

    # Academic Scoring Weights
    WEIGHT_TECHNICAL: float = 0.50
    WEIGHT_VOCAL: float = 0.25
    WEIGHT_NONVERBAL: float = 0.25

settings = InterviewCoachSettings()
