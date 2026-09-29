import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import init_db, get_db_connection
import io

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    """Ensure database schema and initial tables are primed."""
    init_db()

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

def test_get_assessment_questions_success():
    """Test retrieving assessment questions for postgresql skill."""
    res = client.get("/api/v1/assessments/postgresql/questions")
    assert res.status_code == 200
    data = res.json()
    assert data["skill_id"] == "postgresql"
    assert data["total_questions"] == 20
    assert data["time_limit_seconds"] == 720
    assert data["passing_threshold_percent"] == 70
    assert len(data["questions"]) == 20
    # Security check: correct option must not be leaked to candidate client
    for q in data["questions"]:
        assert "correct_option_index" not in q
        assert len(q["options"]) == 4

def test_get_assessment_questions_fallback():
    """Test requesting a skill not in the specific question bank falls back gracefully to default questions."""
    res = client.get("/api/v1/assessments/unknown_skill_xyz/questions")
    assert res.status_code == 200
    data = res.json()
    assert data["skill_id"] == "unknown_skill_xyz"
    assert len(data["questions"]) == 20

def test_submit_assessment_pass_gold():
    """Test submitting answers that pass at Gold tier (85-94%)."""
    # First get question IDs
    q_res = client.get("/api/v1/assessments/postgresql/questions")
    questions = q_res.json()["questions"]
    
    from app.api.v1.assessments import SKILL_QUESTION_BANKS
    bank = SKILL_QUESTION_BANKS["postgresql"]
    
    answers = {}
    for idx, q in enumerate(bank):
        if idx < 18:
            answers[q["id"]] = q["correct_option_index"]
        else:
            answers[q["id"]] = (q["correct_option_index"] + 1) % 4

    payload = {
        "user_id": "cand-1",
        "skill_id": "postgresql",
        "time_taken_seconds": 420,
        "answers": answers
    }

    res = client.post("/api/v1/assessments/grade", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["verification_status"] == "Passed"
    assert result["badge_tier"] == "Gold"
    assert result["score"] == 90
    assert result["correct_count"] == 18
    assert result["time_taken_formatted"] == "07:00"
    assert result["badge_metadata"]["tier"] == "Gold"

def test_submit_assessment_fail():
    """Test submitting answers failing the 70% threshold."""
    from app.api.v1.assessments import SKILL_QUESTION_BANKS
    bank = SKILL_QUESTION_BANKS["postgresql"]
    
    # Answer only 10 correctly (50% -> Failed)
    answers = {}
    for idx, q in enumerate(bank):
        if idx < 10:
            answers[q["id"]] = q["correct_option_index"]
        else:
            answers[q["id"]] = (q["correct_option_index"] + 1) % 4

    payload = {
        "user_id": "cand-1",
        "skill_id": "postgresql",
        "time_taken_seconds": 600,
        "answers": answers
    }

    res = client.post("/api/v1/assessments/grade", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["verification_status"] == "Failed"
    assert result["badge_tier"] is None
    assert result["score"] == 50
    assert result["correct_count"] == 10
    assert "below the mandatory 70% threshold" in result["feedback"]

def test_user_assessment_history():
    """Test retrieving user's completed assessments history."""
    res = client.get("/api/v1/assessments/user/cand-1/history")
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    assert "score" in history[0]
    assert "verification_status" in history[0]

def test_parse_pdf_resume_success():
    """Test uploading a PDF resume for AI spatial parsing."""
    pdf_content = b"%PDF-1.4 mock binary content with student and intern keywords"
    files = {"file": ("test_resume.pdf", io.BytesIO(pdf_content), "application/pdf")}
    res = client.post("/api/v1/resume/parse", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["file_name"] == "test_resume.pdf"
    assert "personal_info" in data["data"]
    assert "skills" in data["data"]
    assert "ats_metadata" in data["data"]
    assert data["data"]["ats_metadata"]["ats_score"] > 80

def test_parse_pdf_resume_invalid_extension():
    """Test rejecting non-pdf upload."""
    files = {"file": ("test.docx", io.BytesIO(b"dummy"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    res = client.post("/api/v1/resume/parse", files=files)
    assert res.status_code == 400
    assert "Only PDF resumes" in res.json()["detail"]

def test_parse_pdf_resume_with_technical_skills():
    """Test uploading a resume extracting structured ATS fields via unified parser service."""
    sample_text = (
        "Aditya Verma\n"
        "aditya@example.com\n"
        "Bengaluru, India\n"
        "Skills: Python, FastAPI, Docker, PostgreSQL, React, Git, Kubernetes\n"
        "Experience: Senior Engineer at Nexus Scale Labs (2022 - Present)\n"
        "Education: Bachelor of Technology in Computer Science, IIIT Bengaluru (2020)\n"
    )
    files = {"file": ("aditya_resume.pdf", io.BytesIO(sample_text.encode("utf-8")), "application/pdf")}
    res = client.post("/api/v1/resume/parse", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["ats_metadata"]["format_compliance"] in [
        "Optimal Single-Column ATS Layout",
        "ATS-100 Compliant",
        "ATS-Standard Compliant"
    ]
    assert data["data"]["ats_metadata"]["ats_score"] >= 80

def test_save_and_get_latest_ats_resume():
    """Test saving edited ATS resume and fetching latest."""
    sample_resume = {
        "personal_info": {
            "full_name": "Aditya Verma",
            "email": "aditya.verma@example.com",
            "phone": "+91 98765 43210",
            "location": "Bengaluru, Karnataka, India"
        },
        "professional_summary": "Experienced backend engineer...",
        "user_class": "Experienced",
        "skills": {
            "core_technical": ["PostgreSQL", "Python"],
            "frameworks_and_tools": ["FastAPI", "Docker"],
            "soft_skills": ["Leadership"]
        },
        "work_experience": [
            {
                "company": "Nexus Scale Labs",
                "role": "Senior Engineer",
                "start_date": "2023",
                "end_date": "Present",
                "current": True,
                "location": "Bengaluru",
                "bullet_points": ["Engineered async pipeline"]
            }
        ],
        "education": [],
        "projects": [],
        "certifications": [],
        "ats_metadata": {
            "ats_score": 94,
            "readability_score": "High",
            "format_compliance": "ATS-100 Compliant",
            "keyword_density_score": 92
        }
    }

    save_payload = {
        "user_id": "cand-1",
        "user_class": "Experienced",
        "file_name": "Aditya_Verma_ATS_Resume.pdf",
        "resume_data": sample_resume
    }

    save_res = client.post("/api/v1/resume/save-profile", json=save_payload)
    assert save_res.status_code == 200
    save_data = save_res.json()
    assert save_data["success"] is True
    assert save_data["ats_score"] == 94

    # Now fetch latest
    latest_res = client.get("/api/v1/resume/user/cand-1/latest")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert latest_data["ats_score"] == 94
    assert latest_data["data"]["personal_info"]["full_name"] == "Aditya Verma"
