# backend/app/schemas/order_schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .product_schemas import Product # Untuk menampilkan detail produk dalam item order

# --- Order Item Schemas ---

class OrderItemBase(BaseModel):
    product_id: int = Field(..., description="ID Produk yang dipesan")
    quantity: int = Field(..., gt=0, description="Jumlah produk yang dipesan")

class OrderItemCreate(OrderItemBase):
    # Harga bisa diambil dari produk saat pembuatan order di backend,
    # jadi tidak perlu di-pass dari client, atau bisa opsional jika client bisa override.
    pass

class OrderItem(OrderItemBase):
    order_item_id: int
    order_id: int
    price_at_transaction: float = Field(..., description="Harga produk saat transaksi")
    subtotal: float = Field(..., description="Subtotal untuk item ini (quantity * price_at_transaction)")
    product: Optional[Product] = None # Untuk menampilkan detail produk

class Config:
    from_attributes = True

# --- Order Schemas ---

class OrderBase(BaseModel):
    payment_method: Optional[str] = Field(None, max_length=50, description="Metode pembayaran (Cash, QRIS, dll.)")
    notes: Optional[str] = Field(None, description="Catatan untuk pesanan")
    source: str = Field("dashboard", description="Sumber pesanan (dashboard, whatsapp_bot)")

class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., min_items=1, description="Daftar item yang dipesan")
    # user_id bisa diambil dari token JWT di backend, jadi tidak perlu di-pass dari client
    # total_amount akan dihitung di backend

class OrderUpdate(BaseModel): # Skema untuk memperbarui order (misal status)
    payment_method: Optional[str] = Field(None, max_length=50)
    order_status: Optional[str] = Field(None, max_length=20, description="Status pesanan (completed, pending, cancelled)")
    notes: Optional[str] = None

class Order(OrderBase):
    order_id: int
    order_number: str = Field(..., description="Nomor unik pesanan")
    user_id: Optional[int] = Field(None, description="ID Pengguna yang memproses pesanan (jika ada)")
    total_amount: float = Field(..., description="Total jumlah pesanan")
    order_status: str = Field(..., description="Status pesanan")
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem] = []

class Config:
    rom_attributes = True