# backend/app/schemas/user_schemas.py
from pydantic import BaseModel, EmailStr, Field # EmailStr bisa digunakan jika username adalah email
from typing import Optional

# Properti dasar yang dimiliki oleh model User, digunakan bersama
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username unik untuk login")
    full_name: Optional[str] = Field(None, max_length=100, description="Nama lengkap pengguna")
    # Jika username adalah email, Anda bisa menggunakan:
    # email: EmailStr = Field(..., description="Email pengguna, digunakan sebagai username")
    role: str = Field("staff", description="Peran pengguna (misal: 'admin', 'staff')")

# Properti yang dibutuhkan saat membuat user baru (termasuk password)
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password pengguna")

# Properti yang dimiliki oleh user yang sudah ada di database (tanpa password)
# Ini yang akan dikembalikan oleh API saat membaca data user
class User(UserBase):
    user_id: int
    is_active: bool = Field(True, description="Status aktif pengguna") # Anda mungkin perlu menambahkan field is_active di model DB

class Config:
    from_attributes = True # Menggantikan orm_mode = True di Pydantic v2

# Properti yang dimiliki oleh user di database (termasuk hashed_password)
# Ini biasanya hanya digunakan secara internal oleh backend, bukan untuk respons API
class UserInDB(User): # Atau bisa juga UserBase tergantung kebutuhan
    hashed_password: str

class UserUpdate(UserBase):
    password: Optional[str] = None
    is_active: Optional[bool] = None