# backend/app/crud/crud_stock.py
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db import models_db
from app.schemas import stock_schemas # Berisi StockIn, StockAdjustment, InventoryLogCreate, InventoryLog
from .crud_product import update_product_stock_internal, get_product # Impor fungsi update stok produk

def create_inventory_log(db: Session, log_entry: stock_schemas.InventoryLogCreate) -> models_db.InventoryLog:
    """Membuat entri baru di inventory log."""
    db_log_entry = models_db.InventoryLog(
        product_id=log_entry.product_id,
        user_id=log_entry.user_id,
        transaction_id=log_entry.transaction_id,
        change_type=log_entry.change_type,
        quantity_change=log_entry.quantity_change,
        stock_before=log_entry.stock_before,
        stock_after=log_entry.stock_after,
        remarks=log_entry.remarks
    )
    db.add(db_log_entry)
    # db.commit() # Commit biasanya dilakukan oleh fungsi pemanggil yang lebih tinggi
    # db.refresh(db_log_entry)
    return db_log_entry

def get_inventory_logs_by_product_id(
        db: Session, product_id: int, skip: int = 0, limit: int = 100
    ) -> List[models_db.InventoryLog]:
    """Mengambil daftar log inventaris untuk produk tertentu."""
    return (
        db.query(models_db.InventoryLog)
        .filter(models_db.InventoryLog.product_id == product_id)
        .order_by(models_db.InventoryLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def add_stock(db: Session, stock_in_data: stock_schemas.StockIn, user_id: Optional[int] = None) -> models_db.InventoryLog:
    """
    Menambah stok produk dan mencatatnya di inventory log.
    Ini adalah operasi transaksional (update produk & buat log).
    """
    db_product = get_product(db, product_id=stock_in_data.product_id)
    if not db_product:
        raise ValueError(f"Produk dengan ID {stock_in_data.product_id} tidak ditemukan.")

    stock_before = db_product.current_stock

    # Update stok produk
    updated_product = update_product_stock_internal(
        db, product_id=stock_in_data.product_id, quantity_change=stock_in_data.quantity
    )
    if not updated_product: # Seharusnya tidak terjadi jika get_product berhasil
        raise ValueError("Gagal memperbarui stok produk.")

    stock_after = updated_product.current_stock

    # Buat entri log
    log_entry_schema = stock_schemas.InventoryLogCreate(
        product_id=stock_in_data.product_id,
        change_type="stock_in",
        quantity_change=stock_in_data.quantity,
        stock_before=stock_before,
        stock_after=stock_after,
        remarks=stock_in_data.remarks,
        user_id=user_id
    )

    db_log = create_inventory_log(db, log_entry=log_entry_schema)

    # Jika ada perubahan harga beli saat stock in
    if stock_in_data.purchase_price is not None and stock_in_data.purchase_price != db_product.purchase_price:
        db_product.purchase_price = stock_in_data.purchase_price

    db.add(db_product)
    db.commit() # Commit semua perubahan (stok produk, log, harga beli jika ada)
    db.refresh(db_log)
    db.refresh(db_product) # Refresh produk juga untuk mendapatkan harga beli terbaru jika diubah

    return db_log

def adjust_stock(db: Session, adjustment_data: stock_schemas.StockAdjustment, user_id: Optional[int] = None) -> models_db.InventoryLog:
    """
    Menyesuaikan stok produk ke jumlah baru dan mencatatnya.
    Ini adalah operasi transaksional.
    """
    db_product = get_product(db, product_id=adjustment_data.product_id)
    if not db_product:
        raise ValueError(f"Produk dengan ID {adjustment_data.product_id} tidak ditemukan.")

    stock_before = db_product.current_stock
    quantity_change = adjustment_data.new_quantity - stock_before

    # Update stok produk ke nilai baru
    # Fungsi update_product_stock_internal menggunakan quantity_change, bukan new_quantity langsung
    updated_product = update_product_stock_internal(
        db, product_id=adjustment_data.product_id, quantity_change=quantity_change
    )
    if not updated_product:
        raise ValueError("Gagal memperbarui stok produk untuk penyesuaian.")

    stock_after = updated_product.current_stock # Seharusnya sama dengan adjustment_data.new_quantity

    # Buat entri log
    log_entry_schema = stock_schemas.InventoryLogCreate(
        product_id=adjustment_data.product_id,
        change_type="adjustment_plus" if quantity_change >= 0 else "adjustment_minus",
        quantity_change=quantity_change,
        stock_before=stock_before,
        stock_after=stock_after,
        remarks=adjustment_data.remarks,
        user_id=user_id
    )

    db_log = create_inventory_log(db, log_entry=log_entry_schema)

    db.commit()
    db.refresh(db_log)
    db.refresh(db_product)

    return db_log

def record_sale_stock_deduction(
        db: Session, product_id: int, quantity_sold: int, order_id: int, user_id: Optional[int] = None
    ) -> models_db.InventoryLog:
    """
    Mencatat pengurangan stok karena penjualan.
    Fungsi ini biasanya dipanggil secara internal saat membuat order.
    """
    if quantity_sold <= 0:
        raise ValueError("Jumlah terjual harus lebih dari nol.")

    db_product = get_product(db, product_id=product_id)

    if not db_product:
        raise ValueError(f"Produk dengan ID {product_id} tidak ditemukan untuk pengurangan stok penjualan.")

    stock_before = db_product.current_stock
    quantity_change = -abs(quantity_sold) # Pengurangan stok

    updated_product = update_product_stock_internal(
        db, product_id=product_id, quantity_change=quantity_change
    )

    if not updated_product:
        raise ValueError("Gagal memperbarui stok produk untuk penjualan.")

    stock_after = updated_product.current_stock

    log_entry_schema = stock_schemas.InventoryLogCreate(
        product_id=product_id,
        change_type="sale",
        quantity_change=quantity_change,
        stock_before=stock_before,
        stock_after=stock_after,
        remarks=f"Penjualan untuk Order ID: {order_id}",
        user_id=user_id,
        transaction_id=order_id
    )

    db_log = create_inventory_log(db, log_entry=log_entry_schema)

    #Commit akan dilakukan oleh fungsi create_order yang memanggil ini.
    return db_log