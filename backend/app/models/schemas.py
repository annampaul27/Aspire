from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum

class RoleEnum(str, Enum):
    EMPLOYER = "employer"
    STUDENT = "student"
    ADMIN = "admin"

class OrgTypeEnum(str, Enum):
    CORPORATE = "corporate"
    UNIVERSITY = "university"
    STAFFING = "staffing"

class OrganizationResponse(BaseModel):
    id: str
    name: str
    type: str
    logo: str
    plan: str
    seats_used: int
    seats_total: int
    status: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: RoleEnum
    avatar_url: Optional[str] = None
    org_id: Optional[str] = None
    org_name: Optional[str] = None
    college: Optional[str] = None
    readiness_score: Optional[int] = None
    current_tier: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    role: RoleEnum = RoleEnum.EMPLOYER
    org_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserResponse
    organization: Optional[OrganizationResponse] = None

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: RoleEnum = RoleEnum.STUDENT
    org_id: Optional[str] = None
    college: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class GenericResponse(BaseModel):
    success: bool
    message: str
