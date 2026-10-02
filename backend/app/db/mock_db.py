"""
[DEPRECATED - SPRINT 4 DATABASE UNIFICATION]
This module provided in-memory mock datasets during early hackathon prototyping.
As of Sprint 4, all platform authentication, tenant organization scoping,
user profiles, assessments, jobs, and notifications have been migrated to
persistent SQLAlchemy models (app.models.entities) and unified session management
(app.db.session).

Do NOT import this module in new services. Use SQLAlchemy Session via Depends(get_db).
"""

import warnings
from typing import Optional, Dict, Any, List
from app.core.security import get_password_hash, verify_password

warnings.warn(
    "app.db.mock_db is deprecated as of Sprint 4 and scheduled for removal. "
    "Use app.db.session and app.models.entities instead.",
    DeprecationWarning,
    stacklevel=2,
)

# Pre-computed bcrypt hash for 'AspireAI@2026'
DEFAULT_HASHED_PASSWORD = get_password_hash("AspireAI@2026")

MOCK_ORGANIZATIONS: Dict[str, Dict[str, Any]] = {
    "org-acme": {
        "id": "org-acme",
        "name": "Acme HyperScale Systems",
        "type": "corporate",
        "logo": "⚡",
        "plan": "Enterprise",
        "seats_used": 14,
        "seats_total": 25,
        "status": "active",
    },
    "org-apex-univ": {
        "id": "org-apex-univ",
        "name": "Apex National Institute of Technology",
        "type": "university",
        "logo": "🎓",
        "plan": "Academic Pass",
        "seats_used": 8,
        "seats_total": 10,
        "status": "active",
    },
    "org-talentbridge": {
        "id": "org-talentbridge",
        "name": "TalentBridge Staffing Partners",
        "type": "staffing",
        "logo": "🌐",
        "plan": "Growth",
        "seats_used": 6,
        "seats_total": 10,
        "status": "active",
    },
}

MOCK_USERS: Dict[str, Dict[str, Any]] = {
    "priya.sharma@acme.com": {
        "id": "usr-recruiter-01",
        "email": "priya.sharma@acme.com",
        "password_hash": DEFAULT_HASHED_PASSWORD,
        "full_name": "Priya Sharma",
        "role": "employer",
        "org_id": "org-acme",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    "aditya.verma@example.com": {
        "id": "cand-1",
        "email": "aditya.verma@example.com",
        "password_hash": DEFAULT_HASHED_PASSWORD,
        "full_name": "Aditya Verma",
        "role": "student",
        "college": "Indian Institute of Information Technology (IIIT)",
        "readiness_score": 78,
        "current_tier": "bridgeable",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    "pooja.s@example.com": {
        "id": "cand-2",
        "email": "pooja.s@example.com",
        "password_hash": DEFAULT_HASHED_PASSWORD,
        "full_name": "Pooja Sundaram",
        "role": "student",
        "college": "National Institute of Technology (NIT) Trichy",
        "readiness_score": 91,
        "current_tier": "job_ready",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    "root@aspire.ai": {
        "id": "usr-superuser-root",
        "email": "root@aspire.ai",
        "password_hash": DEFAULT_HASHED_PASSWORD,
        "full_name": "Platform Superuser",
        "role": "admin",
        "avatar_url": None,
    },
}

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    return MOCK_USERS.get(email.lower())

def get_org_by_id(org_id: str) -> Optional[Dict[str, Any]]:
    return MOCK_ORGANIZATIONS.get(org_id)

def get_all_orgs() -> List[Dict[str, Any]]:
    return list(MOCK_ORGANIZATIONS.values())

def create_user(
    email: str,
    password: str,
    full_name: str,
    role: str,
    org_id: Optional[str] = None,
    college: Optional[str] = None,
) -> Dict[str, Any]:
    new_user = {
        "id": f"usr-{len(MOCK_USERS) + 1}",
        "email": email.lower(),
        "password_hash": get_password_hash(password),
        "full_name": full_name,
        "role": role,
        "org_id": org_id,
        "college": college,
        "readiness_score": 60 if role == "student" else None,
        "current_tier": "bridgeable" if role == "student" else None,
        "avatar_url": None,
    }
    MOCK_USERS[email.lower()] = new_user
    return new_user
