"""
CareerCompass Feature Endpoints (FastAPI)
Feature modules authored by Jayasree A B (branch: features)
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

from features.career_roadmap import prepare_career_roadmap, get_career_roadmap_requirements
from features.personalized_roadmap import generate_personalized_roadmap
from features.github_analysis import (
    prepare_github_analysis,
    get_github_analysis_requirements,
)
from features.interview_coach import (
    prepare_interview_question,
    build_interview_question,
    prepare_answer_evaluation,
    build_interview_evaluation,
)
from features.job_market_analysis import (
    prepare_job_market_analysis,
    classify_demand,
    build_market_result,
)
from features.portfolio_builder import prepare_portfolio
from features.resume_analysis import prepare_resume_analysis, get_resume_analysis_requirements
from features.skill_gap_analysis import prepare_skill_gap_analysis, build_competency_area
from app.services.interview.evaluator import InterviewCoachEvaluator

router = APIRouter()


# -------------------------------------------------------------
# 1. Career Roadmap
# -------------------------------------------------------------
class RoadmapRequest(BaseModel):
    target_role: str = Field(..., examples=["Backend Engineer"])
    current_skills: List[str] = Field(..., examples=["Python", "FastAPI", "SQL"])
    skill_gaps: List[Dict[str, Any]] = Field(
        ...,
        examples=[{"skill": "PostgreSQL Optimization", "priority": "High"}]
    )
    candidate_profile: Optional[str] = None
    weekly_hours: Optional[int] = 5


@router.post("/roadmap", summary="Prepare 90-Day Career Roadmap (Jayasree A B & rdnk2004)")
@router.post("/generate", summary="Generate 90-Day Career Compass (Jayasree A B & rdnk2004)")
def get_roadmap(req: RoadmapRequest):
    try:
        prep = prepare_career_roadmap(
            target_role=req.target_role,
            current_skills=req.current_skills,
            skill_gaps=req.skill_gaps,
            candidate_profile=req.candidate_profile,
        )
        personalized = generate_personalized_roadmap(
            skill_gaps=req.skill_gaps,
            target_role=req.target_role,
            weekly_hours=req.weekly_hours or 5,
        )
        # Merge structured specification with authentic course catalog curriculum
        return {
            **prep,
            "personalized_roadmap": personalized,
            "roadmap_title": personalized.get("roadmap_title", f"Personalized Roadmap for {req.target_role}"),
            "phases": personalized.get("phases", []),
            "total_course_duration_hours": personalized.get("total_course_duration_hours", 0),
            "total_course_duration_minutes": personalized.get("total_course_duration_minutes", 0),
            "skill_gap_count": personalized.get("skill_gap_count", len(req.skill_gaps)),
            "available_course_count": personalized.get("available_course_count", 0),
            "external_learning": personalized.get("external_learning", []),
            "completion_rule": personalized.get("completion_rule", {}),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/roadmap/requirements", summary="Get Roadmap Requirements Schema")
def get_roadmap_schema():
    return get_career_roadmap_requirements()


# -------------------------------------------------------------
# 2. GitHub Project Analysis
# -------------------------------------------------------------
class GithubAnalysisRequest(BaseModel):
    repository_name: str = Field(..., example="distributed-cache")
    repository_url: str = Field(..., example="https://github.com/developer/distributed-cache")
    files: List[str] = Field(default_factory=list, example=["main.go", "cache.go", "README.md"])
    file_content: str = Field(default="", example="package main\n\nfunc main() {}")


@router.post("/github-analysis", summary="Analyze GitHub Repository Complexity (Jayasree A B)")
def analyze_github_repo(req: GithubAnalysisRequest):
    try:
        return prepare_github_analysis(
            repository_name=req.repository_name,
            repository_url=req.repository_url,
            files=req.files,
            file_content=req.file_content,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/github-analysis/requirements", summary="Get GitHub Analysis Requirements")
def get_github_schema():
    return {"requirements": get_github_analysis_requirements()}



# -------------------------------------------------------------
# 3. AI Interview Coach
# -------------------------------------------------------------
class InterviewQuestionRequest(BaseModel):
    role: str = Field(..., examples=["Senior Backend Engineer"])
    topic: str = Field(..., examples=["Distributed Systems & Partitioning"])


@router.post("/interview/question", summary="Generate Dynamic AI Interview Question Prompt (Jayasree A B & rdnk2004)")
def get_interview_question(req: InterviewQuestionRequest):
    try:
        prep = prepare_interview_question(role=req.role, topic=req.topic)
        evaluator = InterviewCoachEvaluator()
        generated = evaluator.generate_question(role=req.role, topic=req.topic)
        q = build_interview_question(
            question_id=generated.question_id,
            question_text=generated.question_text,
            expected_keywords=generated.expected_keywords,
            hints=generated.hints,
        )
        return {"preparation": prep, "generated_question": q}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class InterviewEvalRequest(BaseModel):
    question_text: str = Field(..., examples=["How do you handle database indexing for large tables?"])
    candidate_answer: str = Field(..., examples=["I use B-Tree indexes on high-cardinality query columns and avoid indexing write-heavy tables."])
    role: Optional[str] = Field(default="Senior Backend Engineer", examples=["Senior Backend Engineer"])


@router.post("/interview/evaluate", summary="Evaluate Interview Response with Dynamic Rubric (Jayasree A B & rdnk2004)")
def evaluate_interview_response(req: InterviewEvalRequest):
    try:
        prep = prepare_answer_evaluation(
            question_text=req.question_text,
            transcript=req.candidate_answer,
        )
        evaluator = InterviewCoachEvaluator()
        result = evaluator.evaluate_answer(
            question_text=req.question_text,
            candidate_answer=req.candidate_answer,
            role=req.role,
        )
        eval_result = build_interview_evaluation(
            overall_score=result.overall_score,
            clarity=result.clarity,
            technical_accuracy=result.technical_accuracy,
            confidence_estimate=result.confidence_estimate,
            what_went_well=result.what_went_well,
            what_to_improve=result.what_to_improve,
            better_answer=result.better_answer,
        )
        # Augment with dynamic rubric competencies
        eval_result["strengths"] = result.strengths
        eval_result["recommended_topics"] = result.recommended_topics
        return {"preparation": prep, "evaluation": eval_result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# 4. Job Market Demand
# -------------------------------------------------------------
@router.get("/job-market", summary="Analyze Job Market Demand (Jayasree A B)")
def get_job_market(
    role_title: str = Query(..., example="Full Stack Developer"),
    location: Optional[str] = Query(None, example="Remote"),
):
    try:
        prep = prepare_job_market_analysis(role_title=role_title, location=location)
        # Synthetic live demand indicator
        sample_counts = {
            "full stack developer": 32000,
            "backend engineer": 45000,
            "devops engineer": 28000,
            "ai engineer": 58000,
        }
        count = sample_counts.get(role_title.lower(), 18000)
        result = build_market_result(job_count=count, source="Aspire AI Industry Aggregator")
        return {"preparation": prep, "market_demand": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# 5. Portfolio Builder
# -------------------------------------------------------------
class PortfolioRequest(BaseModel):
    candidate_data: Dict[str, Any] = Field(..., example={"name": "Alex", "title": "Software Engineer"})
    color_theme: str = "cyan"
    mode: str = "Dark"
    layout_style: str = "Classic"
    font_vibe: str = "modern"
    contact_email: str = "candidate@example.com"


@router.post("/portfolio", summary="Prepare Developer Portfolio Builder (Jayasree A B)")
def get_portfolio_prep(req: PortfolioRequest):
    try:
        return prepare_portfolio(
            candidate_data=req.candidate_data,
            color_theme=req.color_theme,
            mode=req.mode,
            layout_style=req.layout_style,
            font_vibe=req.font_vibe,
            contact_email=req.contact_email,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# 6. Resume Deep Analysis
# -------------------------------------------------------------
class ResumeDeepAnalysisRequest(BaseModel):
    resume_text: str = Field(..., example="Senior Developer with 4 years experience in Python and PostgreSQL.")
    job_description: Optional[str] = None


@router.post("/resume-deep-analysis", summary="Prepare Deep Resume Analysis (Jayasree A B)")
def analyze_resume_deep(req: ResumeDeepAnalysisRequest):
    try:
        return prepare_resume_analysis(
            resume_text=req.resume_text,
            job_description=req.job_description,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# 7. Skill Gap Analysis
# -------------------------------------------------------------
class SkillGapPrepRequest(BaseModel):
    candidate_profile: str = Field(..., example="Proficient in Python, basic Docker, no Kubernetes")
    target_role: str = Field(..., example="DevOps Engineer")
    job_description: Optional[str] = None


@router.post("/skill-gap-analysis", summary="Prepare Competency Area Skill Gap (Jayasree A B)")
def prepare_skill_gap(req: SkillGapPrepRequest):
    try:
        return prepare_skill_gap_analysis(
            candidate_profile=req.candidate_profile,
            target_role=req.target_role,
            job_description=req.job_description,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# 8. Personalized Roadmap Generation
# -------------------------------------------------------------
from features.personalized_roadmap import (
    generate_personalized_roadmap,
    create_roadmap_from_skill_gap_result,
)

class PersonalizedRoadmapRequest(BaseModel):
    skill_gaps: List[Any] = Field(
        ...,
        description="List of skill strings or gap objects (e.g. [{'skill': 'Python', 'current_level': 'Beginner'}])",
        examples=[[{"skill": "Python", "current_level": "Beginner", "required_level": "Advanced"}, "AWS"]]
    )
    target_role: Optional[str] = Field("Backend Engineer", description="Target job role")
    weekly_hours: Optional[int] = Field(5, description="Weekly hours available for study")


@router.post("/personalized-roadmap", summary="Generate Personalized Roadmap (Jayasree A B)")
def generate_roadmap(req: PersonalizedRoadmapRequest):
    try:
        return generate_personalized_roadmap(
            skill_gaps=req.skill_gaps,
            target_role=req.target_role or "Target Role",
            weekly_hours=req.weekly_hours or 5,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

