# backend/app/crud/crud_category.py
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.db import models_db
from app.schemas import category_schemas

def get_category(db: Session, category_id: int) -> Optional[models_db.Category]:
    """Mengambil satu kategori berdasarkan ID."""
    
    return db.query(models_db.Category).filter(models_db.Category.category_id == category_id).first()

def get_category_by_name(db: Session, name: str) -> Optional[models_db.Category]:
    """Mengambil satu kategori berdasarkan nama."""

    return db.query(models_db.Category).filter(models_db.Category.name == name).first()

def get_categories(db: Session, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
    """Mengambil daftar kategori dengan paginasi dan total count."""
    query = db.query(models_db.Category)
    total = query.count()
    categories_data = query.order_by(models_db.Category.name).offset(skip).limit(limit).all()

    return {"total": total, "data": categories_data}

def create_category(db: Session, category: category_schemas.CategoryCreate) -> models_db.Category:
    """Membuat kategori baru."""
    db_category = models_db.Category(
        name=category.name,
        description=category.description
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category

def update_category(
        db: Session, category_id: int, category_in: category_schemas.CategoryUpdate
    ) -> Optional[models_db.Category]:
    """Memperbarui data kategori."""
    db_category = get_category(db, category_id=category_id)
    if not db_category:
        return None

    update_data = category_in.model_dump(exclude_unset=True) # Pydantic v2

    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category

def delete_category(db: Session, category_id: int) -> Optional[models_db.Category]:
    """Menghapus kategori."""
    db_category = get_category(db, category_id=category_id)
    if db_category:
        # Pertimbangkan apa yang terjadi pada produk jika kategori dihapus.
        # Model Product memiliki ondelete="SET NULL" untuk category_id.
        db.delete(db_category)
        db.commit()

    return db_category
