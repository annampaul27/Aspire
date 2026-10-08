import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from services.interview_coach.api.routes import router

app = FastAPI(title="Test App")
app.include_router(router, prefix="/api/v1/interview")
client = TestClient(app)

def test_health_check_endpoint():
    res = client.get("/api/v1/interview/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "interview_coach"

def test_get_presets_endpoint():
    res = client.get("/api/v1/interview/presets")
    assert res.status_code == 200
    data = res.json()
    assert len(data["presets"]) >= 4
    roles = [p["role"] for p in data["presets"]]
    assert any("Backend" in r for r in roles)

def test_generate_question_endpoint():
    payload = {
        "role": "Cloud DevOps Engineer",
        "topic": "Kubernetes High Availability & RBAC",
        "difficulty": "senior"
    }
    res = client.post("/api/v1/interview/question", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "question_scenario" in data
    assert len(data["expected_keywords"]) >= 3
    assert len(data["hints"]) >= 1

def test_follow_up_probe_endpoint():
    payload = {
        "question_text": "How do you mitigate cache stampede?",
        "candidate_answer": "We set a Redis cache with a 5 minute TTL.",
        "role": "Senior Backend Engineer"
    }
    res = client.post("/api/v1/interview/follow-up", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "probe_question" in data
    assert "probe_focus" in data

def test_evaluate_session_endpoint():
    payload = {
        "question_id": "q-test-1",
        "role": "Senior Full-Stack Architect",
        "question_text": "How do you optimize slow queries in PostgreSQL?",
        "candidate_transcript": (
            "We run EXPLAIN ANALYZE to identify sequential scans, create targeted B-Tree indexes "
            "concurrently to prevent table locking, and tune autovacuum parameters to eliminate MVCC bloat."
        ),
        "audio_duration_seconds": 15.0,
        "eye_contact_ratio": 0.85,
        "head_stability_score": 88.0,
        "is_follow_up": False
    }
    res = client.post("/api/v1/interview/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "overall_hireability_score" in data
    assert "verdict" in data
    assert "speech_metrics" in data
    assert "vision_metrics" in data
    assert "radar_chart_data" in data
    assert data["overall_hireability_score"] >= 70.0
