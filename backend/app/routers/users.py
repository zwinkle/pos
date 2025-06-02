# backend/app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.common_schemas import PaginatedResponse
from app.schemas import user_schemas
from app.crud import crud_user
from app.core.security import get_current_active_user # Untuk proteksi endpoint

router = APIRouter()

# Endpoint untuk membuat user baru bisa juga diletakkan di sini,
# mungkin dengan proteksi peran admin. Jika sudah ada di auth.py, tidak perlu duplikasi.

# @router.post("/", response_model=user_schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
# def create_new_user(
# user_in: user_schemas.UserCreate,
# db: Session = Depends(get_db),
# # current_admin: user_schemas.User = Depends(get_current_admin_user) # Buat dependency ini jika perlu
# ):
# db_user = crud_user.get_user_by_username(db, username=user_in.username)
# if db_user:
# raise HTTPException(status_code=400, detail="Username already registered")
# return crud_user.create_user(db=db, user=user_in)

@router.get("/", response_model=PaginatedResponse[user_schemas.User], tags=["Users"]) # Update response_model
def read_users(
        skip: int = 0,
        limit: int = Query(default=100, ge=1, le=200),
        db: Session = Depends(get_db),
        current_user: user_schemas.User = Depends(get_current_active_user)
    ):
    """
    Mendapatkan daftar semua user dengan pagination.
    (Sebaiknya diproteksi hanya untuk admin)
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
    users_result = crud_user.get_users(db, skip=skip, limit=limit) # CRUD mengembalikan dict

    return PaginatedResponse[user_schemas.User](
        total=users_result["total"],
        data=users_result["data"]
    )

@router.get("/{user_id}", response_model=user_schemas.User, tags=["Users"])
def read_user_by_id(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: user_schemas.User = Depends(get_current_active_user) # Proteksi
    ):
    """
    Mendapatkan detail user berdasarkan ID.
    (User bisa melihat data dirinya, admin bisa melihat semua)
    """
    if current_user.role != "admin" and current_user.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return db_user

@router.put("/{user_id}", response_model=user_schemas.User, tags=["Users"])
def update_existing_user(
        user_id: int,
        user_in: user_schemas.UserUpdate, # Pastikan skema UserUpdate sudah ada
        db: Session = Depends(get_db),
        current_user: user_schemas.User = Depends(get_current_active_user) # Proteksi
    ):
    """
    Memperbarui data user.
    (User bisa update data dirinya, admin bisa update semua. Hati-hati dengan perubahan role)
    """
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if current_user.role != "admin" and current_user.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this user")
    # Jika bukan admin, jangan biarkan user mengubah role dirinya sendiri atau user lain
    if current_user.role != "admin" and user_in.role is not None and user_in.role != db_user.role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change role")

    updated_user = crud_user.update_user(db=db, user_id=user_id, user_in=user_in)

    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"])
def delete_existing_user(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: user_schemas.User = Depends(get_current_active_user) # Proteksi
    ):
    """
    Menghapus user. (Sebaiknya hanya admin)
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    if current_user.user_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin cannot delete self via this endpoint")

    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    crud_user.delete_user(db=db, user_id=user_id)
    
    return None # Atau kembalikan pesan sukses