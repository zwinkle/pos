# backend/app/routers/categories.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas import category_schemas
from app.crud import crud_category
from app.core.security import get_current_active_user # Proteksi endpoint jika perlu
from app.schemas.user_schemas import User # Untuk type hint current_user

router = APIRouter()

@router.post("/", response_model=category_schemas.Category, status_code=status.HTTP_201_CREATED, tags=["Categories"])
def create_new_category(
        category_in: category_schemas.CategoryCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user) # Contoh proteksi
    ):
    """
    Membuat kategori baru.
    (Endpoint ini mungkin memerlukan otorisasi tertentu, misal role 'staff' atau 'admin')
    """
    # Contoh: Jika hanya admin atau staff yang boleh membuat kategori
    # if current_user.role not in ["admin", "staff"]:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    db_category = crud_category.get_category_by_name(db, name=category_in.name)
    if db_category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already exists")

    return crud_category.create_category(db=db, category=category_in)

@router.get("/", response_model=List[category_schemas.Category], tags=["Categories"])
def read_all_categories(
        skip: int = 0,
        limit: int = Query(default=100, ge=1, le=200),
        db: Session = Depends(get_db)
        # Tidak perlu current_user jika endpoint ini publik atau untuk semua user terautentikasi
    ):
    """
    Mendapatkan daftar semua kategori.
    """
    categories = crud_category.get_categories(db, skip=skip, limit=limit)

    return categories

@router.get("/{category_id}", response_model=category_schemas.Category, tags=["Categories"])
def read_category_by_id(
        category_id: int,
        db: Session = Depends(get_db)
    ):
    """
    Mendapatkan detail kategori berdasarkan ID.
    """
    db_category = crud_category.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    return db_category

@router.put("/{category_id}", response_model=category_schemas.Category, tags=["Categories"])
def update_existing_category(
        category_id: int,
        category_in: category_schemas.CategoryUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user) # Contoh proteksi
    ):
    """
    Memperbarui kategori yang sudah ada.
    """
    db_category = crud_category.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Cek jika nama baru sudah digunakan oleh kategori lain
    if category_in.name and category_in.name != db_category.name:
        existing_category_with_name = crud_category.get_category_by_name(db, name=category_in.name)
    if existing_category_with_name and existing_category_with_name.category_id != category_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already exists")

    return crud_category.update_category(db=db, category_id=category_id, category_in=category_in)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Categories"])
def delete_existing_category(
        category_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user) # Contoh proteksi
    ):
    """
    Menghapus kategori.
    (Perhatikan relasi dengan produk, di model diatur ON DELETE SET NULL)
    """
    db_category = crud_category.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    crud_category.delete_category(db=db, category_id=category_id)
    
    return None