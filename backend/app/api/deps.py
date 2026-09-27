from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.entities import User
from app.db.mock_db import get_user_by_email

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Hardened cryptographic Bearer token authenticator (Audit §4.6 & Milestone 1).
    Validates signature, expiration, and loads active user profile from relational DB.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer Header. Access requires valid JWT token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cryptographic Token Expired or Invalid signature",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims: missing subject email",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 1. Query user from relational PostgreSQL/SQLite database
    db_user = db.query(User).filter(User.email == email.lower()).first()
    if db_user:
        return {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": db_user.role,
            "org_id": db_user.org_id,
            "user_class": db_user.user_class,
            "college": db_user.college,
            "readiness_score": db_user.readiness_score,
            "current_tier": db_user.current_tier,
            "avatar_url": db_user.avatar_url,
        }

    # 2. Fallback to mock_db for backward compatibility
    mock_user = get_user_by_email(email)
    if not mock_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User associated with email '{email}' not found.",
        )
        
    return mock_user

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency for endpoints that provide enriched responses
    to authenticated callers while remaining accessible to public visitors.
    """
    if not credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        if not payload or not payload.get("email"):
            return None
        email = payload["email"]
        db_user = db.query(User).filter(User.email == email.lower()).first()
        if db_user:
            return {
                "id": db_user.id,
                "email": db_user.email,
                "full_name": db_user.full_name,
                "role": db_user.role,
                "org_id": db_user.org_id,
            }
        return get_user_by_email(email)
    except Exception:
        return None

def require_role(allowed_roles: List[str]):
    """
    FastAPI RBAC role enforcer dependency (Audit §4.6 & Milestone 1).
    Ensures caller holds one of the specified allowed_roles.
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of {allowed_roles} roles. Active identity is '{user_role}'.",
            )
        return current_user
    return role_checker

def verify_org_isolation(current_user: Dict[str, Any], target_org_id: str):
    """Enforces multi-tenant isolation: reject requests where target org_id != user org_id"""
    if current_user.get("role") == "admin":
        return True  # Platform superuser can audit all orgs
        
    user_org = current_user.get("org_id")
    if not user_org or user_org != target_org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant Isolation Violation: Cross-organization data access rejected (NF6)",
        )
    return True
