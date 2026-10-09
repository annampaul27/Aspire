import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict

class RoleTopicPreset(BaseModel):
    role: str
    topic: str
    description: str
    difficulty: str = "Senior"

class QuestionGenerationRequest(BaseModel):
    role: str = Field(default="Senior Backend Engineer", description="Target job title")
    topic: str = Field(default="Distributed Systems & Partitioning", description="Technical or behavioral focus")
    difficulty: str = Field(default="senior", description="junior | mid | senior | principal")
    candidate_name: Optional[str] = "Candidate"

class InterviewQuestionResponse(BaseModel):
    question_id: str
    role: str
    topic: str
    difficulty: str
    question_scenario: str
    hints: List[str] = Field(default_factory=list)
    expected_keywords: List[str] = Field(default_factory=list)
    follow_up_traps: List[str] = Field(default_factory=list)

class SpeechAcousticsMetrics(BaseModel):
    word_count: int
    duration_seconds: float
    wpm: float
    cadence_rating: str  # "Too Slow", "Optimal", "Slightly Fast", "Too Fast"
    filler_words_detected: List[str] = Field(default_factory=list)
    filler_word_count: int
    filler_percentage: float
    pause_duration_seconds: float = 0.0

class VisionTelemetryMetrics(BaseModel):
    eye_contact_ratio: float = Field(ge=0.0, le=1.0)
    gaze_deviation_count: int = 0
    head_stability_index: float = Field(ge=0.0, le=100.0)
    composure_index: float = Field(ge=0.0, le=100.0)
    non_verbal_rating: str = "Good"

class AnswerSubmissionRequest(BaseModel):
    question_id: str
    role: str
    question_text: str
    candidate_transcript: str
    audio_duration_seconds: float = 30.0
    eye_contact_ratio: float = 0.80
    head_stability_score: float = 85.0
    is_follow_up: bool = False
    prior_answer: Optional[str] = None

class FollowUpProbeResponse(BaseModel):
    probe_id: str
    probe_question: str
    probe_focus: str
    hint: Optional[str] = None

class HireabilityEvaluationReport(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    report_id: str
    candidate_name: str = "Candidate"
    role: str
    topic: str
    overall_hireability_score: float = Field(ge=0.0, le=100.0)
    verdict: str  # "Strong Hire", "Hire", "Leaning Hire", "Needs Improvement", "Do Not Hire"
    technical_score: float = Field(ge=0.0, le=100.0)
    vocal_score: float = Field(ge=0.0, le=100.0)
    nonverbal_score: float = Field(ge=0.0, le=100.0)
    speech_metrics: SpeechAcousticsMetrics
    vision_metrics: VisionTelemetryMetrics
    rubric_breakdown: Dict[str, float] = Field(default_factory=dict)
    what_went_well: List[str] = Field(default_factory=list)
    what_to_improve: List[str] = Field(default_factory=list)
    model_senior_response: str
    radar_chart_data: Dict[str, float] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat())
