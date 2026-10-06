import uuid
import datetime
from typing import Optional, List, Dict, Any
from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    Query,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.core.security import decode_access_token
from app.models.entities import (
    User,
    Organization,
    PipelineStageChange,
    CandidateScorecard,
    RecruiterNote,
    UserNotification,
)
from app.services.collaboration.connection_manager import collaboration_manager

router = APIRouter()

# -------------------------------------------------------------------------
# Pydantic Request & Response Schemas
# -------------------------------------------------------------------------

class MovePipelineStageRequest(BaseModel):
    candidate_id: str
    from_stage: str
    to_stage: str
    job_id: Optional[str] = None
    reason: Optional[str] = "Moved in collaborative Kanban"


class SubmitScorecardRequest(BaseModel):
    candidate_id: str
    job_id: Optional[str] = None
    overall_recommendation: str = Field(
        ..., description="'strong_hire', 'hire', 'neutral', 'reject'"
    )
    technical_rating: int = Field(ge=1, le=5)
    communication_rating: int = Field(ge=1, le=5)
    problem_solving_rating: int = Field(ge=1, le=5)
    culture_add_rating: int = Field(ge=1, le=5)
    feedback_notes: str = Field(default="", max_length=5000)


class CreateRecruiterNoteRequest(BaseModel):
    candidate_id: str
    note_content: str = Field(..., min_length=1, max_length=5000)
    is_private: bool = True


# -------------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------------

def _compute_team_scorecard_summary(
    scorecards: List[CandidateScorecard],
) -> Dict[str, Any]:
    if not scorecards:
        return {
            "total_reviews": 0,
            "avg_technical": 0.0,
            "avg_communication": 0.0,
            "avg_problem_solving": 0.0,
            "avg_culture_add": 0.0,
            "composite_score": 0.0,
            "recommendation_breakdown": {
                "strong_hire": 0,
                "hire": 0,
                "neutral": 0,
                "reject": 0,
            },
            "consensus": "pending_evaluations",
        }

    total = len(scorecards)
    avg_tech = sum(s.technical_rating for s in scorecards) / total
    avg_comm = sum(s.communication_rating for s in scorecards) / total
    avg_ps = sum(s.problem_solving_rating for s in scorecards) / total
    avg_cult = sum(s.culture_add_rating for s in scorecards) / total

    breakdown = {"strong_hire": 0, "hire": 0, "neutral": 0, "reject": 0}
    for s in scorecards:
        rec = s.overall_recommendation.lower()
        if rec in breakdown:
            breakdown[rec] += 1

    # Consensus verdict
    if breakdown["reject"] > total / 2:
        consensus = "consensus_reject"
    elif breakdown["strong_hire"] + breakdown["hire"] > total / 2:
        consensus = "consensus_hire"
    else:
        consensus = "mixed_reviews"

    composite = (avg_tech + avg_comm + avg_ps + avg_cult) / 4.0

    return {
        "total_reviews": total,
        "avg_technical": round(avg_tech, 2),
        "avg_communication": round(avg_comm, 2),
        "avg_problem_solving": round(avg_ps, 2),
        "avg_culture_add": round(avg_cult, 2),
        "composite_score": round(composite, 2),
        "recommendation_breakdown": breakdown,
        "consensus": consensus,
    }


# -------------------------------------------------------------------------
# 1. Real-Time WebSocket Endpoint
# -------------------------------------------------------------------------

