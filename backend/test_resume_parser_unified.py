import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_resume_parser_extracts_real_custom_candidate_data():
    """
    Audit §4.2 Verification:
    Verify that uploading a PDF/text stream with a custom candidate (e.g. Elena Rostova)
    extracts Elena's actual name, email, and skills — NOT the static mock 'Aditya Verma' with 'Nexus Scale Labs'.
    """
    custom_resume_content = (
        "Elena Rostova\n"
        "elena.rostova@techinnovate.io\n"
        "+91 91234 56789\n"
        "https://github.com/elenarostova\n"
        "https://linkedin.com/in/elenarostova\n"
        "Indian Institute of Technology (IIT) Delhi\n"
        "Skills: Golang, Rust, Kubernetes, Docker, PostgreSQL, Distributed Systems, Microservices\n"
        "Professional Experience at CloudScale Dynamics:\n"
        "- Architected high-availability distributed consensus cluster with Raft protocol in Golang.\n"
        "- Reduced container cold-start latency by 55% using Alpine multi-stage builds.\n"
    ).encode("utf-8")

    files = {"file": ("elena_resume.pdf", io.BytesIO(custom_resume_content), "application/pdf")}
    response = client.post("/api/v1/resume/parse", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    parsed_data = data["data"]
    personal_info = parsed_data["personal_info"]

    # Verify real extracted candidate data, NOT static mock 'Aditya Verma'
    assert personal_info["full_name"] == "Elena Rostova"
    assert personal_info["email"] == "elena.rostova@techinnovate.io"
    assert "github.com/elenarostova" in (personal_info.get("github_url") or "")

    # Verify actual skills extracted from text
    all_skills = (
        parsed_data["skills"]["core_technical"] +
        parsed_data["skills"]["frameworks_and_tools"]
    )
    assert any("golang" in s.lower() or "rust" in s.lower() for s in all_skills)
    assert any("kubernetes" in s.lower() or "docker" in s.lower() for s in all_skills)

    # Verify work experience extracted CloudScale Dynamics
    work_exp = parsed_data["work_experience"]
    assert len(work_exp) > 0
    assert "CloudScale Dynamics" in work_exp[0]["company"] or "CloudScale" in work_exp[0]["company"]


def test_resume_parser_rejects_empty_file():
    """Verify clean rejection of 0-byte file uploads."""
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    response = client.post("/api/v1/resume/parse", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()
