# backend/app/routers/stock.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.common_schemas import PaginatedResponse
from app.schemas import stock_schemas # Berisi StockIn, StockAdjustment, InventoryLog
from app.crud import crud_stock, crud_product
from app.core.security import get_current_active_user
from app.schemas.user_schemas import User

router = APIRouter()

@router.post("/in", response_model=stock_schemas.InventoryLog, status_code=status.HTTP_201_CREATED, tags=["Stock Management"])
def add_new_stock(
        stock_in_data: stock_schemas.StockIn,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Menambah stok masuk untuk produk.
    """
    try:
        # user_id dari current_user akan digunakan di dalam fungsi crud_stock.add_stock
        inventory_log = crud_stock.add_stock(db=db, stock_in_data=stock_in_data, user_id=current_user.user_id)
        return inventory_log
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e: # Tangkap error lain yang mungkin terjadi
        # Log error e di sini jika perlu
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred while adding stock.")

@router.post("/adjustment", response_model=stock_schemas.InventoryLog, status_code=status.HTTP_201_CREATED, tags=["Stock Management"])
def adjust_product_stock(
        adjustment_data: stock_schemas.StockAdjustment,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Menyesuaikan jumlah stok produk.
    """
    try:
        inventory_log = crud_stock.adjust_stock(db=db, adjustment_data=adjustment_data, user_id=current_user.user_id)
        return inventory_log
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during stock adjustment.")

@router.get("/log/{product_id}", response_model=PaginatedResponse[stock_schemas.InventoryLog], tags=["Stock Management"]) # Update response_model
def read_inventory_logs_for_product(
        product_id: int,
        skip: int = 0,
        limit: int = Query(default=100, ge=1, le=200),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Melihat histori pergerakan stok untuk produk tertentu dengan pagination.
    """
    db_product = crud_product.get_product(db, product_id=product_id) # Tetap validasi produk
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {product_id} not found")

    logs_result = crud_stock.get_inventory_logs_by_product_id(
        db, product_id=product_id, skip=skip, limit=limit
    )

    return PaginatedResponse[stock_schemas.InventoryLog](
        total=logs_result["total"],
        data=logs_result["data"]
    )