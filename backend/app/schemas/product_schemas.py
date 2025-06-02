# backend/app/schemas/product_schemas.py
from pydantic import BaseModel, Field, ConfigDict # Pastikan ConfigDict diimpor
from typing import Optional, List
from datetime import datetime
from .category_schemas import Category # Impor Category schema

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Nama produk")
    description: Optional[str] = Field(None, description="Deskripsi produk")
    category_id: Optional[int] = Field(None, description="ID Kategori produk")
    purchase_price: float = Field(..., ge=0, description="Harga beli produk")
    selling_price: float = Field(..., ge=0, description="Harga jual produk")
    unit_of_measurement: str = Field("pcs", max_length=20, description="Satuan produk (pcs, kg, liter, dll.)")
    low_stock_threshold: Optional[int] = Field(0, ge=0, description="Batas minimum stok untuk notifikasi")
    image_url: Optional[str] = Field(None, max_length=255, description="URL gambar produk")

class ProductCreate(ProductBase):
    sku: Optional[str] = Field(None, max_length=50, description="SKU produk, harus unik jika diisi")
    current_stock: int = Field(0, ge=0, description="Jumlah stok awal produk")

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)
    sku: Optional[str] = Field(None, max_length=50)
    unit_of_measurement: Optional[str] = Field(None, max_length=20)
    # current_stock tidak diupdate di sini
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None

class Product(ProductBase): # Skema dasar produk untuk respons
    product_id: int
    sku: Optional[str]
    current_stock: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) # <--- PENTING

class ProductWithCategory(Product): # Mewarisi Product, jadi juga mewarisi model_config
    category: Optional[Category] = None

    model_config = ConfigDict(from_attributes=True)
    # Pastikan Category juga punya model_config = ConfigDict(from_attributes=True)
    # di file category_schemas.py