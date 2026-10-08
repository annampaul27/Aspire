from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends

from services.interview_coach.core.config import settings
from services.interview_coach.core.schemas import (
    RoleTopicPreset,
    QuestionGenerationRequest,
    InterviewQuestionResponse,
    AnswerSubmissionRequest,
    FollowUpProbeResponse,
    HireabilityEvaluationReport,
)
from services.interview_coach.engine.interviewer import AdaptiveInterviewerEngine

router = APIRouter()
_engine = AdaptiveInterviewerEngine()

PRESET_ROLES: List[RoleTopicPreset] = [
    RoleTopicPreset(
        role="Senior Backend Engineer",
        topic="Distributed Systems & Partitioning",
        description="Consensus algorithms, microservices resiliency, idempotency, and asynchronous event streams.",
        difficulty="Senior"
    ),
    RoleTopicPreset(
        role="Senior Full-Stack Architect",
        topic="PostgreSQL Index Tuning & MVCC",
        description="Query planning, execution node profiling, concurrent index operations, and locking mechanisms.",
        difficulty="Senior"
    ),
    RoleTopicPreset(
        role="Cloud DevOps Engineer",
        topic="Kubernetes High Availability & RBAC",
        description="Cluster failover, ingress routing, zero-trust network policies, and container security boundaries.",
        difficulty="Senior"
    ),
    RoleTopicPreset(
        role="AI/RAG Systems Engineer",
        topic="Vector Embeddings & HNSW Retrieval",
        description="Approximate nearest neighbors, cosine distance quantization, hybrid semantic reranking, and chunking strategies.",
        difficulty="Senior"
    ),
    RoleTopicPreset(
        role="Frontend Performance Engineer",
        topic="React Concurrency & Virtual DOM Profiling",
        description="Component re-render optimization, Web Vitals (LCP/CLS/INP), Web Workers, and streaming SSR.",
        difficulty="Senior"
    ),
]

class FollowUpRequest(BaseModel):
    question_text: str
    candidate_answer: str
    role: str = "Senior Software Engineer"

@router.get("/health", summary="Service Health Check")
def get_health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "interview_coach",
        "version": settings.VERSION,
        "optimal_wpm_range": [settings.OPTIMAL_WPM_MIN, settings.OPTIMAL_WPM_MAX],
    }

@router.get("/presets", summary="Retrieve Curated Role & Topic Presets")
def get_presets() -> Dict[str, List[RoleTopicPreset]]:
    return {"presets": PRESET_ROLES}

@router.post("/question", response_model=InterviewQuestionResponse, summary="Generate Adaptive Technical Scenario")
def generate_interview_question(req: QuestionGenerationRequest) -> InterviewQuestionResponse:
    try:
        return _engine.generate_question(
            role=req.role,
            topic=req.topic,
            difficulty=req.difficulty
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate question: {str(e)}")

@router.post("/follow-up", response_model=FollowUpProbeResponse, summary="Generate Adaptive Counter-Grill Probe")
def generate_follow_up(req: FollowUpRequest) -> FollowUpProbeResponse:
    try:
        return _engine.generate_follow_up_probe(
            question_text=req.question_text,
            candidate_answer=req.candidate_answer,
            role=req.role
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate follow-up: {str(e)}")

@router.post("/evaluate", response_model=HireabilityEvaluationReport, summary="Synthesize Multimodal Evaluation Report")
def evaluate_session(req: AnswerSubmissionRequest) -> HireabilityEvaluationReport:
    try:
        return _engine.evaluate_session(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate session: {str(e)}")
