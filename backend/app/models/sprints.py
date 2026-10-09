from pydantic import BaseModel, Field
from typing import Optional

class SprintDispatchRequest(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: str
    skill_id: str
    skill_name: str
    org_id: str = "org-acme"
    job_id: str = "job-fullstack-01"

class SprintDispatchResponse(BaseModel):
    dispatch_id: str
    candidate_id: str
    skill_id: str
    skill_name: str
    status: str = "dispatched"
    dispatched_at: str
    invite_url: str
    message: str

class SprintCompleteRequest(BaseModel):
    dispatch_id: Optional[str] = None
    candidate_id: str
    candidate_name: str
    candidate_email: str
    skill_id: str
    skill_name: str
    score: int = Field(..., ge=0, le=100)
    passed_questions: int = 3
    total_questions: int = 3
    tab_blur_events: int = 0

class SprintCompleteResponse(BaseModel):
    candidate_id: str
    skill_id: str
    skill_name: str
    score: int
    is_verified: bool
    credential_hash: Optional[str] = None
    previous_score: int
    boosted_score: int
    previous_tier: str
    new_tier: str
    elevated_on_radar: bool
    verification_url: Optional[str] = None
    liquidity_message: str
