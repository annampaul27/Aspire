from fastapi.testclient import TestClient
from app.main import app
from app.core.matching_engine import calculate_match_percentage

client = TestClient(app)

def test_calculate_match_percentage():
    # Exactly matching skills
    cand_skills = ["Python", "FastAPI", "PostgreSQL", "Docker"]
    job_skills = ["python", "fastapi", "postgresql"]
    res = calculate_match_percentage(cand_skills, job_skills)
    assert res["match_percentage"] == 100.0
    assert res["is_eligible_match"] is True

    # Partial match
    cand_skills = ["Python", "Docker"]
    job_skills = ["Python", "FastAPI", "Docker", "Kubernetes"]
    res_partial = calculate_match_percentage(cand_skills, job_skills)
    assert res_partial["match_percentage"] == 50.0
    assert res_partial["is_eligible_match"] is False

    # Empty job skills
    res_empty = calculate_match_percentage(["Python"], [])
    assert res_empty["match_percentage"] == 100.0


def test_incoming_job_ingestion_and_matching():
    payload = {
        "title": "Backend Systems Engineer",
        "company": "Stripe",
        "description": "Looking for high scale Python and PostgreSQL backend engineers.",
        "required_skills": ["Python", "PostgreSQL", "FastAPI"],
        "threshold": 80.0
    }
    response = client.post("/api/v1/jobs/incoming", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "received"
    assert "job_id" in data
    assert data["title"] == "Backend Systems Engineer"
    assert data["company"] == "Stripe"

    job_id = data["job_id"]

    # Test GET job details via /api/v1/jobs/{job_id} and root alias /api/jobs/{job_id}
    res_details = client.get(f"/api/v1/jobs/{job_id}")
    assert res_details.status_code == 200
    job_info = res_details.json()
    assert job_info["title"] == "Backend Systems Engineer"
    assert "PostgreSQL" in job_info["required_skill_names"] or "postgresql" in [s.lower() for s in job_info["required_skill_names"]]

    res_alias = client.get(f"/api/jobs/{job_id}")
    assert res_alias.status_code == 200
    assert res_alias.json()["id"] == job_id


def test_user_notifications_and_read_status():
    # Get notifications for cand-1
    res = client.get("/api/v1/notifications?user_id=cand-1")
    assert res.status_code == 200
    notifs = res.json()["notifications"]
    assert isinstance(notifs, list)

    if notifs:
        target_id = notifs[0]["id"]
        # Mark as read
        patch_res = client.patch(f"/api/v1/notifications/{target_id}/read")
        assert patch_res.status_code == 200
        patch_data = patch_res.json()
        assert patch_data["success"] is True
        assert patch_data["is_read"] is True


def test_trigger_deadline_cron_check():
    res = client.post("/api/v1/notifications/trigger-cron")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "matches_found" in data
    assert "notifications_created" in data
