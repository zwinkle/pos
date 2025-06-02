# backend/app/schemas/stock_schemas.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

# Skema untuk input penambahan stok (Stock In)
class StockIn(BaseModel):
    product_id: int = Field(..., description="ID Produk yang stoknya ditambah")
    quantity: int = Field(..., gt=0, description="Jumlah stok yang ditambah")
    remarks: Optional[str] = Field(None, description="Catatan tambahan (misal: nomor faktur pembelian)")
    # Harga beli bisa opsional di sini jika tidak selalu diupdate saat stock in,
    # atau bisa wajib jika ingin mencatat perubahan harga beli.
    purchase_price: Optional[float] = Field(None, ge=0, description="Harga beli baru (jika ada perubahan)")

# Skema untuk input penyesuaian stok (Stock Adjustment)
class StockAdjustment(BaseModel):
    product_id: int = Field(..., description="ID Produk yang stoknya disesuaikan")
    new_quantity: int = Field(..., ge=0, description="Jumlah stok baru setelah penyesuaian")
    remarks: str = Field(..., min_length=1, description="Alasan penyesuaian stok (misal: Stok Opname, Barang Rusak)")

class InventoryLogBase(BaseModel):
    product_id: int
    change_type: str = Field(..., description="Tipe perubahan stok (misal: 'stock_in', 'sale', 'adjustment')")
    quantity_change: int
    remarks: Optional[str] = None

class InventoryLogCreate(InventoryLogBase):
    user_id: Optional[int] = None
    transaction_id: Optional[int] = None
    stock_before: int
    stock_after: int

class InventoryLog(InventoryLogBase): # Skema yang digunakan untuk respons
    log_id: int
    user_id: Optional[int] = None
    transaction_id: Optional[int] = None
    stock_before: int
    stock_after: int
    created_at: datetime
    # Anda bisa menambahkan detail produk atau user jika diperlukan untuk respons
    # from .product_schemas import Product
    # product: Optional[Product] = None

    # Konfigurasi untuk Pydantic v2
    model_config = ConfigDict(from_attributes=True) 