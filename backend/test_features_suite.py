"""
Unit & Integration Test Suite for CareerCompass Feature Modules
Authored by Jayasree A B (branch: features)
"""

from fastapi.testclient import TestClient
from app.main import app

from features.career_roadmap import (
    prepare_career_roadmap,
    create_roadmap_phase,
    get_career_roadmap_requirements,
)
from features.github_analysis import (
    prepare_github_analysis,
    get_github_analysis_requirements,
)
from features.interview_coach import (
    prepare_interview_question,
    build_interview_question,
    prepare_answer_evaluation,
    build_interview_evaluation,
)
from features.job_market_analysis import (
    prepare_job_market_analysis,
    classify_demand,
    build_market_result,
)
from features.portfolio_builder import prepare_portfolio
from features.resume_analysis import (
    prepare_resume_analysis,
    get_resume_analysis_requirements,
)
from features.skill_gap_analysis import (
    prepare_skill_gap_analysis,
    build_competency_area,
)

client = TestClient(app)


def test_career_roadmap_module():
    res = prepare_career_roadmap(
        target_role="Full Stack Engineer",
        current_skills=["React", "TypeScript", "Node.js"],
        skill_gaps=[{"skill": "PostgreSQL Optimization", "priority": "High"}],
        candidate_profile="Junior developer seeking promotion",
    )
    assert res["target_role"] == "Full Stack Engineer"
    assert res["roadmap_requirements"]["duration_days"] == 90
    assert len(res["current_skills"]) == 3

    phase = create_roadmap_phase(
        phase_name="Core DB",
        duration="30 days",
        goals=["Learn indexing"],
        skills=["Postgres"],
        activities=["Optimize slow queries"],
    )
    assert phase["phase"] == "Core DB"

    reqs = get_career_roadmap_requirements()
    assert reqs["duration"] == "90 days"
    assert "Foundation" in reqs["suggested_phases"]


def test_github_analysis_module():
    res = prepare_github_analysis(
        repository_name="skill-verification",
        repository_url="https://github.com/test/skill-verification",
        files=["main.py", "README.md"],
        file_content="print('Skill Verification')",
    )
    assert res["repository_name"] == "skill-verification"
    assert res["analysis_requirements"]["assess_complexity"] is True

    reqs = get_github_analysis_requirements()
    assert "Complexity rating" in reqs
    assert "Resume bullet points" in reqs


def test_interview_coach_module():
    prep = prepare_interview_question(
        role="Backend Architect",
        topic="Database Indexing & Concurrency",
    )
    assert prep["role"] == "Backend Architect"

    q = build_interview_question(
        question_id="q-001",
        question_text="Explain MVCC in PostgreSQL.",
        expected_keywords=["WAL", "vacuum", "snapshots", "isolation"],
        hints=["Think about isolation levels.", "Consider VACUUM cleanups."],
    )
    assert q["question_id"] == "q-001"

    ans_prep = prepare_answer_evaluation(
        question_text="Explain MVCC",
        transcript="Postgres keeps multiple row versions for concurrent readers.",
    )
    assert ans_prep["evaluation_requirements"]["technical_accuracy"] is True

    eval_out = build_interview_evaluation(
        overall_score=90.0,
        clarity=92.0,
        technical_accuracy=88.0,
        confidence_estimate=0.95,
        what_went_well=["Accurate concept"],
        what_to_improve=["Add detail about vacuuming"],
        better_answer="PostgreSQL uses MVCC to allow concurrent read and write operations...",
    )
    assert eval_out["overall_score"] == 90.0
    assert eval_out["metrics"]["clarity"] == 92.0


def test_job_market_analysis_module():
    prep = prepare_job_market_analysis(
        role_title="Machine Learning Engineer",
        location="Bengaluru / Remote",
    )
    assert prep["role_title"] == "Machine Learning Engineer"

    assert classify_demand(60000) == "High"
    assert classify_demand(25000) == "Medium"
    assert classify_demand(5000) == "Low"

    res = build_market_result(job_count=45000, source="LinkedIn/Naukri")
    assert res["demand"] == "Medium"
    assert res["count"] == 45000


