from fastapi import APIRouter, HTTPException, status, Query, Body, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
import uuid
import json
from sqlalchemy.orm import Session
from sqlalchemy import select, update

from app.db.session import get_db
from app.models.entities import UserNotification, Job, SavedJob
from app.workers.notification_worker import run_deadline_notifications_job

router = APIRouter(prefix="/notifications", tags=["FR-04 Deadlines & Notifications"])

@router.get("")
async def get_user_notifications(
    user_id: Optional[str] = Query("cand-1", description="User ID to fetch notifications for"),
    db: Session = Depends(get_db)
):
    """
    Fetch unread and read notifications for a given candidate/user.
    """
    stmt = (
        select(UserNotification, Job)
        .outerjoin(Job, UserNotification.job_id == Job.id)
        .where(UserNotification.user_id == user_id)
        .order_by(UserNotification.created_at.desc())
    )
    rows = db.execute(stmt).all()
    
    notifications = []
    unread_count = 0
    for notif, job in rows:
        is_read_bool = bool(notif.is_read)
        if not is_read_bool:
            unread_count += 1
            
        notifications.append({
            "id": notif.id,
            "user_id": notif.user_id,
            "job_id": notif.job_id,
            "job_title": job.title if job else "Target Opportunity",
            "company": (job.company if job and job.company else "Acme HyperScale Systems"),
            "message": notif.message,
            "notification_type": notif.notification_type,
            "is_read": is_read_bool,
            "trigger_date": notif.trigger_date.strftime("%Y-%m-%d") if hasattr(notif.trigger_date, "strftime") else str(notif.trigger_date),
            "application_deadline": job.application_deadline.strftime("%Y-%m-%d %H:%M:%S") if (job and hasattr(job.application_deadline, "strftime")) else None,
            "opening_date": job.opening_date.strftime("%Y-%m-%d %H:%M:%S") if (job and hasattr(job.opening_date, "strftime")) else None,
            "location": job.location if job else None,
            "created_at": notif.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(notif.created_at, "strftime") else str(notif.created_at),
        })
        
    return {
        "user_id": user_id,
        "unread_count": unread_count,
        "total_count": len(notifications),
        "notifications": notifications
    }

@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    db: Session = Depends(get_db)
):
    """
    Mark a notification as read (updates is_read to 1).
    """
    notif = db.execute(select(UserNotification).where(UserNotification.id == notification_id)).scalar_one_or_none()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with id '{notification_id}' not found"
        )
        
    notif.is_read = True
    db.commit()
    
    return {
        "success": True,
        "id": notification_id,
        "is_read": True,
        "message": "Notification marked as read"
    }

@router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    payload: Dict[str, Any] = Body(default={"user_id": "cand-1"}),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications for a given user as read.
    """
    user_id = payload.get("user_id", "cand-1")
    stmt = update(UserNotification).where(UserNotification.user_id == user_id).values(is_read=True)
    result = db.execute(stmt)
    db.commit()
    
    return {
        "success": True,
        "user_id": user_id,
        "updated_count": result.rowcount,
        "message": f"Marked {result.rowcount} notifications as read"
    }

@router.post("/trigger-cron")
@router.post("/trigger-worker")
async def trigger_cron_worker():
    """
    Manually trigger the 3-week deadline and opening notification worker.
    """
    result = run_deadline_notifications_job()
    return result

@router.get("/jobs")
async def list_jobs(db: Session = Depends(get_db)):
    """
    List all platform jobs with their opening dates and application deadlines.
    """
    stmt = select(Job).order_by(Job.created_at.desc())
    jobs = db.execute(stmt).scalars().all()
    
    jobs_data = []
    for j in jobs:
        jobs_data.append({
            "id": j.id,
            "org_id": j.org_id,
            "title": j.title,
            "company": j.company,
            "department": j.department,
            "location": j.location,
            "type": j.type,
            "experience_min_years": j.experience_min_years,
            "salary_range": j.salary_range,
            "description": j.description,
            "pass_threshold": j.pass_threshold,
            "opening_date": j.opening_date.strftime("%Y-%m-%d %H:%M:%S") if hasattr(j.opening_date, "strftime") else str(j.opening_date),
            "application_deadline": j.application_deadline.strftime("%Y-%m-%d %H:%M:%S") if hasattr(j.application_deadline, "strftime") else str(j.application_deadline),
            "status": j.status,
            "created_at": j.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(j.created_at, "strftime") else str(j.created_at),
        })
        
    return {"jobs": jobs_data, "count": len(jobs_data)}

@router.post("/jobs/mock-deadline")
async def create_mock_job_with_deadline(
    title: str = Body("Lead Distributed Systems Engineer", embed=True),
    days_from_now: int = Body(21, embed=True),
    user_id: str = Body("cand-1", embed=True),
    db: Session = Depends(get_db)
):
    """
    Convenience endpoint to inject a mock job with a deadline exactly N days from now (defaults to 21)
    and save it for a candidate for instant verification.
    """
    now = datetime.now()
    deadline = now + timedelta(days=days_from_now)
    job_id = f"job-mock-{uuid.uuid4().hex[:8]}"
    save_id = f"save-{uuid.uuid4().hex[:8]}"
    
    new_job = Job(
        id=job_id,
        org_id="org-acme",
        company="Acme HyperScale Systems",
        title=title,
        department="Infrastructure Engineering",
        location="Bengaluru / Hybrid",
        type="Full-Time",
        experience_min_years=3.0,
        salary_range="₹32,00,000 - ₹44,00,000",
        description="Spearhead high-throughput distributed database replication and consensus engines.",
        pass_threshold=85,
        opening_date=now,
        application_deadline=deadline,
        critical_skills_json=json.dumps([{"id": "python", "name": "Python Core", "weight": 3.0}]),
        optional_skills_json=json.dumps([{"id": "docker", "name": "Docker", "weight": 1.0}]),
        status="active"
    )
    db.add(new_job)
    
    saved = SavedJob(
        id=save_id,
        user_id=user_id,
        job_id=job_id,
        saved_at=now
    )
    db.add(saved)
    db.commit()
    
    return {
        "success": True,
        "job_id": job_id,
        "title": title,
        "application_deadline": deadline.strftime("%Y-%m-%d %H:%M:%S"),
        "days_from_now": days_from_now,
        "user_id": user_id,
        "message": f"Mock job created and saved for {user_id}. Ready for cron worker run."
    }
