from fastapi import APIRouter, HTTPException, BackgroundTasks, status, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db.session import get_db, get_db_session
from app.models.entities import Job, User, UserNotification
from app.core.matching_engine import calculate_match_percentage
from app.services.billing.metering import QuotaEnforcementService

logger = logging.getLogger("jobs_ingestion")
logger.setLevel(logging.INFO)

router = APIRouter(tags=["FR-05: Job Ingestion & Real-Time Matching"])

class IncomingJobPayload(BaseModel):
    id: Optional[str] = None
    title: str
    company: Optional[str] = "Acme HyperScale Systems"
    org_id: Optional[str] = "org-acme"
    department: Optional[str] = "Platform Engineering"
    location: Optional[str] = "Bengaluru / Remote"
    type: Optional[str] = "Full-Time"
    salary_range: Optional[str] = "₹28,00,000 - ₹38,00,000"
    experience_min_years: Optional[float] = 2.0
    required_skills: List[str]
    optional_skills: Optional[List[str]] = []
    description: Optional[str] = "Exciting high-growth engineering role requiring deep technical expertise."
    pass_threshold: Optional[int] = 85
    threshold: Optional[float] = 80.0

def run_job_matching_for_all_candidates(job: Dict[str, Any]):
    """
    Asynchronous matching task:
    Runs the Matching Engine comparing incoming job's required skills against all candidate profiles.
    Inserts 'job_match' notifications for eligible matches (>= 80% match).
    """
    logger.info(f"Starting asynchronous matching engine for job '{job['title']}' ({job['id']})")
    
    matches_created = 0
    now_dt = datetime.now()

    with get_db_session() as db:
        candidates = db.query(User).filter(User.role == "student").all()
        logger.info(f"Evaluating {len(candidates)} candidates against required skills: {job['required_skills']}")

        org_id = job.get("org_id") or "org-acme"
        if candidates and org_id:
            try:
                QuotaEnforcementService.check_and_record_candidate_evaluation(db, org_id, count=len(candidates))
            except HTTPException as exc:
                logger.warning(f"Candidate evaluation quota reached for org {org_id}: {exc.detail}")
                return

        for cand in candidates:
            v_skills = []
            if cand.verified_skills_json:
                try:
                    parsed = json.loads(cand.verified_skills_json)
                    if isinstance(parsed, list):
                        v_skills = parsed
                except Exception:
                    pass

            match_res = calculate_match_percentage(
                user_skills=v_skills,
                required_skills=job["required_skills"],
                threshold=job.get("threshold", 80.0)
            )

            logger.info(
                f"Candidate {cand.full_name} ({cand.id}) match: {match_res['match_percentage']}% "
                f"(Eligible: {match_res['is_eligible_match']}, Matched: {match_res['matched_skills']})"
            )

            if match_res["is_eligible_match"]:
                match_pct = round(match_res["match_percentage"])
                company_name = job.get("company") or "Acme HyperScale Systems"
                job_title = job.get("title")

                message = f"New Match: You are an {match_pct}% match for {job_title} at {company_name}. Apply now!"
                notif_id = f"notif-match-{uuid.uuid4().hex[:10]}"

                try:
                    notif = UserNotification(
                        id=notif_id,
                        user_id=cand.id,
                        job_id=job["id"],
                        message=message,
                        notification_type="job_match",
                        is_read=False,
                        trigger_date=now_dt,
                    )
                    db.add(notif)
                    matches_created += 1
                    logger.info(f"Inserted job_match notification for {cand.id} -> {notif_id}")
                except Exception as e:
                    logger.error(f"Failed to insert notification for candidate {cand.id}: {e}")

        db.commit()
    logger.info(f"Asynchronous matching completed. Created {matches_created} notifications for job {job['id']}.")