def test_portfolio_builder_module():
    portfolio = prepare_portfolio(
        candidate_data={"name": "Alex", "headline": "Software Craftsman"},
        color_theme="emerald",
        mode="Dark",
        layout_style="Split",
        font_vibe="tech-mono",
        contact_email="alex@dev.io",
    )
    assert portfolio["preferences"]["color_theme"] == "emerald"
    assert portfolio["preferences"]["layout_style"] == "Split"
    assert portfolio["candidate_data"]["name"] == "Alex"


def test_resume_analysis_module():
    res = prepare_resume_analysis(
        resume_text="Experienced engineer in distributed caching and Python microservices.",
        job_description="Looking for Senior Python Developer",
    )
    assert res["analysis_requirements"]["evaluate_role_relevance"] is True
    assert res["analysis_requirements"]["identify_strengths"] is True

    reqs = get_resume_analysis_requirements()
    assert "Strengths" in reqs
    assert "Weaknesses" in reqs


def test_skill_gap_analysis_module():
    res = prepare_skill_gap_analysis(
        candidate_profile="Solid TypeScript and React, lacking GraphQL and Docker",
        target_role="Senior Full Stack Engineer",
    )
    assert res["analysis_requirements"]["minimum_gap_skills"] == 5
    assert "Expert" in res["analysis_requirements"]["skill_levels"]

    comp = build_competency_area(
        area_name="Frontend Architecture",
        skills=[
            {
                "name": "React",
                "level": "Advanced",
                "evidence_source": "GitHub",
                "evidence_comment": "Built multiple production SPA apps",
            },
            {
                "name": "TypeScript",
                "level": "Intermediate",
                "evidence_source": "GitHub",
                "evidence_comment": "Used in enterprise frontend refactor",
            },
        ],
    )
    assert comp["area"] == "Frontend Architecture"


def test_career_compass_fastapi_endpoints():
    # Test Roadmap Endpoint
    roadmap_resp = client.post(
        "/api/v1/career-compass/roadmap",
        json={
            "target_role": "Backend Engineer",
            "current_skills": ["Python", "Docker"],
            "skill_gaps": [{"skill": "PostgreSQL Optimization", "priority": "High"}],
        },
    )
    assert roadmap_resp.status_code == 200
    assert roadmap_resp.json()["target_role"] == "Backend Engineer"

    # Test Job Market Endpoint
    market_resp = client.get("/api/v1/career-compass/job-market?role_title=Backend+Engineer")
    assert market_resp.status_code == 200
    assert market_resp.json()["market_demand"]["demand"] in ["High", "Medium", "Low"]

    # Test Interview Evaluate Endpoint
    interview_resp = client.post(
        "/api/v1/career-compass/interview/evaluate",
        json={
            "question_text": "What is connection pooling?",
            "candidate_answer": "Connection pooling reuses database connections to avoid TCP overhead.",
        },
    )
    assert interview_resp.status_code == 200
    assert interview_resp.json()["evaluation"]["overall_score"] >= 80


