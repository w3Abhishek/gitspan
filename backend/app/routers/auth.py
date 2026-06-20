from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.db import User

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    name: str
    email: str
    password: str


class LoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str
    plan: str


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # First user becomes admin
    is_first = db.query(User).count() == 0
    user = User(
        name=body.name,
        email=body.email,
        hashed_pw=hash_password(body.password),
        role="admin" if is_first else "user",
        plan="self-hosted" if is_first else "free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenOut(access_token=token, user_id=user.id, name=user.name,
                    email=user.email, role=user.role, plan=user.plan)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_pw):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id)
    return TokenOut(access_token=token, user_id=user.id, name=user.name,
                    email=user.email, role=user.role, plan=user.plan)


@router.get("/me", response_model=TokenOut)
def me(current_user: User = Depends(get_current_user)):
    return TokenOut(
        access_token="",  # client already has their token
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        plan=current_user.plan,
    )
