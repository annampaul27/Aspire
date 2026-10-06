import pytest
import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.models.entities import (
    User,
    Organization,
    Job,
    PipelineStageChange,
    CandidateScorecard,
    RecruiterNote,
    UserNotification,
)
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_collaboration_test_env():
    """
    Ensures test users, organizations, and clean collaboration tables exist before each test.
    """
    db: Session = SessionLocal()
    try:
        # Ensure test organization exists
        org = db.query(Organization).filter(Organization.id == "org-acme").first()
        if not org:
            org = Organization(
                id="org-acme",
                name="Acme HyperScale Systems",
                type="corporate",
                plan="Enterprise",
                status="active",
            )
            db.add(org)

        # Ensure second tenant exists for isolation testing
        org2 = db.query(Organization).filter(Organization.id == "org-talentbridge").first()
        if not org2:
            org2 = Organization(
                id="org-talentbridge",
                name="TalentBridge Staffing Partners",
                type="staffing",
                plan="Growth",
                status="active",
            )
            db.add(org2)

        # Ensure candidate exists
        cand = db.query(User).filter(User.id == "cand-1").first()
        if not cand:
            cand = User(
                id="cand-1",
                email="aditya.verma@example.com",
                full_name="Aditya Verma",
                role="student",
                password_hash=get_password_hash("AspireAI@2026"),
                readiness_score=78,
                pipeline_status="applied",
            )
            db.add(cand)
        else:
            cand.pipeline_status = "applied"

        # Ensure recruiter 1 exists
        rec1 = db.query(User).filter(User.id == "usr-recruiter-01").first()
        if not rec1:
            rec1 = User(
                id="usr-recruiter-01",
                email="priya.sharma@acme.com",
                full_name="Priya Sharma",
                role="employer",
                org_id="org-acme",
                password_hash=get_password_hash("AspireAI@2026"),
            )
            db.add(rec1)

        # Ensure recruiter 2 exists
        rec2 = db.query(User).filter(User.id == "usr-recruiter-02").first()
        if not rec2:
            rec2 = User(
                id="usr-recruiter-02",
                email="rohit.mehta@acme.com",
                full_name="Rohit Mehta",
                role="employer",
                org_id="org-acme",
                password_hash=get_password_hash("AspireAI@2026"),
            )
            db.add(rec2)

        # Ensure recruiter for tenant 2 exists
        rec_org2 = db.query(User).filter(User.id == "usr-recruiter-tb").first()
        if not rec_org2:
            rec_org2 = User(
                id="usr-recruiter-tb",
                email="sarah.connor@talentbridge.com",
                full_name="Sarah Connor",
                role="employer",
                org_id="org-talentbridge",
                password_hash=get_password_hash("AspireAI@2026"),
            )
            db.add(rec_org2)

        # Ensure test job exists for org-acme
        job = db.query(Job).filter(Job.id == "job-sprint7-test").first()
        if not job:
            job = Job(
                id="job-sprint7-test",
                org_id="org-acme",
                company="Acme HyperScale Systems",
                title="Staff Full-Stack Engineer",
                department="Engineering",
                location="Remote",
                type="Full-Time",
                experience_min_years=3.0,
                salary_range="$130k - $160k",
                pass_threshold=85,
                opening_date=datetime.datetime.utcnow(),
                application_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=30),
            )
            db.add(job)

        # Clean prior collaboration records and notifications for cand-1
        db.query(UserNotification).filter(UserNotification.user_id == "cand-1").delete()
        db.query(PipelineStageChange).filter(PipelineStageChange.candidate_id == "cand-1").delete()
        db.query(CandidateScorecard).filter(CandidateScorecard.candidate_id == "cand-1").delete()
        db.query(RecruiterNote).filter(RecruiterNote.candidate_id == "cand-1").delete()

        db.commit()
    finally:
        db.close()


def get_token_for(user_id: str, email: str, role: str, org_id: str = None) -> str:
    return create_access_token(
        subject=user_id,
        email=email,
        role=role,
        org_id=org_id,
        name=email.split("@")[0],
    )


# =========================================================================
# 1. WebSocket Connection & Heartbeat Tests
# =========================================================================

def test_websocket_connection_and_heartbeat():
    token = get_token_for("usr-recruiter-01", "priya.sharma@acme.com", "employer", "org-acme")
    with client.websocket_connect(f"/ws/hiring/org-acme?token={token}") as ws:
        # First message sent upon connection is RECRUITER_JOINED
        join_msg = ws.receive_json()
        assert join_msg["event"] == "RECRUITER_JOINED"
        assert join_msg["org_id"] == "org-acme"
        assert join_msg["data"]["peer_count"] >= 1

        # Test PING / PONG
        ws.send_json({"type": "PING"})
        pong_msg = ws.receive_json()
        assert pong_msg["event"] == "PONG"

        # Test REQUEST_PEERS
        ws.send_json({"type": "REQUEST_PEERS"})
        peers_msg = ws.receive_json()
        assert peers_msg["event"] == "PEER_LIST"
        assert len(peers_msg["data"]["active_collaborators"]) >= 1


