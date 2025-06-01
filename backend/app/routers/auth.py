# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.database import get_db
from app.schemas import user_schemas, token_schemas
from app.crud import crud_user
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=token_schemas.Token, tags=["Authentication"])
async def login_for_access_token(
        db: Session = Depends(get_db),
        form_data: OAuth2PasswordRequestForm = Depends()
    ):
    """
    Login user dan dapatkan access token.
    Username dan password dikirim sebagai form data.
    """
    user = crud_user.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.user_id}, # Tambahkan data lain jika perlu di token
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=user_schemas.User, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register_new_user(
        user_in: user_schemas.UserCreate,
        db: Session = Depends(get_db)
    ):
    """
    Registrasi pengguna baru. (Endpoint ini bisa diatur hanya untuk admin jika diperlukan)
    """
    db_user = crud_user.get_user_by_username(db, username=user_in.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    # Anda bisa menambahkan validasi email atau role di sini jika perlu
    created_user = crud_user.create_user(db=db, user=user_in)

    return created_user

@router.get("/users/me", response_model=user_schemas.User, tags=["Users"])
async def read_users_me(
        current_user: user_schemas.User = Depends(security.get_current_active_user)
    ):
    """
    Mendapatkan detail user yang sedang login.
    """

    return current_user

# Anda bisa menambahkan endpoint untuk refresh token jika diperlukan