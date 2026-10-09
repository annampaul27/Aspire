from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class PlanLimits(BaseModel):
    active_jobs: int = Field(default=3, description="Maximum concurrent active job requisitions (-1 for unlimited)")
    candidate_evaluations_monthly: int = Field(default=25, description="Monthly candidate evaluation quota (-1 for unlimited)")
    seats_included: int = Field(default=1, description="Number of user/recruiter seats included")
    resume_uploads_monthly: int = Field(default=5, description="Candidate resume parsing quota (-1 for unlimited)")
    ai_interviews_monthly: int = Field(default=0, description="Monthly AI mock interview sessions (-1 for unlimited)")

class PlanDefinition(BaseModel):
    id: str
    name: str
    audience: str  # "student" | "employer"
    description: str
    price_inr_monthly: int
    price_inr_annual: int
    price_usd_monthly: float
    price_usd_annual: float
    limits: PlanLimits
    features: List[str]
    badge: Optional[str] = None
    is_popular: bool = False

SAAS_PLANS: Dict[str, PlanDefinition] = {
    "student_free": PlanDefinition(
        id="student_free",
        name="Student Free",
        audience="student",
        description="Core upskilling and proof-of-work verification for all engineering learners.",
        price_inr_monthly=0,
        price_inr_annual=0,
        price_usd_monthly=0.0,
        price_usd_annual=0.0,
        limits=PlanLimits(
            active_jobs=0,
            candidate_evaluations_monthly=0,
            seats_included=1,
            resume_uploads_monthly=5,
            ai_interviews_monthly=0,
        ),
        features=[
            "Resume Upload & ATS Parsing",
            "Skill Gap Delta Radar (60-JD benchmark)",
            "Diagnostic Micro-Sprints & Proof Minting",
            "Free Bug-Fix Sandbox Challenges",
            "Public Cryptographic Verification URL",
        ],
        badge="Community",
        is_popular=False,
    ),
    "student_pro": PlanDefinition(
        id="student_pro",
        name="Student Pro Upskilling",
        audience="student",
        description="Accelerate interview readiness with dynamic AI evaluations and custom 90-day roadmaps.",
        price_inr_monthly=299,
        price_inr_annual=2870,  # 20% discount
        price_usd_monthly=4.99,
        price_usd_annual=47.90,
        limits=PlanLimits(
            active_jobs=0,
            candidate_evaluations_monthly=0,
            seats_included=1,
            resume_uploads_monthly=-1,
            ai_interviews_monthly=-1,
        ),
        features=[
            "All Free Tier features",
            "Unlimited AI Mock Interviews with Live Rubrics",
            "Deep GitHub Repository Architecture Audits",
            "Dynamic 90-Day Course-Backed Roadmaps",
            "Unlimited ATS Tailored Resumes & Versioning",
            "Priority Verification Badge on Talent Radar",
        ],
        badge="Career Accelerator",
        is_popular=True,
    ),
    "starter": PlanDefinition(
        id="starter",
        name="Starter / Bootstrapped",
        audience="employer",
        description="Ideal for early-stage startups hiring 1–3 high-performing core engineers.",
        price_inr_monthly=4999,
        price_inr_annual=47990,
        price_usd_monthly=59.0,
        price_usd_annual=566.0,
        limits=PlanLimits(
            active_jobs=3,
            candidate_evaluations_monthly=25,
            seats_included=2,
            resume_uploads_monthly=-1,
            ai_interviews_monthly=0,
        ),
        features=[
            "3 Active Job Requisitions",
            "25 Candidate Evaluations / month",
            "Employer Talent Radar & Skill Delta Matching",
            "3-Tier Segmentation (Job-Ready, Bridgeable, Mismatch)",
            "2 Recruiter Seats",
            "Email Support",
        ],
        badge="Starter",
        is_popular=False,
    ),
    "growth": PlanDefinition(
        id="growth",
        name="Growth / Scale-Up",
        audience="employer",
        description="Built for scaling engineering organizations hiring across multiple tech stacks.",
        price_inr_monthly=14999,
        price_inr_annual=143990,
        price_usd_monthly=179.0,
        price_usd_annual=1718.0,
        limits=PlanLimits(
            active_jobs=10,
            candidate_evaluations_monthly=150,
            seats_included=10,
            resume_uploads_monthly=-1,
            ai_interviews_monthly=0,
        ),
        features=[
            "10 Active Job Requisitions",
            "150 Candidate Evaluations / month",
            "1-Click Micro-Gap Sprints Dispatch",
            "Blind DEI Screening Anonymizer",
            "Collaborative Recruitment Kanban Pipeline",
            "10 Recruiter / Engineering Manager Seats",
            "Priority Slack & Dedicated Support",
        ],
        badge="Most Popular",
        is_popular=True,
    ),
    "enterprise": PlanDefinition(
        id="enterprise",
        name="Enterprise / Corporate",
        audience="employer",
        description="High-volume enterprise talent acquisition with bespoke challenges and SLAs.",
        price_inr_monthly=49999,
        price_inr_annual=479990,
        price_usd_monthly=599.0,
        price_usd_annual=5750.0,
        limits=PlanLimits(
            active_jobs=-1,
            candidate_evaluations_monthly=-1,
            seats_included=25,
            resume_uploads_monthly=-1,
            ai_interviews_monthly=0,
        ),
        features=[
            "Unlimited Active Job Requisitions",
            "Unlimited Candidate Evaluations",
            "Custom Bug Repositories & Dedicated AST Rules",
            "ATS Webhooks & Bi-Directional ATS Sync",
            "25+ Team Seats & Role Scoping",
            "Dedicated Account Manager & 99.9% Uptime SLA",
            "Custom Security & Audit Exports",
        ],
        badge="Enterprise",
        is_popular=False,
    ),
}

def get_plan_by_id(plan_id: str) -> Optional[PlanDefinition]:
    return SAAS_PLANS.get(plan_id.lower())

def list_all_plans(audience: Optional[str] = None) -> List[PlanDefinition]:
    plans = list(SAAS_PLANS.values())
    if audience:
        return [p for p in plans if p.audience == audience or audience == "all"]
    return plans
