# backend/app/routers/bot_interface.py
from fastapi import APIRouter, Depends, HTTPException, status, Header, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.core.config import settings
from app.crud import crud_product, crud_order, crud_stock # Impor CRUD yang relevan
from app.schemas import product_schemas, order_schemas, stock_schemas # Impor skema yang relevan

router = APIRouter()

# Definisikan skema untuk keamanan API Key (jika digunakan)

API_KEY_NAME = "X-API-KEY" # Nama header untuk API Key
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key: Optional[str] = Security(api_key_header)):
    """Dependency untuk validasi API Key."""
    if not api_key or api_key != settings.BOT_API_KEY: # Ambil BOT_API_KEY dari config
        raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate credentials or invalid API Key"
        )
    
    return api_key

# Skema untuk input perintah dari bot
class BotCommandPayload(BaseModel):
    command: str = Field(..., description="Perintah dari bot (misal: 'sell', 'check_stock', 'add_stock_manual')")
    product_name: Optional[str] = Field(None, description="Nama produk yang dicari/diproses")
    quantity: Optional[int] = Field(None, description="Jumlah produk")
    unit: Optional[str] = Field(None, description="Satuan produk")
    user_identifier: Optional[str] = Field(None, description="Identifier pengguna bot (misal: nomor telepon)")
    # Tambahkan parameter lain yang mungkin dikirim bot

@router.post("/process_command", response_model=Dict[str, Any], tags=["Bot Interface"])
async def process_bot_command(
        payload: BotCommandPayload,
        db: Session = Depends(get_db),
        api_key: str = Depends(get_api_key) # Menggunakan API Key untuk autentikasi bot
    ):
    """
    Menerima dan memproses perintah dari bot WhatsApp.
    """
    command = payload.command.lower()
    product_name = payload.product_name
    quantity = payload.quantity
    response_message = "Perintah tidak dikenali."
    success = False
    data = None

    try:
        if command == "check_stock":
            if not product_name:
                raise ValueError("Nama produk diperlukan untuk cek stok.")
            # Cari produk. Mungkin perlu pencarian yang lebih fuzzy atau by SKU.
            # Untuk simple, kita cari berdasarkan nama persis (case-insensitive).
            products = crud_product.get_products(db, search=product_name, limit=5, only_active=True)
            if not products:
                response_message = f"Produk '{product_name}' tidak ditemukan."
            elif len(products) == 1:
                product = products[0]
                response_message = f"Stok {product.name}: {product.current_stock} {product.unit_of_measurement}."
                success = True
                data = {"product_name": product.name, "stock": product.current_stock, "unit": product.unit_of_measurement}
            else:
                suggestions = [f"{p.name} (Stok: {p.current_stock})" for p in products]
                response_message = f"Produk '{product_name}' ambigu. Ditemukan: {', '.join(suggestions[:3])}. Mohon lebih spesifik."

        elif command == "sell":
            if not product_name or quantity is None or quantity <= 0:
                raise ValueError("Nama produk dan jumlah (lebih dari 0) diperlukan untuk penjualan.")

            products = crud_product.get_products(db, search=product_name, limit=1, only_active=True)
            if not products:
                raise ValueError(f"Produk '{product_name}' tidak ditemukan untuk dijual.")
            product_to_sell = products[0]

            # Buat OrderCreate schema
            order_item_in = order_schemas.OrderItemCreate(product_id=product_to_sell.product_id, quantity=quantity)
            order_in = order_schemas.OrderCreate(
                items=[order_item_in],
                payment_method="Bot/Cash", # Atau metode pembayaran default dari bot
                source="whatsapp_bot",
                notes=f"Penjualan via Bot oleh {payload.user_identifier or 'Unknown User'}"
            )
            # User ID untuk order bisa null atau ID user bot khusus jika ada
            created_order = crud_order.create_order(db=db, order_in=order_in, current_user_id=None) # Ganti None dengan ID user bot jika ada
            response_message = f"Penjualan {quantity} {product_to_sell.unit_of_measurement} '{product_to_sell.name}' berhasil dicatat. Order No: {created_order.order_number}."
            success = True
            data = {"order_number": created_order.order_number, "total_amount": created_order.total_amount}

    # elif command == "add_stock_manual":
    #     # Implementasi untuk bot menambah stok (PERLU OTORISASI KETAT)
    #     # Misalnya, hanya admin yang bisa mengirim perintah ini dari nomor WA terdaftar
    #     if not product_name or quantity is None or quantity <= 0:
    #         raise ValueError("Nama produk dan jumlah (lebih dari 0) diperlukan untuk menambah stok.")
    #     # ... logika cari produk, panggil crud_stock.add_stock ...
    #     response_message = "Stok berhasil ditambahkan (implementasi contoh)."
    #     success = True

        else:
            response_message = f"Perintah '{command}' tidak didukung."

    except ValueError as ve:
        response_message = str(ve)
        success = False
    except HTTPException: # Teruskan HTTPException jika sudah dilempar dari CRUD
        raise
    except Exception as e:
        # Log error e
        response_message = "Terjadi kesalahan internal saat memproses perintah."
        success = False
        # Jangan kirim detail error ke bot kecuali untuk debugging
        # print(f"Error processing bot command: {e}")

    return {"success": success, "message": response_message, "data": data}

# Endpoint untuk saran produk bisa menggunakan yang sudah ada di products.py
# Jika /products/suggest memerlukan autentikasi user dan bot menggunakan API Key,
# Anda bisa membuat wrapper di sini atau memodifikasi /products/suggest agar bisa menerima API Key.

# Contoh:
# @router.get("/suggest_product_for_bot", response_model=List[product_schemas.Product], tags=["Bot Interface"])
# async def suggest_products_for_bot_endpoint(
# query: str = Query(..., min_length=1),
# limit: int = Query(default=5, ge=1, le=10),
# db: Session = Depends(get_db),
# api_key: str = Depends(get_api_key) # Proteksi dengan API Key
# ):
# """Endpoint saran produk khusus untuk bot dengan API Key."""
# products = crud_product.get_products(
# db, search=query, limit=limit, only_active=True, load_category=False
# )
# return products