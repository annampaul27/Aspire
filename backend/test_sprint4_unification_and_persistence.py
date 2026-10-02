import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.db.session import SessionLocal
from app.models.entities import (
    User,
    Organization,
    OrganizationMembership,
    Job,
    SavedJob,
    UserNotification,
    Assessment,
    AtsResume,
)

client = TestClient(app)

class TestSprint4DatabaseUnificationAndAuthPersistence:
    """
    Sprint 4 Comprehensive 360-Degree Test Suite:
    Validates end-to-end relational database unification, multi-tenant persistence,
    SQLAlchemy ORM session consistency, and authentication security.
    """

    @pytest.fixture(autouse=True)
    def setup_unique_session(self):
        self.suffix = uuid.uuid4().hex[:8]
        self.test_email = f"candidate_{self.suffix}@aspire-ai.io"
        self.test_password = "SecurePassword@2026"
        self.test_name = f"Test Candidate {self.suffix}"

    # -------------------------------------------------------------------------
    # 1. User Registration, Bcrypt Hashing & Relational DB Persistence
    # -------------------------------------------------------------------------
    def test_user_registration_and_db_persistence(self):
        # Register new student user
        payload = {
            "email": self.test_email,
            "password": self.test_password,
            "full_name": self.test_name,
            "role": "student",
            "college": "Stanford Graduate Institute",
        }
        res = client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 200, f"Registration failed: {res.text}"
        data = res.json()
        assert "access_token" in data
        user_info = data["user"]
        assert user_info["email"] == self.test_email
        assert user_info["full_name"] == self.test_name
        assert user_info["role"] == "student"
        created_user_id = user_info["id"]

        # Directly query SQLAlchemy database session to verify DB persistence
        with SessionLocal() as db:
            db_user = db.execute(select(User).where(User.id == created_user_id)).scalar_one_or_none()
            assert db_user is not None
            assert db_user.email == self.test_email
            assert db_user.college == "Stanford Graduate Institute"
            assert db_user.password_hash != self.test_password  # Must be hashed!
            assert len(db_user.password_hash) > 20

        # Attempt duplicate registration -> Must be rejected with 400
        dup_res = client.post("/api/v1/auth/register", json=payload)
        assert dup_res.status_code == 400
        assert "already exists" in dup_res.json()["detail"].lower()

    # -------------------------------------------------------------------------
    # 2. Authentication & JWT Scoping across Independent Sessions
    # -------------------------------------------------------------------------
    def test_auth_login_jwt_token_and_profile_retrieval(self):
        # Register user
        reg_payload = {
            "email": self.test_email,
            "password": self.test_password,
            "full_name": self.test_name,
            "role": "student",
        }
        reg_res = client.post("/api/v1/auth/register", json=reg_payload)
        assert reg_res.status_code == 200

        # Login with correct credentials
        login_res = client.post("/api/v1/auth/login", json={
            "email": self.test_email,
            "password": self.test_password,
            "role": "student"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token_data = login_res.json()
        assert "access_token" in token_data
        jwt_token = token_data["access_token"]
        assert token_data["user"]["email"] == self.test_email

        # Query protected /api/v1/auth/me with Bearer token
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {jwt_token}"})
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["email"] == self.test_email
        assert me_data["full_name"] == self.test_name

        # Wrong password rejection
        bad_pw_res = client.post("/api/v1/auth/login", json={
            "email": self.test_email,
            "password": "WrongPassword!999",
            "role": "student"
        })
        assert bad_pw_res.status_code == 401

        # Role mismatch rejection
        wrong_role_res = client.post("/api/v1/auth/login", json={
            "email": self.test_email,
            "password": self.test_password,
            "role": "employer"
        })
        assert wrong_role_res.status_code == 403

    # -------------------------------------------------------------------------
    # 3. Multi-Tenant Scoping & Organization Listing
    # ---------------------------------------------------------
    def test_multi_tenant_orgs_and_employer_scoping(self):
        # List organizations from persistent database
        orgs_res = client.get("/api/v1/auth/organizations")
        assert orgs_res.status_code == 200
        orgs = orgs_res.json()
        assert isinstance(orgs, list)
        assert len(orgs) >= 3
        org_ids = [o["id"] for o in orgs]
        assert "org-acme" in org_ids

        # Employer login with correct org scoping
        emp_login = client.post("/api/v1/auth/login", json={
            "email": "priya.sharma@acme.com",
            "password": "AspireAI@2026",
            "role": "employer",
            "org_id": "org-acme"
        })
        assert emp_login.status_code == 200
        emp_token = emp_login.json()["access_token"]

        # Profile /me verification for employer
        emp_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {emp_token}"})
        assert emp_me.status_code == 200
        assert emp_me.json()["org_id"] == "org-acme"
        assert emp_me.json()["org_name"] == "Acme HyperScale Systems"

        # Invalid tenant org request rejection
        bad_tenant = client.post("/api/v1/auth/login", json={
            "email": "priya.sharma@acme.com",
            "password": "AspireAI@2026",
            "role": "employer",
            "org_id": "org-fake-nonexistent"
        })
        assert bad_tenant.status_code == 404

    # -------------------------------------------------------------------------
    # 4. Job Ingestion, Matching & Notification Generation via SQLAlchemy
    # -------------------------------------------------------------------------
    def test_job_ingestion_and_notification_workflow(self):
        job_title = f"Staff Reliability Engineer {self.suffix}"
        job_payload = {
            "title": job_title,
            "company": "Datadog Cloud",
            "description": "High throughput telemetry and distributed trace processing.",
            "required_skills": ["Python", "Docker", "Kubernetes"],
            "threshold": 75.0,
            "days_until_deadline": 21
        }

        # Ingest incoming job
        ingest_res = client.post("/api/v1/jobs/incoming", json=job_payload)
        assert ingest_res.status_code == 202
        ingest_data = ingest_res.json()
        job_id = ingest_data["job_id"]
        assert ingest_data["status"] == "received"

        # Verify job details stored in SQLAlchemy database
        with SessionLocal() as db:
            db_job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
            assert db_job is not None
            assert db_job.title == job_title
            assert db_job.company == "Datadog Cloud"

        # Fetch job details endpoint
        details_res = client.get(f"/api/v1/jobs/{job_id}")
        assert details_res.status_code == 200
        assert details_res.json()["title"] == job_title

    # -------------------------------------------------------------------------
    # 5. Assessments Grading & Historical Log Persistence
    # -------------------------------------------------------------------------
    def test_assessment_flow_and_score_persistence(self):
        # 1. Fetch questions for postgresql skill
        q_res = client.get("/api/v1/assessments/postgresql/questions")
        assert q_res.status_code == 200
        q_data = q_res.json()
        assert "questions" in q_data
        assert q_data["total_questions"] == 20

        # Build answers for 18 questions correct (90% Gold)
        from app.api.v1.assessments import SKILL_QUESTION_BANKS
        bank = SKILL_QUESTION_BANKS["postgresql"]
        answers = {}
        for idx, q in enumerate(bank):
            if idx < 18:
                answers[q["id"]] = q["correct_option_index"]
            else:
                answers[q["id"]] = (q["correct_option_index"] + 1) % 4

        # 2. Grade assessment
        submission_payload = {
            "user_id": "cand-1",
            "skill_id": "postgresql",
            "answers": answers,
            "time_taken_seconds": 400
        }
        grade_res = client.post("/api/v1/assessments/grade", json=submission_payload)
        assert grade_res.status_code == 200
        result = grade_res.json()
        assert result["score"] == 90
        assert result["verification_status"] == "Passed"
        assert result["badge_tier"] == "Gold"
        assessment_id = result["assessment_id"]

        # 3. Verify record in SQLAlchemy database
        with SessionLocal() as db:
            db_assessment = db.execute(select(Assessment).where(Assessment.id == assessment_id)).scalar_one_or_none()
            assert db_assessment is not None
            assert db_assessment.score == 90
            assert db_assessment.badge_tier == "Gold"
            assert db_assessment.user_id == "cand-1"

        # 4. Check assessment history endpoint
        hist_res = client.get("/api/v1/assessments/user/cand-1/history")
        assert hist_res.status_code == 200
        history = hist_res.json()
        assert any(item["id"] == assessment_id for item in history)

    # -------------------------------------------------------------------------
    # 6. ATS Resume Parsing Storage & Retrieval Persistence
    # -------------------------------------------------------------------------
    def test_ats_resume_persistence(self):
        sample_resume = {
            "personal_info": {
                "full_name": self.test_name,
                "email": self.test_email,
                "phone": "+91 98765 43210",
                "location": "Bengaluru, India"
            },
            "summary": "Full Stack & Distributed Systems Engineer with expertise in Python & Cloud.",
            "skills": {
                "core_technical": ["PostgreSQL", "Python", "FastAPI"],
                "frameworks_and_tools": ["Docker", "Kubernetes"],
                "soft_skills": ["Architectural Leadership"]
            },
            "work_experience": [
                {
                    "company": "Nexus Scale Labs",
                    "role": "Senior Engineer",
                    "start_date": "2023",
                    "end_date": "Present",
                    "current": True,
                    "location": "Bengaluru",
                    "bullet_points": ["Engineered async pipeline processing 1M events/day"]
                }
            ],
            "education": [
                {
                    "institution": "IIIT",
                    "degree": "B.Tech in Computer Science",
                    "field_of_study": "Computer Science",
                    "graduation_year": "2023"
                }
            ],
            "projects": [
                {
                    "title": "Distributed Task Queue",
                    "tech_stack": ["Python", "Redis", "Celery"],
                    "description": "Implemented high performance async worker pool in Python."
                }
            ],
            "certifications": ["AWS Certified Solutions Architect"],
            "ats_metadata": {
                "ats_score": 96,
                "readability_score": "High",
                "format_compliance": "ATS-100 Compliant",
                "keyword_density_score": 95
            }
        }

        save_payload = {
            "user_id": "cand-1",
            "user_class": "Experienced",
            "file_name": f"{self.suffix}_ATS_Resume.pdf",
            "resume_data": sample_resume
        }

        # Save ATS Profile
        save_res = client.post("/api/v1/resume/save-profile", json=save_payload)
        assert save_res.status_code == 200
        save_data = save_res.json()
        assert save_data["success"] is True
        assert save_data["ats_score"] == 96
        resume_id = save_data["resume_id"]

        # Verify in SQLAlchemy database
        with SessionLocal() as db:
            db_resume = db.execute(select(AtsResume).where(AtsResume.id == resume_id)).scalar_one_or_none()
            assert db_resume is not None
            assert db_resume.ats_score == 96
            assert db_resume.user_id == "cand-1"

        # Retrieve latest ATS resume
        get_res = client.get("/api/v1/resume/user/cand-1/latest")
        assert get_res.status_code == 200
        latest_data = get_res.json()
        assert latest_data["ats_score"] == 96
        assert latest_data["data"]["personal_info"]["full_name"] == self.test_name

    # -------------------------------------------------------------------------
    # 7. Notifications Lifecycle & Read State Updates
    # -------------------------------------------------------------------------
    def test_notifications_lifecycle(self):
        # Create a mock job with 21 days deadline for cand-1
        mock_job_res = client.post("/api/v1/notifications/jobs/mock-deadline", json={
            "title": f"Senior Cloud Architect {self.suffix}",
            "days_from_now": 21,
            "user_id": "cand-1"
        })
        assert mock_job_res.status_code == 200

        # Trigger cron worker
        worker_res = client.post("/api/v1/notifications/trigger-cron")
        assert worker_res.status_code == 200
        assert worker_res.json()["status"] == "success"

        # Fetch notifications for cand-1
        notif_res = client.get("/api/v1/notifications?user_id=cand-1")
        assert notif_res.status_code == 200
        notifs = notif_res.json()["notifications"]
        assert len(notifs) > 0

        # Mark first notification as read
        first_id = notifs[0]["id"]
        read_res = client.patch(f"/api/v1/notifications/{first_id}/read")
        assert read_res.status_code == 200
        assert read_res.json()["is_read"] is True

        # Mark all as read
        mark_all_res = client.post("/api/v1/notifications/mark-all-read", json={"user_id": "cand-1"})
        assert mark_all_res.status_code == 200
        assert mark_all_res.json()["success"] is True

        # Verify all are read now
        after_res = client.get("/api/v1/notifications?user_id=cand-1")
        assert after_res.json()["unread_count"] == 0
