# backend/app/schemas/common_schemas.py (atau tempat lain yang sesuai)
from pydantic import BaseModel, Field
from typing import List, Generic, TypeVar, Optional

DataT = TypeVar('DataT')

class PaginatedResponse(BaseModel, Generic[DataT]):
    total: int = Field(..., description="Total number of items available.")
    data: List[DataT] = Field(..., description="List of items for the current page.")
    # Opsional: Anda bisa menambahkan info halaman saat ini dan ukuran halaman jika diperlukan
    page: Optional[int] = None
    size: Optional[int] = None

# Contoh penggunaan nanti di router: PaginatedResponse[product_schemas.ProductWithCategory]