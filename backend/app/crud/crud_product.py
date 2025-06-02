# backend/app/crud/crud_product.py
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List

from app.db import models_db
from app.schemas import product_schemas
from app.schemas.common_schemas import PaginatedResponse

# Impor crud_stock untuk mencatat log inventaris awal jika diperlukan
# from . import crud_stock # Akan menyebabkan circular import jika crud_stock juga impor crud_product

# Solusi: pass db session ke fungsi crud_stock dari sini, atau fungsi crud_stock tidak bergantung crud_product
def get_product(db: Session, product_id: int, load_category: bool = False) -> Optional[models_db.Product]:
    """Mengambil satu produk berdasarkan ID, dengan opsi memuat detail kategori."""
    query = db.query(models_db.Product)
    if load_category:
        query = query.options(joinedload(models_db.Product.category))

    return query.filter(models_db.Product.product_id == product_id).first()

def get_product_by_sku(db: Session, sku: str) -> Optional[models_db.Product]:
    """Mengambil satu produk berdasarkan SKU."""
    if not sku: # SKU bisa None/kosong
        return None
    
    return db.query(models_db.Product).filter(models_db.Product.sku == sku).first()

def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        only_active: bool = True,
        load_category: bool = False
    ) -> dict: # Ubah tipe kembalian ke dict atau skema PaginatedResponse jika Anda parsing di sini
    """Mengambil daftar produk dengan filter, paginasi, dan total count."""
    query = db.query(models_db.Product)

    if load_category:
        query = query.options(joinedload(models_db.Product.category))

    if only_active:
        query = query.filter(models_db.Product.is_active == True)
    if category_id is not None:
        query = query.filter(models_db.Product.category_id == category_id)
    if search:
        query = query.filter(models_db.Product.name.ilike(f"%{search}%"))

    total = query.count() # Hitung total sebelum paginasi
    
    data = query.order_by(models_db.Product.name).offset(skip).limit(limit).all()
    
    return {"total": total, "data": data}

def create_product(db: Session, product: product_schemas.ProductCreate, user_id: Optional[int] = None) -> models_db.Product:
    """Membuat produk baru."""
    # Cek SKU unik jika diisi
    if product.sku and get_product_by_sku(db, sku=product.sku):
        raise ValueError(f"Produk dengan SKU '{product.sku}' sudah ada.")

    db_product = models_db.Product(
        name=product.name,
        description=product.description,
        category_id=product.category_id,
        purchase_price=product.purchase_price,
        selling_price=product.selling_price,
        current_stock=product.current_stock,
        unit_of_measurement=product.unit_of_measurement,
        low_stock_threshold=product.low_stock_threshold,
        image_url=product.image_url,
        sku=product.sku,
        is_active=True
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Jika ada stok awal, catat di inventory log
    if db_product.current_stock > 0:
        # Untuk menghindari circular import, logika create_inventory_log bisa dipanggil di sini
        # atau dipanggil dari service layer yang lebih tinggi.
        # Asumsikan kita punya fungsi create_initial_stock_log di crud_stock
        from .crud_stock import create_inventory_log # Hati-hati circular import
        from app.schemas.stock_schemas import InventoryLogCreate
        log_entry = InventoryLogCreate(
            product_id=db_product.product_id,
            change_type="initial_stock",
            quantity_change=db_product.current_stock,
            stock_before=0,
            stock_after=db_product.current_stock,
            remarks="Stok awal saat pembuatan produk",
            user_id=user_id
        )
        create_inventory_log(db, log_entry=log_entry)
        # Perlu penanganan jika create_inventory_log gagal, mungkin transaksi rollback.

    return db_product

def update_product(
        db: Session, product_id: int, product_in: product_schemas.ProductUpdate
    ) -> Optional[models_db.Product]:
    """
    Memperbarui data produk.
    PENTING: Perubahan stok (`current_stock`) sebaiknya ditangani melalui operasi stok khusus
    (misal: di crud_stock) untuk memastikan pencatatan log yang benar, bukan diupdate langsung di sini.
    Jika `current_stock` ada di `product_in`, pertimbangkan untuk mengabaikannya atau memicu error.
    """
    db_product = get_product(db, product_id=product_id)
    if not db_product:
        return None

    update_data = product_in.model_dump(exclude_unset=True)

    # Cek SKU unik jika diubah dan diisi
    if "sku" in update_data and update_data["sku"]:
        existing_product_with_sku = get_product_by_sku(db, sku=update_data["sku"])
    if existing_product_with_sku and existing_product_with_sku.product_id != product_id:
        raise ValueError(f"Produk lain dengan SKU '{update_data['sku']}' sudah ada.")

    # Jangan update current_stock langsung dari sini, gunakan fungsi khusus stok.
    if "current_stock" in update_data:
        # Anda bisa memilih untuk mengabaikan, memunculkan error, atau menanganinya secara khusus.
        # Untuk sekarang, kita abaikan agar tidak merusak integritas log stok.
        del update_data["current_stock"]
        # print("Peringatan: Pembaruan 'current_stock' diabaikan. Gunakan endpoint/fungsi stok.")

    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product

def delete_product(db: Session, product_id: int, permanent_delete: bool = False) -> Optional[models_db.Product]:
    """
    Menghapus produk (soft delete dengan mengubah is_active=False, atau permanent delete).
    """
    db_product = get_product(db, product_id=product_id)
    if db_product:
        if permanent_delete:
            db.delete(db_product)
        else:
            db_product.is_active = False
            db.add(db_product)
            db.commit()

        if not permanent_delete:
            db.refresh(db_product)

    return db_product

def update_product_stock_internal(db: Session, product_id: int, quantity_change: int) -> Optional[models_db.Product]:
    """
    Fungsi internal untuk mengubah jumlah stok produk.
    Harus dipanggil bersamaan dengan pembuatan InventoryLog.
    Return: updated product object or None if product not found.
    """
    db_product = get_product(db, product_id=product_id)
    if not db_product:
        return None

    if not db_product.is_active:
        # Opsional: cegah perubahan stok pada produk tidak aktif
        # raise ValueError("Tidak dapat mengubah stok produk yang tidak aktif.")
        pass

    new_stock = db_product.current_stock + quantity_change

    if new_stock < 0:
        raise ValueError(f"Stok produk '{db_product.name}' tidak mencukupi untuk pengurangan {abs(quantity_change)} unit.")

    db_product.current_stock = new_stock
    db.add(db_product)

    db.commit() # Commit akan dilakukan oleh fungsi pemanggil (misal, add_stock, adjust_stock)
    db.refresh(db_product)

    return db_product

def get_product_suggestions(
        db: Session,
        query_str: Optional[str] = None,
        limit: int = 10,
        only_active: bool = True,
        load_category: bool = False
    ) -> List[models_db.Product]: # Tipe kembalian adalah List[models_db.Product]
    """Mengambil daftar saran produk berdasarkan nama atau SKU."""
    db_query = db.query(models_db.Product)

    if load_category:
        db_query = db_query.options(joinedload(models_db.Product.category))

    if only_active:
        db_query = db_query.filter(models_db.Product.is_active == True)
    
    if query_str:
        search_term = f"%{query_str}%"
        # Anda bisa sesuaikan logika pencarian di sini (nama saja, atau nama dan SKU)
        from sqlalchemy import or_ # Impor or_ jika belum
        db_query = db_query.filter(
            or_(
                models_db.Product.name.ilike(search_term),
                models_db.Product.sku.ilike(search_term) # Opsional: cari juga di SKU
            )
        )
    
    return db_query.order_by(models_db.Product.name).limit(limit).all() # Ini mengembalikan list