# backend/app/routers/reports.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date, datetime, timedelta

from app.db.database import get_db
from app.core.security import get_current_active_user
from app.schemas.user_schemas import User

from app.schemas import report_schemas
from app.crud import crud_report # atau app.services import report_service

router = APIRouter()

# Placeholder untuk fungsi yang mengambil data laporan dari DB
# Ini harus diimplementasikan di folder crud atau service layer.
def get_sales_report_data(db: Session, start_date: date, end_date: date, group_by: str) -> List[Dict[str, Any]]:
# Contoh implementasi SANGAT SEDERHANA (PERLU DISESUAIKAN & DIOPTIMALKAN)
    from app.db.models_db import Order, OrderItem, Product
    from sqlalchemy import func, case

    # Pastikan end_date mencakup seluruh hari
    end_datetime = datetime.combine(end_date, datetime.max.time())

    query = (
        db.query(
            Order.created_at, # atau func.date(Order.created_at) jika group_by 'day'
            func.sum(OrderItem.subtotal).label("total_sales"),
            func.sum(OrderItem.quantity).label("total_items_sold"),
            func.sum(
                OrderItem.quantity * (OrderItem.price_at_transaction - Product.purchase_price)
                ).label("estimated_profit") # Perlu join dengan Product untuk harga beli
            )
        .join(OrderItem, Order.order_id == OrderItem.order_id)
        .join(Product, OrderItem.product_id == Product.product_id)
        .filter(Order.created_at >= start_date)
        .filter(Order.created_at <= end_datetime)
        .filter(Order.order_status == "completed") # Hanya penjualan yang selesai
    )

    if group_by == "day":
        query = query.group_by(func.date(Order.created_at)).order_by(func.date(Order.created_at))
        results = query.all()

        return [
            {"date": r[0].strftime("%Y-%m-%d"), "total_sales": float(r.total_sales or 0), "total_items": int(r.total_items_sold or 0), "estimated_profit": float(r.estimated_profit or 0)}
            for r in results
        ]
    elif group_by == "month":
        # Implementasi pengelompokan per bulan
        query = query.group_by(func.strftime('%Y-%m', Order.created_at)).order_by(func.strftime('%Y-%m', Order.created_at)) # SQLite syntax, beda untuk PG
        # Untuk PostgreSQL: query = query.group_by(func.to_char(Order.created_at, 'YYYY-MM')).order_by(func.to_char(Order.created_at, 'YYYY-MM'))
        results = query.all()

        # Sesuaikan format output untuk bulan
        return [{"month": r[0], "total_sales": float(r.total_sales or 0), "total_items": int(r.total_items_sold or 0), "estimated_profit": float(r.estimated_profit or 0)} for r in results]

    # Tambahkan pengelompokan lain jika perlu (week, year)
    raise NotImplementedError(f"Grouping by '{group_by}' not implemented yet.")

def get_low_stock_products_data(db: Session, threshold_multiplier: float = 1.0) -> List[Dict[str, Any]]:
    from app.db.models_db import Product, Category
    # Produk dimana current_stock <= low_stock_threshold
    # atau current_stock <= (low_stock_threshold * threshold_multiplier)
    low_stock_products = (
    db.query(Product.name, Product.current_stock, Product.low_stock_threshold, Product.unit_of_measurement, Category.name.label("category_name"))
        .outerjoin(Category, Product.category_id == Category.category_id)
        .filter(Product.is_active == True)
        .filter(Product.current_stock <= (Product.low_stock_threshold * threshold_multiplier))
        .order_by(Product.current_stock.asc())
        .all()
    )

    return [
        {
            "product_name": p.name,
            "current_stock": p.current_stock,
            "low_stock_threshold": p.low_stock_threshold,
            "unit": p.unit_of_measurement,
            "category": p.category_name
        }
        
        for p in low_stock_products
    ]

@router.get("/sales", response_model=List[Dict[str, Any]], tags=["Reports"])
def get_sales_report(
        start_date: date = Query(..., description="Tanggal mulai (YYYY-MM-DD)"),
        end_date: date = Query(..., description="Tanggal selesai (YYYY-MM-DD)"),
        group_by: str = Query("day", enum=["day", "month", "week"], description="Kelompokkan berdasarkan (day, month, week)"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Laporan penjualan berdasarkan rentang tanggal dan pengelompokan.
    """
    if start_date > end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Start date cannot be after end date.")
    
    try:
        report_data = get_sales_report_data(db, start_date, end_date, group_by)
        return report_data
    except NotImplementedError as e:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(e))
    except Exception as e:
        # Log error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate sales report: {e}")

@router.get("/stock-summary/low-stock", response_model=List[Dict[str, Any]], tags=["Reports"])
def get_low_stock_report(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Laporan produk dengan stok menipis.
    """
    try:
        report_data = get_low_stock_products_data(db)
        return report_data
    except Exception as e:
        # Log error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate low stock report: {e}")

@router.get("/dashboard-summary", response_model=report_schemas.DashboardSummary, tags=["Reports"])
def get_main_dashboard_summary(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user) # Pastikan user terautentikasi
    ):
    """
    Mengambil data ringkasan untuk dashboard utama.
    """
    try:
        summary = crud_report.get_dashboard_summary(db) # Panggil fungsi CRUD yang baru dibuat
        return summary
    except Exception as e:
        # logger.error(f"Error getting dashboard summary: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve dashboard summary")
# Anda bisa menambahkan endpoint lain seperti:
# - Laporan profit (perlu harga beli produk saat transaksi atau rata-rata)
# - Laporan produk terlaris