import datetime
from typing import Optional, List
from sqlalchemy import (
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(64), default="corporate")
    logo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    plan: Mapped[str] = mapped_column(String(64), default="Enterprise")
    seats_used: Mapped[int] = mapped_column(Integer, default=0)
    seats_total: Mapped[int] = mapped_column(Integer, default=25)
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="organization")
    subscriptions: Mapped[List["Subscription"]] = relationship(
        "Subscription", back_populates="organization"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="student", nullable=False)
    org_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    user_class: Mapped[str] = mapped_column(String(64), default="Fresher")
    college: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    experience_years: Mapped[float] = mapped_column(Float, default=0.0)
    readiness_score: Mapped[int] = mapped_column(Integer, default=70)
    current_tier: Mapped[str] = mapped_column(String(32), default="bridgeable")
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_skills_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="users")
    assessments: Mapped[List["Assessment"]] = relationship("Assessment", back_populates="user")
    dispatched_sprints: Mapped[List["DispatchedSprint"]] = relationship(
        "DispatchedSprint", back_populates="candidate"
    )
    verified_credentials: Mapped[List["VerifiedCredential"]] = relationship(
        "VerifiedCredential", back_populates="candidate"
    )


class OrganizationMembership(Base):
    __tablename__ = "organization_memberships"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(32), default="member")
    joined_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    __table_args__ = (UniqueConstraint("org_id", "user_id", name="uq_org_user"),)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    plan_id: Mapped[str] = mapped_column(String(64), default="enterprise")
    status: Mapped[str] = mapped_column(String(32), default="active")
    seats_purchased: Mapped[int] = mapped_column(Integer, default=25)
    billing_cycle: Mapped[str] = mapped_column(String(32), default="monthly")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    organization: Mapped["Organization"] = relationship("Organization", back_populates="subscriptions")


class DispatchedSprint(Base):
    __tablename__ = "dispatched_sprints"

    dispatch_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    candidate_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_name: Mapped[str] = mapped_column(String(255), nullable=False)
    candidate_email: Mapped[str] = mapped_column(String(255), nullable=False)
    skill_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    org_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    job_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="dispatched", nullable=False)
    dispatched_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    credential_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    invite_url: Mapped[str] = mapped_column(Text, nullable=False)

    candidate: Mapped["User"] = relationship("User", back_populates="dispatched_sprints")


class VerifiedCredential(Base):
    __tablename__ = "verified_credentials"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    candidate_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_email: Mapped[str] = mapped_column(String(255), nullable=False)
    skill_id: Mapped[str] = mapped_column(String(64), nullable=False)
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    passed_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    credential_hash: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )
    canonical_payload: Mapped[str] = mapped_column(Text, nullable=False)
    issued_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    verification_url: Mapped[str] = mapped_column(Text, nullable=False)

    candidate: Mapped["User"] = relationship("User", back_populates="verified_credentials")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=3.0)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, default=20)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(32), nullable=False)
    badge_tier: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    answers_log_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="assessments")


class AtsResume(Base):
    __tablename__ = "ats_resumes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parsed_json: Mapped[str] = mapped_column(Text, nullable=False)
    ats_score: Mapped[int] = mapped_column(Integer, default=85)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(255), default="Acme HyperScale Systems")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    type: Mapped[str] = mapped_column(String(64), default="Full-Time")
    experience_min_years: Mapped[float] = mapped_column(Float, default=0.0)
    salary_range: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pass_threshold: Mapped[int] = mapped_column(Integer, default=85)
    opening_date: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    application_deadline: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    critical_skills_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    optional_skills_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    job_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    saved_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_user_job"),)


class UserNotification(Base):
    __tablename__ = "user_notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    job_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(
        String(64), default="deadline_warning", nullable=False
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    trigger_date: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "job_id", "notification_type", "trigger_date", name="uq_user_notification"
        ),
    )
