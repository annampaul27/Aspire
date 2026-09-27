import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.entities import DispatchedSprint, VerifiedCredential, User, Organization

client = TestClient(app)

def get_token_for(email: str, role: str, org_id: str = None) -> str:
    payload = {
        "email": email,
        "password": "SkillSetu@2026",
        "role": role,
    }
    if org_id:
        payload["org_id"] = org_id
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

# --- 1. Audit §4.6: Unauthenticated Request Rejection ---
def test_unauthenticated_request_rejected():
    """Verify Audit §4.6: Endpoints without Bearer header are strictly rejected with 401."""
    res_dispatch = client.post("/api/v1/sprints/dispatch", json={
        "candidate_id": "cand-1",
        "candidate_name": "Aditya Verma",
        "candidate_email": "aditya.verma@example.com",
        "skill_id": "docker",
        "skill_name": "Docker & CI/CD",
    })
    assert res_dispatch.status_code == 401
    assert "Missing Authorization Bearer Header" in res_dispatch.json()["detail"]

    res_me = client.get("/api/v1/auth/me")
    assert res_me.status_code == 401

def test_invalid_token_rejected():
    """Verify Audit §4.6: Forged or malformed JWT tokens are rejected with 401."""
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer forged.token.signature"})
    assert res.status_code == 401
    assert "Cryptographic Token Expired or Invalid" in res.json()["detail"]

# --- 2. Audit §4.6: RBAC Role Authorization ---
def test_rbac_forbidden_for_unauthorized_role():
    """Verify Audit §4.6: Candidate (Student) token cannot dispatch recruiter sprints (403 Forbidden)."""
    student_token = get_token_for("aditya.verma@example.com", "student")
    res = client.post(
        "/api/v1/sprints/dispatch",
        json={
            "candidate_id": "cand-1",
            "candidate_name": "Aditya Verma",
            "candidate_email": "aditya.verma@example.com",
            "skill_id": "docker",
            "skill_name": "Docker & CI/CD",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 403
    assert "Forbidden: Action requires one of" in res.json()["detail"]
    assert "student" in res.json()["detail"]

# --- 3. Audit §4.5: Relational DB Sprint Persistence ---
def test_employer_sprint_dispatch_and_db_persistence():
    """Verify Audit §4.5: Employer dispatch saves record into relational DB (survives restart)."""
    employer_token = get_token_for("priya.sharma@acme.com", "employer", "org-acme")
    test_skill_id = f"test_skill_{uuid.uuid4().hex[:6]}"

    res = client.post(
        "/api/v1/sprints/dispatch",
        json={
            "candidate_id": "cand-1",
            "candidate_name": "Aditya Verma",
            "candidate_email": "aditya.verma@example.com",
            "skill_id": test_skill_id,
            "skill_name": "Distributed Systems & Raft",
            "org_id": "org-acme",
            "job_id": "job-fullstack-01",
        },
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert res.status_code == 200
    dispatch_data = res.json()
    dispatch_id = dispatch_data["dispatch_id"]
    assert dispatch_id.startswith("disp-")

    # Verify directly in relational DB via SQLAlchemy session
    db = SessionLocal()
    try:
        sprint_row = db.query(DispatchedSprint).filter(DispatchedSprint.dispatch_id == dispatch_id).first()
        assert sprint_row is not None, "Sprint dispatch row was not written to relational DB"
        assert sprint_row.candidate_id == "cand-1"
        assert sprint_row.skill_id == test_skill_id
        assert sprint_row.status == "dispatched"
        assert sprint_row.org_id == "org-acme"
    finally:
        db.close()

# --- 4. Audit §4.5 & §5.5: Credential Minting & DB Verification ---
def test_sprint_completion_minting_and_db_persistence():
    """Verify Audit §4.5 & §5.5: Completing sprint mints SHA-256 micro-credential into verified_credentials."""
    employer_token = get_token_for("priya.sharma@acme.com", "employer", "org-acme")

    # 1. First dispatch a sprint
    disp_res = client.post(
        "/api/v1/sprints/dispatch",
        json={
            "candidate_id": "cand-1",
            "candidate_name": "Aditya Verma",
            "candidate_email": "aditya.verma@example.com",
            "skill_id": "react_hydration",
            "skill_name": "React 19 Server Components & Hydration",
            "org_id": "org-acme",
        },
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert disp_res.status_code == 200
    dispatch_id = disp_res.json()["dispatch_id"]

    # 2. Complete the sprint with score >= 80%
    comp_res = client.post(
        "/api/v1/sprints/complete",
        json={
            "candidate_id": "cand-1",
            "candidate_name": "Aditya Verma",
            "candidate_email": "aditya.verma@example.com",
            "skill_id": "react_hydration",
            "skill_name": "React 19 Server Components & Hydration",
            "score": 94,
            "passed_questions": 5,
            "total_questions": 5,
            "dispatch_id": dispatch_id,
        },
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["is_verified"] is True
    cred_hash = comp_data["credential_hash"]
    assert len(cred_hash) == 64

    # 3. Verify directly in verified_credentials database table
    db = SessionLocal()
    try:
        cred_row = db.query(VerifiedCredential).filter(VerifiedCredential.credential_hash == cred_hash).first()
        assert cred_row is not None, "Credential record not found in verified_credentials table"
        assert cred_row.candidate_email == "aditya.verma@example.com"
        assert cred_row.score == 94
        assert cred_row.skill_id == "react_hydration"

        # Verify dispatched sprint record was marked passed
        sprint_row = db.query(DispatchedSprint).filter(DispatchedSprint.dispatch_id == dispatch_id).first()
        assert sprint_row.status == "passed"
        assert sprint_row.credential_hash == cred_hash

        # Verify candidate profile tier was boosted to job_ready
        cand_user = db.query(User).filter(User.id == "cand-1").first()
        assert cand_user.readiness_score == 92
        assert cand_user.current_tier == "job_ready"
    finally:
        db.close()

# --- 5. Admin Governance ---
def test_admin_superuser_access():
    """Verify Platform Superuser has full RBAC oversight."""
    admin_token = get_token_for("root@skillsetu.ai", "admin")
    res = client.get("/api/v1/sprints/active", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

# --- 6. Relational Schema Integrity ---
def test_relational_schema_tables():
    """Verify that all enterprise relational tables exist in DB."""
    db = SessionLocal()
    try:
        org_count = db.query(Organization).count()
        assert org_count >= 3, "Expected at least 3 seeded organizations"
        user_count = db.query(User).count()
        assert user_count >= 3, "Expected at least 3 seeded users"
    finally:
        db.close()

if __name__ == "__main__":
    pytest.main(["-v", "test_sprint1_rbac_and_persistence.py"])
