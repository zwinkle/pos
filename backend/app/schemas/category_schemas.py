# backend/app/schemas/category_schemas.py
from pydantic import BaseModel, Field, ConfigDict # Pastikan ConfigDict diimpor
from typing import Optional, List
from datetime import datetime

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nama kategori")
    description: Optional[str] = Field(None, description="Deskripsi kategori")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

class Category(CategoryBase):
    category_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) # <--- TAMBAHKAN ATAU PASTIKAN INI ADA DAN BENAR