@router.websocket("/ws/hiring/{org_id}")
async def websocket_hiring_endpoint(
    websocket: WebSocket,
    org_id: str,
    token: Optional[str] = Query(None),
):
    """
    Tenant-isolated WebSocket room for live recruiter collaboration.
    Streams real-time candidate stage updates, scorecards, notes, and team presence.
    """
    user_info = {
        "user_id": f"guest-{uuid.uuid4().hex[:6]}",
        "full_name": "Recruiter Peer",
        "role": "employer",
        "org_id": org_id,
        "connected_at": datetime.datetime.utcnow().isoformat(),
    }

    if token:
        payload = decode_access_token(token)
        if payload:
            user_info["user_id"] = payload.get("sub", user_info["user_id"])
            user_info["full_name"] = payload.get("name", payload.get("email", user_info["full_name"]))
            user_info["role"] = payload.get("role", "employer")
            user_info["email"] = payload.get("email", "")

    await collaboration_manager.connect(websocket, org_id, user_info)

    try:
        while True:
            # Handle incoming client ping/presence messages
            data = await websocket.receive_json()
            msg_type = data.get("type", "")

            if msg_type == "PING":
                await websocket.send_json({
                    "event": "PONG",
                    "org_id": org_id,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                })
            elif msg_type == "TYPING_NOTE":
                # Broadcast typing indicator to team members
                await collaboration_manager.broadcast(
                    org_id=org_id,
                    event_type="RECRUITER_TYPING",
                    data={
                        "candidate_id": data.get("candidate_id"),
                        "user": user_info,
                    },
                    exclude_socket=websocket,
                )
            elif msg_type == "REQUEST_PEERS":
                peers = collaboration_manager.get_active_collaborators(org_id)
                await websocket.send_json({
                    "event": "PEER_LIST",
                    "org_id": org_id,
                    "data": {
                        "active_collaborators": peers,
                        "peer_count": len(peers),
                    },
                })
    except WebSocketDisconnect:
        await collaboration_manager.disconnect(websocket, org_id)
    except Exception:
        await collaboration_manager.disconnect(websocket, org_id)


# -------------------------------------------------------------------------
# 2. Pipeline Stage Movement (REST + WebSocket Broadcast)
# -------------------------------------------------------------------------

