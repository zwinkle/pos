# backend/app/db/models_db.py
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Numeric, TIMESTAMP, Boolean, Text,
    CheckConstraint
)
from sqlalchemy.orm import relationship, declarative_base # Mengganti declarative_base dari sqlalchemy.ext.declarative
from sqlalchemy.sql import func # Untuk default timestamp

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default='staff', nullable=False) # misal: 'admin', 'staff'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relasi (jika ada, misal pesanan yang diproses oleh user)
    orders_processed = relationship("Order", back_populates="processed_by_user")
    inventory_logs_created = relationship("InventoryLog", back_populates="created_by_user")


class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="SET NULL"), nullable=True)
    sku = Column(String(50), unique=True, nullable=True, index=True) # Stock Keeping Unit
    purchase_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    selling_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    current_stock = Column(Integer, nullable=False, default=0)
    unit_of_measurement = Column(String(20), nullable=False, default='pcs') # pcs, kg, liter, box
    low_stock_threshold = Column(Integer, default=0) # Batas stok rendah
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    inventory_logs = relationship("InventoryLog", back_populates="product")

    __table_args__ = (
        CheckConstraint('purchase_price >= 0', name='check_purchase_price_non_negative'),
        CheckConstraint('selling_price >= 0', name='check_selling_price_non_negative'),
        CheckConstraint('current_stock >= 0', name='check_current_stock_non_negative'),
    )


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True) # Bisa di-generate
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True) # Pengguna yg memproses
    total_amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), nullable=True) # Cash, QRIS, Transfer
    order_status = Column(String(20), default='pending', nullable=False) # completed, pending, cancelled
    source = Column(String(20), default='dashboard', nullable=False) # 'dashboard', 'whatsapp_bot'
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    processed_by_user = relationship("User", back_populates="orders_processed")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    inventory_logs_related = relationship("InventoryLog", back_populates="related_order")


class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_transaction = Column(Numeric(10, 2), nullable=False) # Harga produk saat transaksi
    subtotal = Column(Numeric(12, 2), nullable=False) # quantity * price_at_transaction

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    __table_args__ = (
        CheckConstraint('quantity > 0', name='check_quantity_positive'),
    )


class InventoryLog(Base):
    __tablename__ = "inventory_log"

    log_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True) # User yg melakukan perubahan
    transaction_id = Column(Integer, ForeignKey("orders.order_id", ondelete="SET NULL"), nullable=True) # Jika terkait penjualan
    change_type = Column(String(50), nullable=False, index=True) # 'initial_stock', 'stock_in', 'sale', 'adjustment_plus', 'adjustment_minus', 'return'
    quantity_change = Column(Integer, nullable=False) # + untuk penambahan, - untuk pengurangan
    stock_before = Column(Integer, nullable=False)
    stock_after = Column(Integer, nullable=False)
    remarks = Column(Text, nullable=True) # Misal: nomor faktur, alasan penyesuaian
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)

    product = relationship("Product", back_populates="inventory_logs")
    created_by_user = relationship("User", back_populates="inventory_logs_created")
    related_order = relationship("Order", back_populates="inventory_logs_related")

