# backend/app/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas import product_schemas # Menggunakan ProductWithCategory untuk detail
from app.crud import crud_product, crud_category # Untuk validasi category_id
from app.core.security import get_current_active_user
from app.schemas.user_schemas import User

router = APIRouter()

@router.post("/", response_model=product_schemas.Product, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_new_product(
        product_in: product_schemas.ProductCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Membuat produk baru.
    """
    if product_in.category_id:
        db_category = crud_category.get_category(db, category_id=product_in.category_id)
    if not db_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category with ID {product_in.category_id} not found")
    try:
        product = crud_product.create_product(db=db, product=product_in, user_id=current_user.user_id)
        # Menggunakan get_product untuk memuat kategori jika ada, atau pastikan create_product mengembalikan dengan kategori
        return crud_product.get_product(db, product_id=product.product_id, load_category=True)
    except ValueError as e: # Tangani error dari CRUD (misal, SKU duplikat)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[product_schemas.ProductWithCategory], tags=["Products"])
def read_all_products(
        skip: int = 0,
        limit: int = Query(default=50, ge=1, le=200),
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        only_active: bool = True,
        db: Session = Depends(get_db)
    ):
    """
    Mendapatkan daftar semua produk dengan filter dan paginasi.
    Mengembalikan produk dengan detail kategori.
    """
    products = crud_product.get_products(
        db,
        skip=skip,
        limit=limit,
        search=search,
        category_id=category_id,
        only_active=only_active,
        load_category=True # Memuat detail kategori
    )

    return products

@router.get("/suggest", response_model=List[product_schemas.Product], tags=["Products"])
def suggest_products_for_bot(
        query: str = Query(..., min_length=1),
        limit: int = Query(default=5, ge=1, le=10),
        db: Session = Depends(get_db)
        # Pertimbangkan API Key auth untuk endpoint bot jika tidak ingin token user biasa
    ):
    """
    Endpoint untuk saran produk (digunakan oleh bot atau autocomplete).
    Hanya mengembalikan data produk dasar.
    """
    # Menggunakan fungsi get_products yang sudah ada dengan parameter search
    # Mungkin perlu sedikit penyesuaian jika ingin logika pencarian yang berbeda
    products = crud_product.get_products(
        db, search=query, limit=limit, only_active=True, load_category=False
    )

    return products

@router.get("/{product_id}", response_model=product_schemas.ProductWithCategory, tags=["Products"])
def read_product_by_id(
        product_id: int,
        db: Session = Depends(get_db)
    ):
    """
    Mendapatkan detail produk berdasarkan ID, termasuk detail kategori.
    """
    db_product = crud_product.get_product(db, product_id=product_id, load_category=True)
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    return db_product

@router.put("/{product_id}", response_model=product_schemas.ProductWithCategory, tags=["Products"])
def update_existing_product(
        product_id: int,
        product_in: product_schemas.ProductUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Memperbarui produk yang sudah ada.
    Pembaruan stok harus melalui endpoint stok.
    """
    db_product = crud_product.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product_in.category_id and product_in.category_id != db_product.category_id:
        db_category = crud_category.get_category(db, category_id=product_in.category_id)
        if not db_category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category with ID {product_in.category_id} not found for update")
    try:
        updated_product = crud_product.update_product(db=db, product_id=product_id, product_in=product_in)
        return crud_product.get_product(db, product_id=updated_product.product_id, load_category=True)
    except ValueError as e: # Tangani error dari CRUD (misal, SKU duplikat)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Products"])
def delete_existing_product(
        product_id: int,
        permanent_delete: bool = Query(default=False, description="Set true to permanently delete"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
    """
    Menghapus produk (soft delete by default, atau permanent delete).
    """
    db_product = crud_product.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    crud_product.delete_product(db=db, product_id=product_id, permanent_delete=permanent_delete)
    
    return None