# =========================================================================
# 2. Pipeline Stage Movement & Real-Time Broadcast
# =========================================================================

def test_pipeline_stage_movement_persistence_and_notification():
    token = get_token_for("usr-recruiter-01", "priya.sharma@acme.com", "employer", "org-acme")
    headers = {"Authorization": f"Bearer {token}"}

    # Move candidate from 'applied' to 'interview'
    res = client.post(
        "/api/v1/collaboration/pipeline/move",
        headers=headers,
        json={
            "candidate_id": "cand-1",
            "from_stage": "applied",
            "to_stage": "interview",
            "reason": "Strong AST Sandbox performance",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["new_stage"] == "interview"

    # Verify DB update
    db: Session = SessionLocal()
    try:
        cand = db.query(User).filter(User.id == "cand-1").first()
        assert cand.pipeline_status == "interview"

        # Verify PipelineStageChange audit record
        change = (
            db.query(PipelineStageChange)
            .filter(PipelineStageChange.candidate_id == "cand-1")
            .first()
        )
        assert change is not None
        assert change.from_stage == "applied"
        assert change.to_stage == "interview"
        assert change.changed_by_user_id == "usr-recruiter-01"

        # Verify candidate UserNotification was created
        notif = (
            db.query(UserNotification)
            .filter(
                UserNotification.user_id == "cand-1",
                UserNotification.notification_type == "stage_advancement",
            )
            .order_by(UserNotification.created_at.desc())
            .first()
        )
        assert notif is not None
        assert "interview" in notif.message.lower()
    finally:
        db.close()


def test_pipeline_stage_movement_broadcasts_to_websocket():
    rec_token = get_token_for("usr-recruiter-01", "priya.sharma@acme.com", "employer", "org-acme")

    # Connect WebSocket client listening for updates
    with client.websocket_connect(f"/ws/hiring/org-acme?token={rec_token}") as ws:
        # Drain the connection message
        _ = ws.receive_json()

        # Trigger stage change via REST
        res = client.post(
            "/api/v1/collaboration/pipeline/move",
            headers={"Authorization": f"Bearer {rec_token}"},
            json={
                "candidate_id": "cand-1",
                "from_stage": "interview",
                "to_stage": "offer",
                "reason": "Passed final technical evaluation with consensus",
            },
        )
        assert res.status_code == 200

        # Verify WebSocket received the STAGE_CHANGED event
        event = ws.receive_json()
        assert event["event"] == "STAGE_CHANGED"
        assert event["org_id"] == "org-acme"
        assert event["data"]["candidate_id"] == "cand-1"
        assert event["data"]["to_stage"] == "offer"
        assert event["data"]["changed_by"]["id"] == "usr-recruiter-01"


# =========================================================================
# 3. Multi-Reviewer Scorecards & Team Consensus
# =========================================================================

def test_multi_reviewer_scorecards_and_team_consensus():
    token_r1 = get_token_for("usr-recruiter-01", "priya.sharma@acme.com", "employer", "org-acme")
    token_r2 = get_token_for("usr-recruiter-02", "rohit.mehta@acme.com", "employer", "org-acme")

    # Recruiter 1 evaluates
    res1 = client.post(
        "/api/v1/collaboration/scorecards",
        headers={"Authorization": f"Bearer {token_r1}"},
        json={
            "candidate_id": "cand-1",
            "overall_recommendation": "strong_hire",
            "technical_rating": 5,
            "communication_rating": 4,
            "problem_solving_rating": 4,
            "culture_add_rating": 5,
            "feedback_notes": "Outstanding architecture design and AST mastery.",
        },
    )
    assert res1.status_code == 200, res1.text
    d1 = res1.json()
    assert d1["summary"]["total_reviews"] == 1
    assert d1["summary"]["composite_score"] == 4.5

    # Recruiter 2 evaluates
    res2 = client.post(
        "/api/v1/collaboration/scorecards",
        headers={"Authorization": f"Bearer {token_r2}"},
        json={
            "candidate_id": "cand-1",
            "overall_recommendation": "hire",
            "technical_rating": 4,
            "communication_rating": 4,
            "problem_solving_rating": 4,
            "culture_add_rating": 4,
            "feedback_notes": "Solid engineering fundamentals and clear articulation.",
        },
    )
    assert res2.status_code == 200, res2.text
    d2 = res2.json()
    assert d2["summary"]["total_reviews"] == 2
    assert d2["summary"]["avg_technical"] == 4.5  # (5 + 4)/2
    assert d2["summary"]["consensus"] == "consensus_hire"
    assert d2["summary"]["recommendation_breakdown"]["strong_hire"] == 1
    assert d2["summary"]["recommendation_breakdown"]["hire"] == 1

    # Query all scorecards
    get_res = client.get(
        "/api/v1/collaboration/scorecards/cand-1",
        headers={"Authorization": f"Bearer {token_r1}"},
    )
    assert get_res.status_code == 200
    cards_data = get_res.json()
    assert cards_data["count"] == 2
    assert len(cards_data["scorecards"]) == 2


# =========================================================================
# 4. Collaborative Recruiter Notes CRUD
# =========================================================================

def test_recruiter_notes_crud_and_collaboration():
    token = get_token_for("usr-recruiter-01", "priya.sharma@acme.com", "employer", "org-acme")
    headers = {"Authorization": f"Bearer {token}"}

    # Post a note
    post_res = client.post(
        "/api/v1/collaboration/notes",
        headers=headers,
        json={
            "candidate_id": "cand-1",
            "note_content": "Candidate has a competitive offer pending. Expedite decision.",
            "is_private": True,
        },
    )
    assert post_res.status_code == 200
    assert post_res.json()["note"]["note_content"].startswith("Candidate has a competitive")

    # Fetch notes
    get_res = client.get("/api/v1/collaboration/notes/cand-1", headers=headers)
    assert get_res.status_code == 200
    notes_data = get_res.json()
    assert notes_data["count"] >= 1
    assert any("competitive offer" in n["note_content"] for n in notes_data["notes"])


# =========================================================================
# 5. Tenant Isolation Test (Cross-Org WebSocket & Data Scoping)
# =========================================================================

def test_tenant_isolation_on_collaboration_events():
    token_org1 = get_token_for("usr-recruiter-01", "priya.sharma@acme.com", "employer", "org-acme")
    token_org2 = get_token_for("usr-recruiter-tb", "sarah.connor@talentbridge.com", "employer", "org-talentbridge")

    # Connect WebSocket in org-acme and another in org-talentbridge
    with client.websocket_connect(f"/ws/hiring/org-acme?token={token_org1}") as ws_org1:
        _ = ws_org1.receive_json()  # drain join message

        with client.websocket_connect(f"/ws/hiring/org-talentbridge?token={token_org2}") as ws_org2:
            _ = ws_org2.receive_json()  # drain join message

            # Move stage in org-acme
            res = client.post(
                "/api/v1/collaboration/pipeline/move",
                headers={"Authorization": f"Bearer {token_org1}"},
                json={
                    "candidate_id": "cand-1",
                    "from_stage": "applied",
                    "to_stage": "screened",
                    "reason": "Tenant isolation test",
                },
            )
            assert res.status_code == 200

            # org-acme should receive the event
            acme_event = ws_org1.receive_json()
            assert acme_event["event"] == "STAGE_CHANGED"
            assert acme_event["org_id"] == "org-acme"

            # org-talentbridge should not have pending messages from org-acme; PING works independently
            ws_org2.send_json({"type": "PING"})
            org2_resp = ws_org2.receive_json()
            assert org2_resp["event"] == "PONG"


# =========================================================================
# 6. RBAC Role Protection Tests
# =========================================================================

def test_rbac_rejects_student_access_to_collaboration():
    student_token = get_token_for("cand-1", "aditya.verma@example.com", "student")
    headers = {"Authorization": f"Bearer {student_token}"}

    # Student tries to move pipeline stage
    res_move = client.post(
        "/api/v1/collaboration/pipeline/move",
        headers=headers,
        json={
            "candidate_id": "cand-1",
            "from_stage": "applied",
            "to_stage": "offer",
        },
    )
    assert res_move.status_code == 403

    # Student tries to submit scorecard
    res_score = client.post(
        "/api/v1/collaboration/scorecards",
        headers=headers,
        json={
            "candidate_id": "cand-1",
            "overall_recommendation": "strong_hire",
            "technical_rating": 5,
            "communication_rating": 5,
            "problem_solving_rating": 5,
            "culture_add_rating": 5,
            "feedback_notes": "Unauthorized self-review attempt",
        },
    )
    assert res_score.status_code == 403


# =========================================================================
# 7. Pipeline Movement History Audit Trail
# =========================================================================

def test_pipeline_movement_history_audit_trail():
    token = get_token_for("usr-recruiter-01", "priya.sharma@acme.com", "employer", "org-acme")
    headers = {"Authorization": f"Bearer {token}"}

    # Perform 2 stage moves
    client.post(
        "/api/v1/collaboration/pipeline/move",
        headers=headers,
        json={"candidate_id": "cand-1", "from_stage": "applied", "to_stage": "screened", "reason": "Initial review"},
    )
    client.post(
        "/api/v1/collaboration/pipeline/move",
        headers=headers,
        json={"candidate_id": "cand-1", "from_stage": "screened", "to_stage": "interview", "reason": "Interview scheduled"},
    )

    # Retrieve history
    res = client.get("/api/v1/collaboration/pipeline/history/cand-1", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 2
    assert data["history"][0]["to_stage"] == "interview"
    assert data["history"][1]["to_stage"] == "screened"
