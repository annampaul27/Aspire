import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_interview_coach_health_integration():
    res = client.get("/api/v1/interview-coach/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "interview_coach"

def test_interview_coach_presets_integration():
    res = client.get("/api/v1/interview-coach/presets")
    assert res.status_code == 200
    data = res.json()
    assert len(data["presets"]) >= 4

def test_interview_coach_generate_question_integration():
    res = client.post(
        "/api/v1/interview-coach/question",
        json={
            "role": "Senior Full-Stack Architect",
            "topic": "PostgreSQL Index Tuning & MVCC",
            "difficulty": "senior"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "question_scenario" in data
    assert len(data["expected_keywords"]) >= 3
    assert len(data["hints"]) >= 1

def test_interview_coach_follow_up_integration():
    res = client.post(
        "/api/v1/interview-coach/follow-up",
        json={
            "question_text": "How do you mitigate cache stampede?",
            "candidate_answer": "We will place a Redis cache layer in front of the database with TTL.",
            "role": "Senior Backend Engineer"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "probe_question" in data
    assert len(data["probe_question"]) > 15

def test_interview_coach_evaluate_integration():
    res = client.post(
        "/api/v1/interview-coach/evaluate",
        json={
            "question_id": "q-integ-1",
            "role": "Senior Backend Engineer",
            "question_text": "Architect an idempotent microservices pipeline.",
            "candidate_transcript": (
                "We use Kafka for asynchronous event ingestion with a transactional outbox pattern. "
                "Consumers check for duplicate idempotency keys in Redis before executing business logic, "
                "and route poison-pill records to a dead-letter queue."
            ),
            "audio_duration_seconds": 18.0,
            "eye_contact_ratio": 0.88,
            "head_stability_score": 92.0,
            "is_follow_up": False
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["overall_hireability_score"] >= 80.0
    assert data["verdict"] in ["Strong Hire", "Hire"]
    assert "Technical Accuracy" in data["radar_chart_data"]

def test_interview_coach_backward_compatibility_alias():
    res = client.get("/api/interview-coach/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
