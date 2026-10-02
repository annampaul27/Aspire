import sys
import os
import uuid
import logging
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, List

# Ensure parent directory is in python path when run as script
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import select, func, or_
from app.db.session import SessionLocal
from app.models.entities import SavedJob, Job, User, UserNotification

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("notification_worker")

def run_deadline_notifications_job(reference_date: Optional[date] = None) -> Dict[str, Any]:
    """
    FR-04 3-Week (21-Day) Deadline & Strategic Application Notification Worker.
    
    Logic:
    - Calculates target_date = reference_date (defaults to today) + 21 days (3 weeks).
    - Queries database for any saved jobs where application_deadline or opening_date
      matches target_date.
    - Generates user_notifications records with formatted action messages.
    """
    if reference_date is None:
        reference_date = datetime.now().date()
        
    target_date = reference_date + timedelta(days=21)
    target_date_str = target_date.strftime("%Y-%m-%d")
    current_date_str = reference_date.strftime("%Y-%m-%d")
    
    logger.info("=" * 60)
    logger.info("Executing FR-04 Strategic Notification Worker")
    logger.info(f"System Reference Date : {current_date_str}")
    logger.info(f"Target 3-Week Date     : {target_date_str} (Exactly 21 days ahead)")
    logger.info("=" * 60)
    
    created_count = 0
    notifications_created = []
    
    with SessionLocal() as db:
        stmt = (
            select(
                SavedJob.user_id,
                User.email,
                User.full_name.label("user_name"),
                Job.id.label("job_id"),
                Job.title.label("job_title"),
                Job.application_deadline,
                Job.opening_date,
                func.date(Job.application_deadline).label("deadline_date"),
                func.date(Job.opening_date).label("opening_date_only")
            )
            .join(Job, SavedJob.job_id == Job.id)
            .join(User, SavedJob.user_id == User.id)
            .where(
                or_(
                    func.date(Job.application_deadline) == target_date_str,
                    func.date(Job.opening_date) == target_date_str
                )
            )
        )
        
        matches = db.execute(stmt).all()
        
        for row in matches:
            user_id = row.user_id
            job_id = row.job_id
            job_title = row.job_title
            deadline_date = str(row.deadline_date) if row.deadline_date else ""
            opening_date_only = str(row.opening_date_only) if row.opening_date_only else ""
            
            # Check if deadline is exactly 21 days out
            if deadline_date == target_date_str:
                notification_type = "deadline_warning"
                message = (
                    f"Action Required: The application window for {job_title} "
                    f"closes in exactly 3 weeks on {deadline_date}."
                )
                
                # Check for existing notification
                existing = db.execute(
                    select(UserNotification).where(
                        UserNotification.user_id == user_id,
                        UserNotification.job_id == job_id,
                        UserNotification.notification_type == notification_type,
                        func.date(UserNotification.trigger_date) == current_date_str
                    )
                ).scalar_one_or_none()
                
                if not existing:
                    notif_id = f"notif-{uuid.uuid4().hex[:12]}"
                    notif = UserNotification(
                        id=notif_id,
                        user_id=user_id,
                        job_id=job_id,
                        message=message,
                        notification_type=notification_type,
                        is_read=False,
                        trigger_date=datetime.combine(reference_date, datetime.min.time()),
                        created_at=datetime.now()
                    )
                    db.add(notif)
                    db.commit()
                    created_count += 1
                    notifications_created.append({
                        "id": notif_id,
                        "user_id": user_id,
                        "user_name": row.user_name,
                        "job_id": job_id,
                        "job_title": job_title,
                        "type": notification_type,
                        "message": message,
                        "trigger_date": current_date_str
                    })
                    logger.info(f"Generated alert for {row.user_name} ({user_id}): {message}")
                else:
                    logger.info(f"Duplicate alert skipped for user {user_id} and job {job_id} on {current_date_str}")
                    
            # Check if opening date is exactly 21 days out
            if opening_date_only == target_date_str:
                notification_type = "opening_warning"
                message = (
                    f"Upcoming Opportunity: The application window for {job_title} "
                    f"opens in exactly 3 weeks on {opening_date_only}."
                )
                
                existing = db.execute(
                    select(UserNotification).where(
                        UserNotification.user_id == user_id,
                        UserNotification.job_id == job_id,
                        UserNotification.notification_type == notification_type,
                        func.date(UserNotification.trigger_date) == current_date_str
                    )
                ).scalar_one_or_none()
                
                if not existing:
                    notif_id = f"notif-{uuid.uuid4().hex[:12]}"
                    notif = UserNotification(
                        id=notif_id,
                        user_id=user_id,
                        job_id=job_id,
                        message=message,
                        notification_type=notification_type,
                        is_read=False,
                        trigger_date=datetime.combine(reference_date, datetime.min.time()),
                        created_at=datetime.now()
                    )
                    db.add(notif)
                    db.commit()
                    created_count += 1
                    notifications_created.append({
                        "id": notif_id,
                        "user_id": user_id,
                        "user_name": row.user_name,
                        "job_id": job_id,
                        "job_title": job_title,
                        "type": notification_type,
                        "message": message,
                        "trigger_date": current_date_str
                    })
                    logger.info(f"Generated opening alert for {row.user_name} ({user_id}): {message}")
                else:
                    logger.info(f"Duplicate opening alert skipped for user {user_id} and job {job_id} on {current_date_str}")
                    
    logger.info(f"Summary: Matches Found: {len(matches)}, Notifications Created: {created_count}")
    return {
        "status": "success",
        "reference_date": current_date_str,
        "target_3_week_date": target_date_str,
        "matches_found": len(matches),
        "notifications_created": created_count,
        "details": notifications_created
    }

if __name__ == "__main__":
    result = run_deadline_notifications_job()
    print("\n--- CLI RUNNER RESULT ---")
    print(f"Status: {result['status']}")
    print(f"Reference Date: {result['reference_date']}")
    print(f"Target Date (3 weeks ahead): {result['target_3_week_date']}")
    print(f"Matches Found: {result['matches_found']}")
    print(f"Notifications Created: {result['notifications_created']}")
    for notif in result["details"]:
        print(f" -> [{notif['user_name']}] {notif['message']}")
