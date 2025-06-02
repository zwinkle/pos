# backend/app/crud/crud_order.py
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import Optional, List, Dict, Any
from datetime import datetime
import shortuuid # pip install shortuuid

from app.db import models_db
from app.schemas import order_schemas
from .crud_product import get_product
from .crud_stock import record_sale_stock_deduction # Untuk mencatat pengurangan stok

def generate_order_number() -> str:
    """Menghasilkan nomor order unik."""
    # Format: INV-YYYYMMDD-XXXXXX (X adalah random alphanumeric)
    date_prefix = datetime.now().strftime("%Y%m%d")
    random_suffix = shortuuid.ShortUUID().random(length=6).upper()

    return f"INV-{date_prefix}-{random_suffix}"

def get_order(db: Session, order_id: int, load_items: bool = True, load_user: bool = False) -> Optional[models_db.Order]:
    query = db.query(models_db.Order)
    if load_items:
        # Pastikan ini memuat product di dalam order_items juga
        query = query.options(
            selectinload(models_db.Order.items) # Memuat items
            .selectinload(models_db.OrderItem.product) # Memuat product di dalam setiap item
            .joinedload(models_db.Product.category) # Opsional: memuat kategori produk jika diperlukan di detail
        )
    if load_user:
        query = query.options(joinedload(models_db.Order.processed_by_user))

    return query.filter(models_db.Order.order_id == order_id).first()

def get_order_by_order_number(db: Session, order_number: str) -> Optional[models_db.Order]:
    """Mengambil satu order berdasarkan nomor order."""

    return db.query(models_db.Order).filter(models_db.Order.order_number == order_number).first()

def get_orders(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status: Optional[str] = None,
        load_items: bool = False
    ) -> Dict[str, Any]:
    """Mengambil daftar order dengan filter, paginasi, dan total count."""
    query = db.query(models_db.Order)

    if load_items:
        query = query.options(selectinload(models_db.Order.items).joinedload(models_db.OrderItem.product))

    if user_id is not None:
        query = query.filter(models_db.Order.user_id == user_id)
    if start_date:
        query = query.filter(models_db.Order.created_at >= start_date)
    if end_date:
        # Untuk end_date yang inklusif hingga akhir hari
        end_datetime_inclusive = datetime.combine(end_date, datetime.max.time())
        query = query.filter(models_db.Order.created_at <= end_datetime_inclusive)
    if status:
        query = query.filter(models_db.Order.order_status == status)

    total = query.count()
    
    orders_data = query.order_by(models_db.Order.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "data": orders_data}

def create_order(
        db: Session, order_in: order_schemas.OrderCreate, current_user_id: Optional[int] = None
    ) -> models_db.Order:
    """
    Membuat order baru, termasuk item order, memperbarui stok produk, 
    dan mencatat log inventaris dengan status kondisional.
    """
    total_amount = 0
    db_order_items = []

    # 1. Validasi item dan hitung total
    for item_in in order_in.items:
        db_product = get_product(db, product_id=item_in.product_id)
        if not db_product:
            raise ValueError(f"Produk dengan ID {item_in.product_id} tidak ditemukan.")
        if not db_product.is_active:
            raise ValueError(f"Produk '{db_product.name}' tidak aktif dan tidak dapat dipesan.")
        if db_product.current_stock < item_in.quantity:
            raise ValueError(f"Stok produk '{db_product.name}' tidak mencukupi (tersisa: {db_product.current_stock}, diminta: {item_in.quantity}).")

        price_at_transaction = db_product.selling_price
        subtotal = price_at_transaction * item_in.quantity
        total_amount += subtotal

        db_order_item = models_db.OrderItem(
            product_id=item_in.product_id,
            quantity=item_in.quantity,
            price_at_transaction=price_at_transaction,
            subtotal=subtotal
        )
        db_order_items.append(db_order_item)

    # 2. Tentukan status order berdasarkan metode pembayaran
    initial_order_status = "completed" # Default jika tidak ada kondisi lain
    if order_in.payment_method and order_in.payment_method.lower() != "cash":
        initial_order_status = "pending"
    # Anda bisa menambahkan logika lebih lanjut di sini jika perlu
    # misalnya, jika payment_method null, bisa dianggap 'pending' atau 'draft'

    # 3. Buat objek Order utama
    order_number = generate_order_number()
    while get_order_by_order_number(db, order_number):
        order_number = generate_order_number()

    db_order = models_db.Order(
        order_number=order_number,
        user_id=current_user_id,
        total_amount=total_amount,
        payment_method=order_in.payment_method,
        order_status=initial_order_status, # <<--- STATUS KONDISIONAL DITERAPKAN DI SINI
        source=order_in.source,
        notes=order_in.notes
    )
    db.add(db_order)
    db.flush() # Dapatkan order_id untuk db_order sebelum menambah items

    # 4. Kaitkan OrderItems dengan Order, kurangi stok produk & catat log
    for db_item_to_add in db_order_items:
        db_item_to_add.order_id = db_order.order_id
        db.add(db_item_to_add)
        try:
            record_sale_stock_deduction(
                db,
                product_id=db_item_to_add.product_id,
                quantity_sold=db_item_to_add.quantity,
                order_id=db_order.order_id,
                user_id=current_user_id
            )
        except ValueError as e:
            db.rollback()
            raise ValueError(f"Gagal memproses item '{get_product(db, db_item_to_add.product_id).name}': {str(e)}")

    # 5. Commit semua perubahan jika berhasil
    db.commit()
    db.refresh(db_order)
    # Opsional: refresh items jika diperlukan dalam respons langsung
    for item in db_order.items:
        db.refresh(item)
        if item.product:
            db.refresh(item.product)

    return db_order

def update_order_status(db: Session, order_id: int, new_status: str) -> Optional[models_db.Order]:
    """Memperbarui status order."""
    db_order = get_order(db, order_id=order_id, load_items=False) # Tidak perlu load item untuk update status
    if not db_order:
        return None

    # Validasi status baru (opsional, bisa divalidasi di router/service)
    allowed_statuses = ["pending", "completed", "cancelled", "shipped", "delivered"]
    if new_status not in allowed_statuses:
        raise ValueError(f"Status '{new_status}' tidak valid.")

    # Logika tambahan jika status berubah (misal: pengembalian stok jika 'cancelled')
    if new_status == "cancelled" and db_order.order_status != "cancelled":
        # TODO: Implementasikan logika pengembalian stok jika order dibatalkan
        # Ini melibatkan penambahan stok kembali ke produk dan pembuatan inventory log tipe 'return' atau 'cancellation_restock'
        # Contoh:
        # for item in db_order.items:
        #     # Panggil fungsi untuk menambah stok dan log
        #     pass
        print(f"PERINGATAN: Order {db_order.order_number} dibatalkan. Implementasikan logika pengembalian stok.")

    db_order.order_status = new_status
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    return db_order

# Anda bisa menambahkan fungsi update order yang lebih umum jika perlu
# def update_order(db: Session, order_id: int, order_in: order_schemas.OrderUpdate) -> Optional[models_db.Order]:
# ...