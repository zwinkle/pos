# backend/app/schemas/user_schemas.py
from pydantic import BaseModel, Field, ConfigDict # Import ConfigDict untuk Pydantic v2
from typing import Optional

# Properti dasar yang dimiliki oleh model User, digunakan bersama
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username unik untuk login")
    full_name: Optional[str] = Field(None, max_length=100, description="Nama lengkap pengguna")
    role: str = Field("staff", description="Peran pengguna (misal: 'admin', 'staff')")

# Properti yang dibutuhkan saat membuat user baru (termasuk password)
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password pengguna")

# Properti yang dimiliki oleh user yang sudah ada di database (tanpa password)
# Ini yang akan dikembalikan oleh API saat membaca data user
class User(UserBase):
    user_id: int
    is_active: bool = Field(True, description="Status aktif pengguna") # Anda sudah punya ini di DB

    # Konfigurasi untuk Pydantic v2 agar bisa membaca dari atribut objek ORM
    model_config = ConfigDict(from_attributes=True)

# Properti yang dimiliki oleh user di database (termasuk hashed_password)
class UserInDB(User): # UserInDB juga akan mewarisi model_config dari User
    hashed_password: str

class UserUpdate(UserBase): # Skema ini juga bisa mendapat manfaat dari from_attributes jika dipakai untuk validasi objek ORM
    password: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Tambahkan model_config jika UserUpdate akan dibuat dari objek ORM
    # model_config = ConfigDict(from_attributes=True)