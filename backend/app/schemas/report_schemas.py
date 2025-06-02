# backend/app/schemas/report_schemas.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class SalesChartDataPoint(BaseModel):
    name: str # e.g., "Sen", "Sel", "Rab" or date string
    sales: float

# Skema baru untuk Top Selling Products
class TopSellingProduct(BaseModel):
    name: str
    total_quantity_sold: int

# Skema baru untuk Sales by Category
class SalesByCategory(BaseModel):
    name: str # Nama kategori
    total_sales: float

class DashboardSummary(BaseModel):
    total_sales_month: float
    total_transactions_month: int
    active_products: int
    critical_stock_products: int
    sales_chart_data: List[SalesChartDataPoint] # Data sales 7 hari terakhir (sudah ada)
    top_selling_products: List[TopSellingProduct] # DATA BARU
    sales_by_category: List[SalesByCategory]    # DATA BARU

    model_config = { # Jika Anda menggunakan Pydantic v2 dan ingin membuat instance dari objek
        "from_attributes": True 
    }