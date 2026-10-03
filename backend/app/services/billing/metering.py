from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from app.models.entities import Subscription, Job, Organization
from app.services.billing.catalog import get_plan_by_id

class QuotaEnforcementService:
    """
    Multi-tenant Usage Metering & Plan Quota Enforcement Engine (Milestone 5).
    Guards platform resources against plan limit overages with HTTP 402 Payment Required.
    """

    @staticmethod
    def check_job_creation_quota(db: Session, org_id: Optional[str]):
        """
        Verifies that an organization has not reached its concurrent active job requisition limit.
        """
        if not org_id:
            return  # Platform-wide or public requisition

        sub = db.execute(
            select(Subscription)
            .where(and_(Subscription.org_id == org_id, Subscription.status == "active"))
            .order_by(Subscription.created_at.desc())
        ).scalars().first()

        plan_def = get_plan_by_id(sub.plan_id) if (sub and sub.plan_id) else None
        if sub and sub.active_jobs_limit is not None:
            limit = sub.active_jobs_limit
        elif plan_def:
            limit = plan_def.limits.active_jobs
        else:
            limit = 3

        if limit == -1:
            return  # Unlimited enterprise tier

        active_jobs_count = db.execute(
            select(func.count(Job.id))
            .where(and_(Job.org_id == org_id, Job.status == "active"))
        ).scalar() or 0

        if active_jobs_count >= limit:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    f"Active Job Requisitions Quota Reached ({active_jobs_count}/{limit}). "
                    f"Please upgrade to Growth (10 reqs) or Enterprise (Unlimited reqs) in Billing."
                ),
            )

    @staticmethod
    def check_and_record_candidate_evaluation(db: Session, org_id: Optional[str], count: int = 1):
        """
        Checks monthly candidate evaluation quota and increments meter counter.
        """
        if not org_id:
            return

        sub = db.execute(
            select(Subscription)
            .where(and_(Subscription.org_id == org_id, Subscription.status == "active"))
            .order_by(Subscription.created_at.desc())
        ).scalars().first()

        if not sub:
            return

        plan_def = get_plan_by_id(sub.plan_id) if (sub and sub.plan_id) else None
        if sub and sub.evaluations_limit is not None:
            eval_limit = sub.evaluations_limit
        elif plan_def:
            eval_limit = plan_def.limits.candidate_evaluations_monthly
        else:
            eval_limit = 25

        if eval_limit != -1 and (sub.evaluations_used + count) > eval_limit:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    f"Monthly Candidate Evaluation Quota Exceeded ({sub.evaluations_used}/{eval_limit}). "
                    f"Upgrade your subscription to increase evaluation capacity."
                ),
            )

        sub.evaluations_used += count
        db.commit()

quota_service = QuotaEnforcementService()
