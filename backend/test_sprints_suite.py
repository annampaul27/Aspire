import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_employer_auth_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": "priya.sharma@acme.com",
        "password": "AspireAI@2026",
        "role": "employer",
        "org_id": "org-acme",
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_dispatch_gap_sprint_rbac_enforcement():
    """Verify Audit §4.6: Unauthenticated sprint dispatch is rejected with 401."""
    payload = {
        "candidate_id": "cand-1",
        "candidate_name": "Aditya Verma",
        "candidate_email": "aditya.verma@example.com",
        "skill_id": "postgres_optimization",
        "skill_name": "PostgreSQL Indexing & Query Tuning",
        "org_id": "org-acme",
        "job_id": "job-fullstack-01",
    }
    response = client.post("/api/v1/sprints/dispatch", json=payload)
    assert response.status_code == 401
    assert "Missing Authorization Bearer Header" in response.json()["detail"]

def test_dispatch_gap_sprint():
    """Verify E6 & RBAC: 1-Click Gap Sprint Dispatch succeeds with valid Employer Bearer token."""
    headers = get_employer_auth_headers()
    payload = {
        "candidate_id": "cand-1",
        "candidate_name": "Aditya Verma",
        "candidate_email": "aditya.verma@example.com",
        "skill_id": "postgres_optimization",
        "skill_name": "PostgreSQL Indexing & Query Tuning",
        "org_id": "org-acme",
        "job_id": "job-fullstack-01"
    }
    response = client.post("/api/v1/sprints/dispatch", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["dispatch_id"].startswith("disp-")
    assert data["status"] == "dispatched"
    assert "invite_url" in data
    assert "postgres_optimization" in data["invite_url"]

def test_get_active_sprints():
    """Verify retrieval of active dispatched sprints with authenticated headers."""
    headers = get_employer_auth_headers()
    response = client.get("/api/v1/sprints/active", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(s["candidate_id"] == "cand-1" for s in data)

def test_complete_gap_sprint_and_realtime_liquidity():
    """Verify E9: Authenticated candidate/employer score boost and SHA-256 credential minting."""
    headers = get_employer_auth_headers()
    payload = {
        "candidate_id": "cand-1",
        "candidate_name": "Aditya Verma",
        "candidate_email": "aditya.verma@example.com",
        "skill_id": "postgres_optimization",
        "skill_name": "PostgreSQL Indexing & Query Tuning",
        "score": 92,
        "passed_questions": 3,
        "total_questions": 3,
    }
    response = client.post("/api/v1/sprints/complete", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_verified"] is True
    assert data["credential_hash"] is not None
    assert len(data["credential_hash"]) == 64  # Valid SHA-256 hex string
    assert data["boosted_score"] >= 85
    assert data["new_tier"] == "job_ready"
    assert data["elevated_on_radar"] is True
    assert "JOB-READY" in data["liquidity_message"]

if __name__ == "__main__":
    pytest.main(["-v", "test_sprints_suite.py"])