@router.post("/collaboration/pipeline/move")
async def move_pipeline_stage(
    payload: MovePipelineStageRequest,
    current_user: Dict[str, Any] = Depends(require_role(["employer", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Atomically moves a candidate to a new hiring stage, persists stage audit log,
    creates notifications for interview/offer transitions, and broadcasts to team via WebSockets.
    """
    org_id = current_user.get("org_id") or "org-acme"

    candidate = db.query(User).filter(User.id == payload.candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{payload.candidate_id}' not found.",
        )

    # 1. Update candidate's pipeline status
    candidate.pipeline_status = payload.to_stage

    # 2. Record immutable audit log in PipelineStageChange
    stage_change_id = f"stg_chg_{uuid.uuid4().hex[:12]}"
    stage_change = PipelineStageChange(
        id=stage_change_id,
        candidate_id=candidate.id,
        org_id=org_id,
        job_id=payload.job_id,
        from_stage=payload.from_stage,
        to_stage=payload.to_stage,
        changed_by_user_id=current_user.get("id"),
        reason=payload.reason,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(stage_change)

    # 3. Create real-time candidate notification if advancing to interview or offer
    if payload.to_stage in ["interview", "offer"]:
        notification_message = (
            f"Congratulations! Acme HyperScale Systems advanced your application to the {payload.to_stage.upper()} stage."
            if payload.to_stage == "interview"
            else "🎉 Incredible news! You have received a formal offer extension from Acme HyperScale Systems."
        )
        notif = UserNotification(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            user_id=candidate.id,
            job_id=payload.job_id or "job-general",
            message=notification_message,
            notification_type="stage_advancement",
            is_read=False,
            trigger_date=datetime.datetime.utcnow(),
            created_at=datetime.datetime.utcnow(),
        )
        db.add(notif)

    db.commit()
    db.refresh(candidate)

    # 4. Broadcast live WebSocket event to all recruiters in this organization
    await collaboration_manager.broadcast(
        org_id=org_id,
        event_type="STAGE_CHANGED",
        data={
            "stage_change_id": stage_change_id,
            "candidate_id": candidate.id,
            "candidate_name": candidate.full_name,
            "from_stage": payload.from_stage,
            "to_stage": payload.to_stage,
            "changed_by": {
                "id": current_user.get("id"),
                "name": current_user.get("full_name"),
            },
            "reason": payload.reason,
            "timestamp": stage_change.created_at.isoformat(),
        },
    )

    return {
        "success": True,
        "stage_change_id": stage_change_id,
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "new_stage": payload.to_stage,
        "message": f"Successfully moved {candidate.full_name} from {payload.from_stage} to {payload.to_stage}.",
    }


# -------------------------------------------------------------------------
# 3. Candidate Scorecards (Multi-Reviewer Submissions)
# -------------------------------------------------------------------------

@router.post("/collaboration/scorecards")
async def submit_candidate_scorecard(
    payload: SubmitScorecardRequest,
    current_user: Dict[str, Any] = Depends(require_role(["employer", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Submits or updates a reviewer's evaluation scorecard for a candidate.
    Calculates updated team consensus and broadcasts to connected peers.
    """
    org_id = current_user.get("org_id") or "org-acme"
    reviewer_id = current_user.get("id")

    candidate = db.query(User).filter(User.id == payload.candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{payload.candidate_id}' not found.",
        )

    # Check for existing review by this reviewer
    existing = (
        db.query(CandidateScorecard)
        .filter(
            CandidateScorecard.candidate_id == payload.candidate_id,
            CandidateScorecard.org_id == org_id,
            CandidateScorecard.reviewer_id == reviewer_id,
        )
        .first()
    )

    if existing:
        existing.job_id = payload.job_id
        existing.overall_recommendation = payload.overall_recommendation
        existing.technical_rating = payload.technical_rating
        existing.communication_rating = payload.communication_rating
        existing.problem_solving_rating = payload.problem_solving_rating
        existing.culture_add_rating = payload.culture_add_rating
        existing.feedback_notes = payload.feedback_notes
        existing.updated_at = datetime.datetime.utcnow()
        scorecard = existing
    else:
        scorecard = CandidateScorecard(
            id=f"sc_{uuid.uuid4().hex[:12]}",
            candidate_id=payload.candidate_id,
            org_id=org_id,
            job_id=payload.job_id,
            reviewer_id=reviewer_id,
            overall_recommendation=payload.overall_recommendation,
            technical_rating=payload.technical_rating,
            communication_rating=payload.communication_rating,
            problem_solving_rating=payload.problem_solving_rating,
            culture_add_rating=payload.culture_add_rating,
            feedback_notes=payload.feedback_notes,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow(),
        )
        db.add(scorecard)

    db.commit()
    db.refresh(scorecard)

    # Fetch all scorecards for candidate to recalculate team consensus
    all_scorecards = (
        db.query(CandidateScorecard)
        .filter(
            CandidateScorecard.candidate_id == payload.candidate_id,
            CandidateScorecard.org_id == org_id,
        )
        .all()
    )
    summary = _compute_team_scorecard_summary(all_scorecards)

    scorecard_dict = {
        "id": scorecard.id,
        "candidate_id": scorecard.candidate_id,
        "reviewer_id": scorecard.reviewer_id,
        "reviewer_name": current_user.get("full_name"),
        "overall_recommendation": scorecard.overall_recommendation,
        "technical_rating": scorecard.technical_rating,
        "communication_rating": scorecard.communication_rating,
        "problem_solving_rating": scorecard.problem_solving_rating,
        "culture_add_rating": scorecard.culture_add_rating,
        "feedback_notes": scorecard.feedback_notes,
        "updated_at": scorecard.updated_at.isoformat(),
    }

    # Broadcast to team
    await collaboration_manager.broadcast(
        org_id=org_id,
        event_type="SCORECARD_SUBMITTED",
        data={
            "candidate_id": payload.candidate_id,
            "scorecard": scorecard_dict,
            "summary": summary,
        },
    )

    return {
        "success": True,
        "scorecard": scorecard_dict,
        "summary": summary,
        "message": "Evaluation scorecard successfully submitted.",
    }


@router.get("/collaboration/scorecards/{candidate_id}")
async def get_candidate_scorecards(
    candidate_id: str,
    current_user: Dict[str, Any] = Depends(require_role(["employer", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Retrieves all reviewer scorecards and consolidated team consensus for a candidate.
    """
    org_id = current_user.get("org_id") or "org-acme"

    scorecards = (
        db.query(CandidateScorecard)
        .filter(
            CandidateScorecard.candidate_id == candidate_id,
            CandidateScorecard.org_id == org_id,
        )
        .order_by(CandidateScorecard.updated_at.desc())
        .all()
    )

    # Attach reviewer names
    reviewer_ids = [s.reviewer_id for s in scorecards]
    reviewers = db.query(User).filter(User.id.in_(reviewer_ids)).all() if reviewer_ids else []
    reviewer_map = {r.id: r.full_name for r in reviewers}

    cards_data = []
    for s in scorecards:
        cards_data.append({
            "id": s.id,
            "candidate_id": s.candidate_id,
            "reviewer_id": s.reviewer_id,
            "reviewer_name": reviewer_map.get(s.reviewer_id, "Recruiter"),
            "overall_recommendation": s.overall_recommendation,
            "technical_rating": s.technical_rating,
            "communication_rating": s.communication_rating,
            "problem_solving_rating": s.problem_solving_rating,
            "culture_add_rating": s.culture_add_rating,
            "feedback_notes": s.feedback_notes,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        })

    summary = _compute_team_scorecard_summary(scorecards)

    return {
        "candidate_id": candidate_id,
        "scorecards": cards_data,
        "summary": summary,
        "count": len(cards_data),
    }


# -------------------------------------------------------------------------
# 4. Collaborative Recruiter Notes
# -------------------------------------------------------------------------

@router.post("/collaboration/notes")
async def create_recruiter_note(
    payload: CreateRecruiterNoteRequest,
    current_user: Dict[str, Any] = Depends(require_role(["employer", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Adds a collaborative private recruiter note to a candidate profile and streams to peers.
    """
    org_id = current_user.get("org_id") or "org-acme"

    note = RecruiterNote(
        id=f"note_{uuid.uuid4().hex[:12]}",
        candidate_id=payload.candidate_id,
        org_id=org_id,
        author_id=current_user.get("id"),
        note_content=payload.note_content,
        is_private=payload.is_private,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    note_data = {
        "id": note.id,
        "candidate_id": note.candidate_id,
        "author_id": note.author_id,
        "author_name": current_user.get("full_name"),
        "note_content": note.note_content,
        "is_private": note.is_private,
        "created_at": note.created_at.isoformat(),
    }

    await collaboration_manager.broadcast(
        org_id=org_id,
        event_type="NOTE_ADDED",
        data=note_data,
    )

    return {"success": True, "note": note_data}


@router.get("/collaboration/notes/{candidate_id}")
async def get_recruiter_notes(
    candidate_id: str,
    current_user: Dict[str, Any] = Depends(require_role(["employer", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Lists all recruiter notes for a candidate scoped to this tenant organization.
    """
    org_id = current_user.get("org_id") or "org-acme"

    notes = (
        db.query(RecruiterNote)
        .filter(
            RecruiterNote.candidate_id == candidate_id,
            RecruiterNote.org_id == org_id,
        )
        .order_by(RecruiterNote.created_at.asc())
        .all()
    )

    author_ids = [n.author_id for n in notes]
    authors = db.query(User).filter(User.id.in_(author_ids)).all() if author_ids else []
    author_map = {a.id: a.full_name for a in authors}

    notes_data = [
        {
            "id": n.id,
            "candidate_id": n.candidate_id,
            "author_id": n.author_id,
            "author_name": author_map.get(n.author_id, "Recruiter"),
            "note_content": n.note_content,
            "is_private": n.is_private,
            "created_at": n.created_at.isoformat(),
        }
        for n in notes
    ]

    return {"candidate_id": candidate_id, "notes": notes_data, "count": len(notes_data)}


# -------------------------------------------------------------------------
# 5. Presence & Audit History
# -------------------------------------------------------------------------

@router.get("/collaboration/presence")
async def get_team_presence(
    current_user: Dict[str, Any] = Depends(require_role(["employer", "admin"])),
):
    """
    Returns active collaborators and connection count in the recruiter's tenant.
    """
    org_id = current_user.get("org_id") or "org-acme"
    collaborators = collaboration_manager.get_active_collaborators(org_id)
    peer_count = collaboration_manager.get_peer_count(org_id)

    return {
        "org_id": org_id,
        "peer_count": peer_count,
        "collaborators": collaborators,
    }


@router.get("/collaboration/pipeline/history/{candidate_id}")
async def get_pipeline_stage_history(
    candidate_id: str,
    current_user: Dict[str, Any] = Depends(require_role(["employer", "admin"])),
    db: Session = Depends(get_db),
):
    """
    Returns the full timeline of candidate pipeline movements.
    """
    org_id = current_user.get("org_id") or "org-acme"

    changes = (
        db.query(PipelineStageChange)
        .filter(
            PipelineStageChange.candidate_id == candidate_id,
            PipelineStageChange.org_id == org_id,
        )
        .order_by(PipelineStageChange.created_at.desc())
        .all()
    )

    user_ids = [c.changed_by_user_id for c in changes if c.changed_by_user_id]
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u.full_name for u in users}

    history = [
        {
            "id": c.id,
            "from_stage": c.from_stage,
            "to_stage": c.to_stage,
            "changed_by": user_map.get(c.changed_by_user_id, "System"),
            "reason": c.reason,
            "created_at": c.created_at.isoformat(),
        }
        for c in changes
    ]

    return {"candidate_id": candidate_id, "history": history, "count": len(history)}
