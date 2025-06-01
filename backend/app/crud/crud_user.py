# backend/app/crud/crud_user.py
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db import models_db
from app.schemas import user_schemas
from app.core.security import get_password_hash # Untuk hashing password saat membuat user

def get_user(db: Session, user_id: int) -> Optional[models_db.User]:
    """Mengambil satu user berdasarkan ID."""

    return db.query(models_db.User).filter(models_db.User.user_id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[models_db.User]:
    """Mengambil satu user berdasarkan username."""

    return db.query(models_db.User).filter(models_db.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models_db.User]:
    """Mengambil daftar user dengan paginasi."""

    return db.query(models_db.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: user_schemas.UserCreate) -> models_db.User:
    """Membuat user baru."""
    hashed_password = get_password_hash(user.password)
    db_user = models_db.User(
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        is_active=True # Default user aktif saat dibuat
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

def update_user(
        db: Session, user_id: int, user_in: user_schemas.UserUpdate # Buat skema UserUpdate jika belum ada
    ) -> Optional[models_db.User]:
    """Memperbarui data user."""
    db_user = get_user(db, user_id=user_id)

    if not db_user:
        return None

    update_data = user_in.model_dump(exclude_unset=True) # Pydantic v2

    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        db_user.hashed_password = hashed_password
        del update_data["password"] # Hapus password agar tidak di-set langsung

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> Optional[models_db.User]:
    """Menghapus user."""
    db_user = get_user(db, user_id=user_id)
    if db_user:
        db.delete(db_user)
        db.commit()

    return db_user

# Skema UserUpdate (jika belum ada, bisa ditambahkan di user_schemas.py):
# class UserUpdate(UserBase):
# password: Optional[str] = None
# is_active: Optional[bool] = None
# (Anda mungkin sudah punya skema yang mirip atau bisa menyesuaikan)
