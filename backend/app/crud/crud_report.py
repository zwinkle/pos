# backend/app/crud/crud_report.py (atau crud_dashboard.py)
from sqlalchemy.orm import Session
from sqlalchemy import func, desc # Tambahkan desc
from datetime import datetime, timedelta

from app.db import models_db # Pastikan semua model diimpor

def get_dashboard_summary(db: Session) -> dict:
    today = datetime.utcnow().date()
    # Periode "Bulan Ini" (dari tanggal 1 bulan ini hingga hari ini)
    start_of_current_month = today.replace(day=1)
    # Periode 7 hari terakhir untuk sales chart
    seven_days_ago = today - timedelta(days=6) # Termasuk hari ini, jadi 6 hari ke belakang

    # --- Data Statistik yang Sudah Ada ---
    total_sales_month = (
        db.query(func.sum(models_db.Order.total_amount))
        .filter(models_db.Order.order_status == "completed")
        .filter(models_db.Order.created_at >= start_of_current_month)
        .scalar() or 0
    )
    total_transactions_month = (
        db.query(func.count(models_db.Order.order_id))
        .filter(models_db.Order.order_status == "completed")
        .filter(models_db.Order.created_at >= start_of_current_month)
        .scalar() or 0
    )
    active_products = db.query(func.count(models_db.Product.product_id)).filter(models_db.Product.is_active == True).scalar() or 0
    critical_stock_products = (
        db.query(func.count(models_db.Product.product_id))
        .filter(models_db.Product.is_active == True)
        .filter(models_db.Product.low_stock_threshold > 0)
        .filter(models_db.Product.current_stock <= models_db.Product.low_stock_threshold)
        .scalar() or 0
    )

    # --- Data untuk Sales Chart (7 Hari Terakhir) ---
    sales_last_7_days_data = []
    for i in range(6, -1, -1):
        day_to_query = today - timedelta(days=i)
        day_start = datetime.combine(day_to_query, datetime.min.time())
        day_end = datetime.combine(day_to_query, datetime.max.time())
        
        daily_sales = db.query(func.sum(models_db.Order.total_amount))\
            .filter(models_db.Order.order_status == "completed")\
            .filter(models_db.Order.created_at >= day_start)\
            .filter(models_db.Order.created_at <= day_end)\
            .scalar() or 0
        
        sales_last_7_days_data.append({"name": day_to_query.strftime("%a"), "sales": float(daily_sales)})

    # --- DATA BARU: Top 5 Selling Products (Bulan Ini berdasarkan Kuantitas) ---
    top_products_query = (
        db.query(
            models_db.Product.name,
            func.sum(models_db.OrderItem.quantity).label("total_quantity_sold")
        )
        .join(models_db.OrderItem, models_db.Product.product_id == models_db.OrderItem.product_id)
        .join(models_db.Order, models_db.OrderItem.order_id == models_db.Order.order_id)
        .filter(models_db.Order.order_status == "completed")
        .filter(models_db.Order.created_at >= start_of_current_month)
        .group_by(models_db.Product.name)
        .order_by(desc("total_quantity_sold"))
        .limit(5)
        .all()
    )
    top_selling_products_data = [{"name": p.name, "total_quantity_sold": int(p.total_quantity_sold)} for p in top_products_query]

    # --- DATA BARU: Sales by Category (Bulan Ini) ---
    sales_by_category_query = (
        db.query(
            models_db.Category.name,
            func.sum(models_db.OrderItem.subtotal).label("category_total_sales")
        )
        .select_from(models_db.Order) # Mulai join dari Order
        .join(models_db.OrderItem, models_db.Order.order_id == models_db.OrderItem.order_id)
        .join(models_db.Product, models_db.OrderItem.product_id == models_db.Product.product_id)
        .join(models_db.Category, models_db.Product.category_id == models_db.Category.category_id)
        .filter(models_db.Order.order_status == "completed")
        .filter(models_db.Order.created_at >= start_of_current_month)
        .group_by(models_db.Category.name)
        .order_by(desc("category_total_sales"))
        .all()
    )
    sales_by_category_data = [{"name": c.name, "total_sales": float(c.category_total_sales)} for c in sales_by_category_query]
    
    return {
        "total_sales_month": float(total_sales_month),
        "total_transactions_month": total_transactions_month,
        "active_products": active_products,
        "critical_stock_products": critical_stock_products,
        "sales_chart_data": sales_last_7_days_data,
        "top_selling_products": top_selling_products_data,
        "sales_by_category": sales_by_category_data,
    }