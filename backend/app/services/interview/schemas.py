from pydantic import BaseModel, Field
from typing import List, Optional

class InterviewQuestionSchema(BaseModel):
    question_id: str = Field(description="Unique question identifier")
    question_text: str = Field(description="The technical or architectural question text")
    expected_keywords: List[str] = Field(description="List of 3-6 critical architectural or technical keywords")
    hints: List[str] = Field(description="2 actionable hints to guide the candidate's line of thought")
    role: Optional[str] = Field(default=None, description="Target engineering role")
    topic: Optional[str] = Field(default=None, description="Topic or domain area")

class InterviewEvaluationRubric(BaseModel):
    clarity: float = Field(ge=0.0, le=100.0, description="Clarity and structure score (0-100)")
    technical_accuracy: float = Field(ge=0.0, le=100.0, description="Domain correctness and architectural accuracy (0-100)")
    confidence_estimate: float = Field(ge=0.0, le=1.0, description="Confidence, assertiveness, and directness (0.0-1.0)")
    overall_score: float = Field(ge=0.0, le=100.0, description="Weighted composite interview score (0-100)")
    what_went_well: List[str] = Field(description="Bullet points of demonstrated strengths and correct answers")
    what_to_improve: List[str] = Field(description="Actionable technical gaps, missed edge cases, or communication points")
    better_answer: str = Field(description="A senior-to-staff level model answer demonstrating ideal technical depth")
    strengths: List[str] = Field(default_factory=list, description="Top skills displayed in response")
    recommended_topics: List[str] = Field(default_factory=list, description="Recommended learning or practice areas")
