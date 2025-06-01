# backend/app/schemas/category_schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Properti dasar untuk kategori
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nama kategori")
    description: Optional[str] = Field(None, description="Deskripsi kategori")

# Properti untuk membuat kategori baru
class CategoryCreate(CategoryBase):
    pass

# Properti untuk memperbarui kategori (semua opsional)
class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

# Properti yang akan dikembalikan oleh API saat membaca data kategori
class Category(CategoryBase):
    category_id: int
    created_at: datetime
    updated_at: datetime

# Jika ingin menampilkan produk dalam kategori:
# from .product_schemas import Product # Hati-hati circular import, mungkin butuh model respons terpisah
# products: List[Product] = []

class Config:
    from_attributes = True