# backend/app/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.common_schemas import PaginatedResponse
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

@router.get("/", response_model=PaginatedResponse[product_schemas.ProductWithCategory], tags=["Products"])
def read_all_products(
        skip: int = 0,
        limit: int = Query(default=50, ge=1, le=200), # Default limit di OpenAPI Anda 50, saya pakai 50
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        only_active: bool = True,
        db: Session = Depends(get_db)
    ):
    result = crud_product.get_products( # crud_product.get_products mengembalikan dict {"total": N, "data": [...]}
        db,
        skip=skip,
        limit=limit,
        search=search,
        category_id=category_id,
        only_active=only_active,
        load_category=True # Penting agar sesuai dengan ProductWithCategory
    )
    return PaginatedResponse[product_schemas.ProductWithCategory]( # Buat instance PaginatedResponse
        total=result["total"],
        data=result["data"]
    )

@router.get("/suggest", response_model=List[product_schemas.Product], tags=["Products"])
def suggest_products_for_bot( # Anda bisa pakai nama fungsi ini
        query: str = Query(..., min_length=1, description="Search query for product name or SKU"),
        limit: int = Query(default=10, ge=1, le=20, description="Maximum number of suggestions to return"), # Naikkan batas jika perlu
        db: Session = Depends(get_db)
        # Untuk endpoint ini, Anda mungkin tidak memerlukan autentikasi user (get_current_active_user)
        # jika bot akan memanggilnya dengan API Key terpisah, atau jika ini juga dipakai oleh UI tanpa login.
        # Jika tetap ingin diproteksi dengan login user, tambahkan:
        # current_user: User = Depends(get_current_active_user)
    ):
    """
    Endpoint untuk saran produk (digunakan oleh bot atau autocomplete frontend).
    Mengembalikan daftar produk dasar (bukan PaginatedResponse).
    """
    # Panggil fungsi CRUD yang mengembalikan list produk, yaitu get_product_suggestions
    suggested_products_db = crud_product.get_product_suggestions(
        db, 
        query_str=query, 
        limit=limit, 
        only_active=True, # Biasanya hanya produk aktif yang disarankan
        load_category=False # Kategori biasanya tidak perlu untuk suggestion list sederhana
    )
    
    # FastAPI akan otomatis mengkonversi List[models_db.Product] (dari suggested_products_db)
    # menjadi List[product_schemas.Product] (sesuai response_model)
    # karena product_schemas.Product memiliki model_config = ConfigDict(from_attributes=True).
    return suggested_products_db

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