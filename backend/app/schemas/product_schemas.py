# backend/app/schemas/product_schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Impor Category schema jika ingin menampilkannya secara nested
# Anda perlu membuat category_schemas.py terlebih dahulu
# from .category_schemas import Category  # Akan ada circular import jika langsung, tangani di respons model

# Properti dasar untuk produk
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Nama produk")
    description: Optional[str] = Field(None, description="Deskripsi produk")
    category_id: Optional[int] = Field(None, description="ID Kategori produk")
    purchase_price: float = Field(..., ge=0, description="Harga beli produk")
    selling_price: float = Field(..., ge=0, description="Harga jual produk")
    unit_of_measurement: str = Field("pcs", max_length=20, description="Satuan produk (pcs, kg, liter, dll.)")
    low_stock_threshold: Optional[int] = Field(0, ge=0, description="Batas minimum stok untuk notifikasi")
    image_url: Optional[str] = Field(None, max_length=255, description="URL gambar produk")

# Properti untuk membuat produk baru
class ProductCreate(ProductBase):
    sku: Optional[str] = Field(None, max_length=50, description="SKU produk, harus unik jika diisi")
    current_stock: int = Field(0, ge=0, description="Jumlah stok awal produk")

# Properti untuk memperbarui produk (semua opsional)
class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)
    sku: Optional[str] = Field(None, max_length=50)
    unit_of_measurement: Optional[str] = Field(None, max_length=20)
    current_stock: Optional[int] = Field(None, ge=0) # Biasanya stok diupdate via endpoint khusus stok
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None

# Properti yang akan dikembalikan oleh API saat membaca data produk
class Product(ProductBase):
    product_id: int
    sku: Optional[str]
    current_stock: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # category: Optional[Category] = None # Jika ingin menampilkan detail kategori

class Config:
    from_attributes = True

# Skema untuk respons yang menyertakan detail kategori (setelah category_schemas dibuat)
class ProductWithCategory(Product):
    from .category_schemas import Category # Impor di sini untuk menghindari circular import level atas
    category: Optional[Category] = None
