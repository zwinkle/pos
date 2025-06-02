# backend/app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date # Untuk filter tanggal

from app.db.database import get_db
from app.schemas.common_schemas import PaginatedResponse
from app.schemas import order_schemas
from app.crud import crud_order
from app.core.security import get_current_active_user
from app.schemas.user_schemas import User

router = APIRouter()

@router.post("/", response_model=order_schemas.Order, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_new_order(
        order_in: order_schemas.OrderCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Membuat pesanan baru.
    Stok produk akan otomatis dikurangi.
    """
    try:
        # user_id dari current_user akan digunakan di dalam fungsi crud_order.create_order
        created_order = crud_order.create_order(db=db, order_in=order_in, current_user_id=current_user.user_id)
        # Memuat item dan detail produk untuk respons
        return crud_order.get_order(db, order_id=created_order.order_id, load_items=True, load_user=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Log error e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred while creating the order.")

@router.get("/", response_model=PaginatedResponse[order_schemas.Order], tags=["Orders"]) # Update response_model
def read_all_orders(
        skip: int = 0,
        limit: int = Query(default=50, ge=1, le=200),
        user_id_filter: Optional[int] = Query(None, alias="userId", description="Filter by user ID (admin only)"),
        start_date_filter: Optional[date] = Query(None, alias="startDate", description="Filter by start date (YYYY-MM-DD)"),
        end_date_filter: Optional[date] = Query(None, alias="endDate", description="Filter by end date (YYYY-MM-DD)"),
        status_filter: Optional[str] = Query(None, alias="status", description="Filter by order status"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Mendapatkan daftar semua pesanan dengan filter dan pagination.
    Admin bisa melihat semua, user biasa hanya pesanannya sendiri (jika user_id_filter tidak diisi).
    """
    effective_user_id = None
    if current_user.role == "admin":
        effective_user_id = user_id_filter # user_id_filter adalah nama parameter query
    elif user_id_filter is not None and user_id_filter != current_user.user_id :
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view other user's orders")
    elif user_id_filter is None and current_user.role != "admin":
        effective_user_id = current_user.user_id

    orders_result = crud_order.get_orders(
        db,
        skip=skip,
        limit=limit,
        user_id=effective_user_id,
        start_date=start_date_filter, # start_date_filter adalah nama parameter query
        end_date=end_date_filter,     # end_date_filter adalah nama parameter query
        status=status_filter,         # status_filter adalah nama parameter query
        load_items=True
    )

    return PaginatedResponse[order_schemas.Order](
        total=orders_result["total"],
        data=orders_result["data"]
    )

@router.get("/{order_id}", response_model=order_schemas.Order, tags=["Orders"])
def read_order_by_id(
        order_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    # Pastikan crud_order.get_order melakukan eager loading untuk items dan product di dalam items
    db_order = crud_order.get_order(db, order_id=order_id, load_items=True, load_user=True) # load_items=True penting
    if db_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role != "admin" and db_order.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this order")
    
    return db_order

@router.patch("/{order_id}/status", response_model=order_schemas.Order, tags=["Orders"])
def update_order_status_endpoint(
    order_id: int,
    status_update: order_schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if status_update.order_status is None: # Validasi input dari request body
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New status is required in the request body.")

    try:
        # Panggil fungsi CRUD untuk update status
        db_order_updated = crud_order.update_order_status(
            db=db, 
            order_id=order_id, 
            new_status=status_update.order_status
        )

        if db_order_updated is None:
            # Ini berarti crud_order.update_order_status mengembalikan None,
            # yang biasanya terjadi jika order awal tidak ditemukan.
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order with ID {order_id} not found.")

        # Jika Anda ingin respons menyertakan item-item pesanan yang sudah di-load (seperti pada get_order)
        # Anda bisa memanggil get_order lagi di sini.
        # Namun, jika update_order_status sudah me-refresh objek db_order_updated dengan benar,
        # dan skema Order tidak secara default mengharapkan items yang selalu ter-load penuh
        # dari operasi update status, maka db_order_updated saja cukup.
        # Untuk konsistensi dengan get_order by ID, mari kita panggil get_order:

        # return db_order_updated # Ini akan valid jika order_schemas.Order tidak *membutuhkan* items yang selalu ada
                                 # atau jika update_order_status me-load relasi items.

        # Untuk memastikan respons konsisten dengan GET /orders/{order_id} (yang me-load items):
        fully_loaded_order = crud_order.get_order(db, order_id=db_order_updated.order_id, load_items=True, load_user=True)
        if fully_loaded_order is None: # Seharusnya tidak terjadi jika update berhasil
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to reload order after update.")
        return fully_loaded_order

    except ValueError as e: # Misal, status tidak valid
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException: # Teruskan HTTPException yang sudah ada
        raise
    except Exception as e:
        # logger.error(f"Error updating order status: {e}", exc_info=True) # Sebaiknya ada logger
        print(f"Unexpected error updating order status: {e}") # Untuk debug cepat
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred while updating order status.")


# Anda bisa menambahkan endpoint PUT untuk update order secara keseluruhan jika diperlukan
# menggunakan skema order_schemas.OrderUpdate yang lebih lengkap.