from pydantic import BaseModel, Field
from typing import List, Optional

class WorkExperience(BaseModel):
    company: str = Field(description="Name of the company or employer")
    title: str = Field(description="Job title or role")
    start_date: str = Field(description="Start date of employment (e.g., Jan 2023)")
    end_date: Optional[str] = Field(default=None, description="End date of employment or 'Present'")
    bullet_points: List[str] = Field(default_factory=list, description="List of responsibilities, achievements, or bullet points")

class ResumeSchema(BaseModel):
    name: str = Field(default="Candidate", description="Full candidate name")
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = "Bengaluru, India"
    college: Optional[str] = None
    work_experience: List[WorkExperience] = Field(default_factory=list)
    education: List[dict] = Field(default_factory=list, description="Education history")
    projects: List[dict] = Field(default_factory=list, description="Personal or academic projects")
    skills: List[str] = Field(default_factory=list, description="Normalized list of extracted skills.")
    summary: str = Field(default="", description="A brief professional summary.")
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    experience_years: Optional[float] = 0.0
    user_class: Optional[str] = Field(default="Experienced", description="Fresher or Experienced")

class JDSchema(BaseModel):
    job_title: str = Field(default="Software Engineer", description="Title of the job role")
    mandatory_skills: List[str] = Field(default_factory=list, description="Must-have critical skills (weight=3.0)")
    nice_to_have_skills: List[str] = Field(default_factory=list, description="Optional skills (weight=1.0)")
    years_of_experience_required: Optional[int] = Field(default=0, description="Years of experience required")
    description_summary: str = Field(default="", description="A brief summary of the job role.")

class ComparisonResultSchema(BaseModel):
    match_score: float = Field(description="Weighted percentage match score (0-100%)")
    matched_skills: List[str] = Field(default_factory=list, description="Intersection of resume skills and JD mandatory skills")
    missing_skills: List[str] = Field(default_factory=list, description="JD mandatory skills minus resume skills")
    bonus_skills: List[str] = Field(default_factory=list, description="Resume skills not found in the JD")
    tier: str = Field(default="mismatch", description="Job-Ready (>=85%), Bridgeable (60-84%), Mismatch (<60%)")

class JDRequest(BaseModel):
    raw_text: str

class QueryRequest(BaseModel):
    query_text: str
    n_results: int = 5