@router.post("/incoming", status_code=status.HTTP_202_ACCEPTED)
async def ingest_incoming_job(
    payload: IncomingJobPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    FR-05 Job Ingestion Endpoint:
    Simulates receiving new job postings from an external board or employer partner.
    Asynchronously triggers the Matching Engine against candidates in the database.
    """
    job_id = payload.id or f"job-{uuid.uuid4().hex[:8]}"
    company = payload.company or "Acme HyperScale Systems"
    
    now = datetime.now()
    deadline = now + timedelta(days=30)

    # Format skills for database storage
    critical_skills = [{"id": s.lower().replace(" ", "_"), "name": s, "weight": 3.0} for s in payload.required_skills]
    optional_skills = [{"id": s.lower().replace(" ", "_"), "name": s, "weight": 1.0} for s in (payload.optional_skills or [])]

    existing_job = db.query(Job).filter(Job.id == job_id).first()
    if existing_job:
        existing_job.org_id = payload.org_id or "org-acme"
        existing_job.title = payload.title
        existing_job.company = company
        existing_job.department = payload.department
        existing_job.location = payload.location
        existing_job.type = payload.type or "Full-Time"
        existing_job.experience_min_years = payload.experience_min_years or 0.0
        existing_job.salary_range = payload.salary_range
        existing_job.description = payload.description
        existing_job.pass_threshold = payload.pass_threshold or 85
        existing_job.opening_date = now
        existing_job.application_deadline = deadline
        existing_job.critical_skills_json = json.dumps(critical_skills)
        existing_job.optional_skills_json = json.dumps(optional_skills)
        existing_job.status = "active"
    else:
        QuotaEnforcementService.check_job_creation_quota(db, payload.org_id or "org-acme")
        new_job = Job(
            id=job_id,
            org_id=payload.org_id or "org-acme",
            company=company,
            title=payload.title,
            department=payload.department,
            location=payload.location,
            type=payload.type or "Full-Time",
            experience_min_years=payload.experience_min_years or 0.0,
            salary_range=payload.salary_range,
            description=payload.description,
            pass_threshold=payload.pass_threshold or 85,
            opening_date=now,
            application_deadline=deadline,
            critical_skills_json=json.dumps(critical_skills),
            optional_skills_json=json.dumps(optional_skills),
            status="active",
        )
        db.add(new_job)

    db.commit()

    job_dict = payload.model_dump()
    job_dict["id"] = job_id
    job_dict["company"] = company

    # Immediately and asynchronously trigger matching engine in the background
    background_tasks.add_task(run_job_matching_for_all_candidates, job_dict)

    return {
        "status": "received",
        "message": f"Job '{payload.title}' ingested successfully. Asynchronous eligibility matching initiated.",
        "job_id": job_id,
        "title": payload.title,
        "company": company,
        "required_skills": payload.required_skills,
        "threshold": payload.threshold
    }

@router.get("/match-feed")
async def get_60_jd_match_feed(candidate_skills: Optional[str] = "Python,FastAPI,SQL,Docker"):
    """
    Evaluates candidate skills against the 60 curated industry Job Descriptions in job_descriptions_60.json.
    Computes match percentage, missing high-ROI skills, and salary bands.
    """
    from pathlib import Path
    
    # Locate job_descriptions_60.json
    paths_to_check = [
        Path("job_descriptions_60.json"),
        Path.cwd() / "job_descriptions_60.json",
        Path(__file__).resolve().parents[4] / "job_descriptions_60.json",
        Path(__file__).resolve().parents[3] / "job_descriptions_60.json",
    ]
    jd_file = None
    for p in paths_to_check:
        if p.exists():
            jd_file = p
            break

    jds = []
    if jd_file:
        try:
            with open(jd_file, "r", encoding="utf-8") as f:
                jds = json.load(f)
        except Exception as e:
            logger.error(f"Error loading {jd_file}: {e}")

    parsed_skills = [s.strip().lower() for s in (candidate_skills or "").split(",") if s.strip()]
    
    matches = []
    for jd in jds:
        hard_skills = jd.get("extracted_requirements", {}).get("hard_skills", [])
        matched = [s for s in hard_skills if any(c in s.lower() or s.lower() in c for c in parsed_skills)]
        missing = [s for s in hard_skills if s not in matched]
        
        match_pct = round((len(matched) / max(len(hard_skills), 1)) * 100) if hard_skills else 50
        
        # Estimate Indian LPA CTC band
        exp = jd.get("experience_level", "Entry-Level")
        if "Senior" in jd.get("job_title", "") or exp == "Experienced":
            salary_lpa = "₹18 - ₹32 LPA"
        elif "Mid" in exp or "Mid" in jd.get("job_title", ""):
            salary_lpa = "₹12 - ₹20 LPA"
        else:
            salary_lpa = "₹6.5 - ₹11 LPA"

        matches.append({
            "job_id": jd.get("job_id"),
            "job_title": jd.get("job_title"),
            "category": jd.get("category"),
            "experience_level": exp,
            "salary_lpa": salary_lpa,
            "required_hard_skills": hard_skills,
            "matched_skills": matched,
            "missing_skills": missing,
            "match_percentage": match_pct,
            "raw_description": jd.get("raw_description"),
        })

    # Sort descending by match percentage
    matches.sort(key=lambda x: x["match_percentage"], reverse=True)

    return {
        "status": "success",
        "total_jds": len(jds),
        "evaluated_skills": parsed_skills,
        "matches": matches,
    }

@router.get("/{job_id}")
async def get_job_details(job_id: str, db: Session = Depends(get_db)):
    """
    Retrieve specific job details for the actionable alert modal.
    """
    row = db.query(Job).filter(Job.id == job_id).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id '{job_id}' not found"
        )

    critical_skills = []
    optional_skills = []
    try:
        if row.critical_skills_json:
            critical_skills = json.loads(row.critical_skills_json)
        if row.optional_skills_json:
            optional_skills = json.loads(row.optional_skills_json)
    except Exception:
        pass

    required_skill_names = [s.get("name", s) if isinstance(s, dict) else s for s in critical_skills]

    opening_dt = row.opening_date.strftime("%Y-%m-%d %H:%M:%S") if isinstance(row.opening_date, datetime) else str(row.opening_date)
    deadline_dt = row.application_deadline.strftime("%Y-%m-%d %H:%M:%S") if isinstance(row.application_deadline, datetime) else str(row.application_deadline)

    return {
        "id": row.id,
        "title": row.title,
        "company": row.company or "Acme HyperScale Systems",
        "department": row.department,
        "location": row.location,
        "type": row.type,
        "salary_range": row.salary_range,
        "experience_min_years": row.experience_min_years,
        "description": row.description,
        "pass_threshold": row.pass_threshold,
        "opening_date": opening_dt,
        "application_deadline": deadline_dt,
        "critical_skills": critical_skills,
        "optional_skills": optional_skills,
        "required_skill_names": required_skill_names,
        "status": row.status
    }