def test_deduplicated_github_endpoints():
    from unittest.mock import patch, AsyncMock
    from features.github_analysis import github_service

    mock_repos = [
        {"id": 101, "name": "hyper-distributed-cache", "full_name": "aaravsharma-dev/hyper-distributed-cache"},
        {"id": 102, "name": "fastapi-order-saga", "full_name": "aaravsharma-dev/fastapi-order-saga"},
    ]
    with patch.object(github_service, "get_all_repos", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_repos

        # Canonical /api/v1/github/repos
        resp1 = client.get("/api/v1/github/repos?username=aaravsharma-dev")
        assert resp1.status_code == 200
        repos1 = resp1.json()
        assert isinstance(repos1, list)
        assert len(repos1) == 2

        # Routed /api/v1/career-compass/github/repos
        resp2 = client.get("/api/v1/career-compass/github/repos?username=aaravsharma-dev")
        assert resp2.status_code == 200
        repos2 = resp2.json()
        assert isinstance(repos2, list)
        assert len(repos2) == len(repos1)
        assert repos1[0]["name"] == repos2[0]["name"]


def test_personalized_roadmap_module():
    from features.personalized_roadmap import (
        normalize_skill,
        extract_gap_skills,
        match_skills_to_courses,
        order_courses,
        generate_personalized_roadmap,
        create_roadmap_from_skill_gap_result,
    )

    # Test normalization
    assert normalize_skill("python programming") == "python"
    assert normalize_skill("AWS") == "aws"
    assert normalize_skill("Structured Query Language") == "sql"

    # Test extract gap skills
    gaps = extract_gap_skills(["Python", {"skill": "SQL", "current_level": "Beginner"}])
    assert len(gaps) == 2
    assert gaps[0]["skill"] == "python"
    assert gaps[1]["skill"] == "sql"

    # Test match skills to courses
    matches = match_skills_to_courses(gaps)
    assert len(matches) == 2
    assert matches[0]["course_available"] is True

    # Test order courses (prerequisites)
    tree_and_array = [{"skill": "trees", "current_level": "none", "required_level": "required", "course_available": True, "course_title": "Trees", "course_path": "courses/trees", "duration_minutes": 60, "prerequisites": ["arrays"]}, {"skill": "arrays", "current_level": "none", "required_level": "required", "course_available": True, "course_title": "Arrays", "course_path": "courses/arrays", "duration_minutes": 60, "prerequisites": ["python"]}]
    ordered = order_courses(tree_and_array)
    ordered_skills = [c["skill"] for c in ordered]
    assert "arrays" in ordered_skills

    # Test generate personalized roadmap
    roadmap = generate_personalized_roadmap(
        skill_gaps=[{"skill": "Python", "current_level": "Beginner"}, "AWS", "UnknownSkillXYZ"],
        target_role="Full Stack Engineer",
        weekly_hours=6
    )
    assert "Personalized Roadmap for Full Stack Engineer" in roadmap["roadmap_title"]
    assert roadmap["skill_gap_count"] == 3
    assert roadmap["available_course_count"] == 2
    assert roadmap["external_learning_count"] == 1
    assert len(roadmap["phases"]) >= 2

    # Test convenience wrapper
    skill_gap_result = {"gap_skills": ["SQL", "Pandas"]}
    res = create_roadmap_from_skill_gap_result(skill_gap_result, target_role="Data Analyst")
    assert res["target_role"] == "Data Analyst"
    assert len(res["phases"]) >= 2


def test_personalized_roadmap_fastapi_endpoint():
    res = client.post(
        "/api/v1/career-compass/personalized-roadmap",
        json={
            "skill_gaps": ["Python", "SQL", "Pandas"],
            "target_role": "Data Scientist",
            "weekly_hours": 8
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["target_role"] == "Data Scientist"
    assert data["weekly_learning_hours"] == 8
    assert len(data["phases"]) >= 2
    assert data["phases"][0]["mock_test"]["passing_score"] == 60


def test_dynamic_interview_rubric_scoring_integration():
    """Test that detailed technical answers score higher than poor one-line answers."""
    poor_resp = client.post(
        "/api/v1/career-compass/interview/evaluate",
        json={
            "question_text": "Explain distributed transaction management using two-phase commit.",
            "candidate_answer": "It is good.",
        },
    )
    assert poor_resp.status_code == 200
    poor_eval = poor_resp.json()["evaluation"]
    assert poor_eval["overall_score"] < 50
    assert len(poor_eval["what_to_improve"]) > 0

    strong_resp = client.post(
        "/api/v1/career-compass/interview/evaluate",
        json={
            "question_text": "Explain distributed transaction management using two-phase commit.",
            "candidate_answer": (
                "Two-phase commit coordinates distributed transactions across multiple nodes with a prepare "
                "phase and commit phase to guarantee atomicity and consistency under network partitions. "
                "I architect consensus utilizing write-ahead logging and connection pooling to ensure high throughput."
            ),
        },
    )
    assert strong_resp.status_code == 200
    strong_eval = strong_resp.json()["evaluation"]
    assert strong_eval["overall_score"] >= 75
    assert strong_eval["metrics"]["technical_accuracy"] >= 70
    assert strong_eval["overall_score"] > poor_eval["overall_score"] + 25


def test_dynamic_course_backed_roadmap_integration():
    """Test that career compass roadmap pulls real courses and milestones from the catalog."""
    resp = client.post(
        "/api/v1/career-compass/personalized-roadmap",
        json={
            "skill_gaps": ["Python", "SQL", "Docker"],
            "target_role": "Lead Backend Architect",
            "weekly_hours": 10,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["target_role"] == "Lead Backend Architect"
    assert data["available_course_count"] >= 2
    assert len(data["phases"]) >= 2
    for phase in data["phases"]:
        assert "skill" in phase
        assert "lessons" in phase
        assert "mock_test" in phase
        assert phase["mock_test"]["passing_score"] == 60
