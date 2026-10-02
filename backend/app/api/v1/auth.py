import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.schemas import (
    LoginRequest,
    TokenResponse,
    UserResponse,
    OrganizationResponse,
    RegisterRequest,
    PasswordResetRequest,
    GenericResponse,
    RoleEnum,
)
from app.models.entities import User, Organization, OrganizationMembership
from app.db.session import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    get_password_hash,
)
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Role-separated authentication endpoint with multi-tenant org validation.
    Persisted via SQLAlchemy relational database.
    """
    user = db.query(User).filter(func.lower(User.email) == req.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials",
        )

    # Cryptographically verify password against stored bcrypt hash
    if not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials",
        )
            
    # Check role alignment
    if user.role != req.role.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account exists under role '{user.role}', but login requested for '{req.role.value}'.",
        )
        
    # Check organization scoping for Employer (E11, E14)
    org_info = None
    target_org_id = req.org_id or user.org_id
    if req.role == RoleEnum.EMPLOYER and target_org_id:
        org_model = db.query(Organization).filter(Organization.id == target_org_id).first()
        if not org_model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requested organization '{target_org_id}' not found.",
            )
        if org_model.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Organization '{org_model.name}' is currently suspended (A7). Access denied.",
            )
        org_info = OrganizationResponse(
            id=org_model.id,
            name=org_model.name,
            type=org_model.type,
            logo=org_model.logo,
            plan=org_model.plan,
            seats_used=org_model.seats_used,
            seats_total=org_model.seats_total,
            status=org_model.status,
        )

    # Issue cryptographically signed JWT access token
    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        org_id=target_org_id,
        email=user.email,
        name=user.full_name,
    )
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=RoleEnum(user.role),
        avatar_url=user.avatar_url,
        org_id=target_org_id,
        org_name=org_info.name if org_info else None,
        college=user.college,
        readiness_score=user.readiness_score,
        current_tier=user.current_tier,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=user_response,
        organization=org_info,
    )

@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the currently authenticated user's profile and active organization context.
    """
    org_name = None
    if current_user.get("org_id"):
        org_model = db.query(Organization).filter(Organization.id == current_user["org_id"]).first()
        if org_model:
            org_name = org_model.name

    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=RoleEnum(current_user["role"]),
        avatar_url=current_user.get("avatar_url"),
        org_id=current_user.get("org_id"),
        org_name=org_name,
        college=current_user.get("college"),
        readiness_score=current_user.get("readiness_score"),
        current_tier=current_user.get("current_tier"),
    )

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new candidate or organization recruiter with bcrypt password encryption
    and persistent database storage.
    """
    existing = db.query(User).filter(func.lower(User.email) == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )
        
    org_info = None
    if req.org_id:
        org_model = db.query(Organization).filter(Organization.id == req.org_id).first()
        if org_model:
            org_info = OrganizationResponse(
                id=org_model.id,
                name=org_model.name,
                type=org_model.type,
                logo=org_model.logo,
                plan=org_model.plan,
                seats_used=org_model.seats_used,
                seats_total=org_model.seats_total,
                status=org_model.status,
            )

    new_user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed_password = get_password_hash(req.password)
    
    new_user = User(
        id=new_user_id,
        email=req.email.lower(),
        password_hash=hashed_password,
        full_name=req.full_name,
        role=req.role.value,
        org_id=req.org_id if req.role == RoleEnum.EMPLOYER else None,
        college=req.college if req.role == RoleEnum.STUDENT else None,
        user_class="Fresher" if req.role == RoleEnum.STUDENT else ("Recruiter" if req.role == RoleEnum.EMPLOYER else "Administrator"),
        readiness_score=70 if req.role == RoleEnum.STUDENT else 0,
        current_tier="bridgeable" if req.role == RoleEnum.STUDENT else "unranked",
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={req.full_name}",
    )
    db.add(new_user)
    
    if req.role == RoleEnum.EMPLOYER and req.org_id:
        membership = OrganizationMembership(
            id=f"mem-{uuid.uuid4().hex[:8]}",
            org_id=req.org_id,
            user_id=new_user_id,
            role="recruiter",
        )
        db.add(membership)
        
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(
        subject=new_user.id,
        role=new_user.role,
        org_id=req.org_id,
        email=new_user.email,
        name=new_user.full_name,
    )
    
    user_response = UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=RoleEnum(new_user.role),
        avatar_url=new_user.avatar_url,
        org_id=req.org_id,
        org_name=org_info.name if org_info else None,
        college=new_user.college,
        readiness_score=new_user.readiness_score,
        current_tier=new_user.current_tier,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=user_response,
        organization=org_info,
    )

@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(db: Session = Depends(get_db)):
    """
    Returns public tenant organizations for the login and onboarding selectors.
    """
    orgs = db.query(Organization).all()
    return [
        OrganizationResponse(
            id=o.id,
            name=o.name,
            type=o.type,
            logo=o.logo,
            plan=o.plan,
            seats_used=o.seats_used,
            seats_total=o.seats_total,
            status=o.status,
        )
        for o in orgs
    ]

@router.post("/forgot-password", response_model=GenericResponse)
async def forgot_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Simulates generating and dispatching a cryptographic one-time password reset token.
    """
    _ = db.query(User).filter(func.lower(User.email) == req.email.lower()).first()
    return GenericResponse(
        success=True,
        message=f"A cryptographic reset token has been dispatched to {req.email}."
    )
