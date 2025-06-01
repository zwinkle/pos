# backend/app/crud/crud_order.py
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import Optional, List
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
    """Mengambil satu order berdasarkan ID, dengan opsi memuat item dan user."""
    query = db.query(models_db.Order)

    if load_items:
        # Menggunakan selectinload untuk efisiensi memuat relasi many (items)
        query = query.options(selectinload(models_db.Order.items).joinedload(models_db.OrderItem.product).joinedload(models_db.Product.category))
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
        load_items: bool = False # Opsi untuk memuat item pesanan
    ) -> List[models_db.Order]:
    """Mengambil daftar order dengan filter dan paginasi."""
    query = db.query(models_db.Order)

    if load_items:
        query = query.options(selectinload(models_db.Order.items).joinedload(models_db.OrderItem.product))
    if user_id is not None:
        query = query.filter(models_db.Order.user_id == user_id)
    if start_date:
        query = query.filter(models_db.Order.created_at >= start_date)
    if end_date:
        # Tambahkan 1 hari ke end_date jika ingin inklusif hingga akhir hari tersebut
        # from datetime import timedelta
        # query = query.filter(models_db.Order.created_at < (end_date + timedelta(days=1)))
        query = query.filter(models_db.Order.created_at <= end_date)
    if status:
        query = query.filter(models_db.Order.order_status == status)

    return query.order_by(models_db.Order.created_at.desc()).offset(skip).limit(limit).all()

def create_order(
        db: Session, order_in: order_schemas.OrderCreate, current_user_id: Optional[int] = None
    ) -> models_db.Order:
    """
    Membuat order baru, termasuk item order, memperbarui stok produk, dan mencatat log inventaris.
    Ini adalah operasi transaksional yang kompleks.
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

        price_at_transaction = db_product.selling_price # Ambil harga jual saat ini
        subtotal = price_at_transaction * item_in.quantity
        total_amount += subtotal

        db_order_item = models_db.OrderItem(
            product_id=item_in.product_id,
            quantity=item_in.quantity,
            price_at_transaction=price_at_transaction,
            subtotal=subtotal
            # order_id akan diisi setelah db_order dibuat
        )
        db_order_items.append(db_order_item)

    # 2. Buat objek Order utama
    order_number = generate_order_number()
    while get_order_by_order_number(db, order_number): # Pastikan nomor order unik
        order_number = generate_order_number()

    db_order = models_db.Order(
        order_number=order_number,
        user_id=current_user_id,
        total_amount=total_amount,
        payment_method=order_in.payment_method,
        order_status="completed", # Atau 'pending' jika ada proses pembayaran terpisah
        source=order_in.source,
        notes=order_in.notes
    )
    db.add(db_order)

    # Tidak commit dulu, tunggu semua operasi terkait selesai
    # 3. Kaitkan OrderItems dengan Order dan kurangi stok produk & catat log
    # Flush untuk mendapatkan order_id untuk db_order
    db.flush()

    for i, db_item_to_add in enumerate(db_order_items):
        db_item_to_add.order_id = db_order.order_id
        db.add(db_item_to_add)

    # Kurangi stok dan catat log inventaris untuk penjualan
    try:
        record_sale_stock_deduction(
            db,
            product_id=db_item_to_add.product_id,
            quantity_sold=db_item_to_add.quantity,
            order_id=db_order.order_id,
            user_id=current_user_id
        )
    except ValueError as e:
        db.rollback() # Rollback semua jika ada masalah pengurangan stok
        raise ValueError(f"Gagal memproses item '{get_product(db, db_item_to_add.product_id).name}': {str(e)}")

    # 4. Commit semua perubahan jika berhasil
    db.commit()
    db.refresh(db_order)

    # Refresh item juga jika ingin mengembalikannya dengan detail lengkap (opsional di sini)
    for item in db_order.items:
        db.refresh(item)
    if item.product: # Jika relasi produk sudah dimuat
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