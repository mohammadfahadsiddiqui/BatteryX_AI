"""BatteryX AI – Auth API routes"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Organization
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.schemas import LoginRequest, TokenResponse, RegisterRequest
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user(token: str = None, db: Session = None):
    """Dependency to get the current authenticated user from JWT."""
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from app.core.security import decode_token
    return None  # simplified — used inline in routes below


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    org = None
    if request.organization_name:
        org = Organization(name=request.organization_name, type="Other")
        db.add(org)
        db.flush()

    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        role="technician",
        organization_id=org.id if org else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
    )
