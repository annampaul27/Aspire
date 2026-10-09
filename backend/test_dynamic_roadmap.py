from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dynamic_roadmap_generation_with_catalog_courses():
    """
    Verify Task 5 & Audit §4.4:
    Calling /api/v1/career-compass/roadmap with skill gaps (e.g. SQL, Python)
    generates a personalized course roadmap populated with authentic curriculum phases
    from the local courses/ catalog.
    """
    payload = {
        "target_role": "Data Systems Architect",
        "current_skills": ["Excel", "HTML"],
        "skill_gaps": [
            {"skill": "SQL", "priority": "High"},
            {"skill": "Python", "priority": "High"}
        ],
        "weekly_hours": 6
    }

    res = client.post("/api/v1/career-compass/roadmap", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Verify structured requirements preservation (backwards compatibility)
    assert data["target_role"] == "Data Systems Architect"
    assert "current_skills" in data
    assert "skill_gaps" in data

    # Verify dynamic course catalog phases integration
    assert "phases" in data
    phases = data["phases"]
    assert len(phases) >= 2

    # Verify real courses matched and lessons loaded
    phase_course_names = [(p.get("title") or p.get("skill") or "").lower() for p in phases]
    assert any("python" in name or "sql" in name for name in phase_course_names)
    assert any(len(p.get("lessons", [])) > 0 for p in phases)

    # Verify completion rules and duration
    assert data["total_course_duration_hours"] > 0
    assert "completion_rule" in data
    assert data["completion_rule"]["passing_score"] == 60


def test_dynamic_roadmap_with_external_learning_fallback():
    """
    Verify that skills without direct local courses catalog entries (e.g. Kubernetes, Rust)
    are routed to external_learning recommendations without failing the roadmap pipeline.
    """
    payload = {
        "target_role": "Platform Engineer",
        "current_skills": ["Linux"],
        "skill_gaps": [
            {"skill": "Kubernetes Orchestration", "priority": "High"},
            {"skill": "Rust Concurrency", "priority": "Medium"}
        ],
        "weekly_hours": 5
    }

    res = client.post("/api/v1/career-compass/roadmap", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["target_role"] == "Platform Engineer"
    assert "external_learning" in data
    ext_skills = [item["skill"].lower() for item in data["external_learning"]]
    assert any("kubernetes" in s or "rust" in s for s in ext_skills)
