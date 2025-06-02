# backend/app/core/security.py
from datetime import datetime, timezone, timedelta
from typing import Optional, Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas import token_schemas, user_schemas # Impor skema yang dibutuhkan
from app.db.database import get_db # Impor get_db yang sebenarnya

# Impor crud_user akan dilakukan di dalam fungsi untuk menghindari circular import awal
# atau bisa diletakkan di atas jika tidak menyebabkan masalah.

# Konfigurasi untuk hashing password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Skema OAuth2 untuk mendapatkan token dari header Authorization
# tokenUrl akan menunjuk ke endpoint login Anda.
# Pastikan ini sesuai dengan prefix dan path endpoint login Anda di routers/auth.py
# Contoh: jika router auth di-prefix dengan "/api/v1" dan endpoint login adalah "/login",
# maka tokenUrl menjadi "api/v1/auth/login"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Memverifikasi password polos dengan password yang sudah di-hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Menghasilkan hash dari password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Membuat access token JWT.
    :param data: Data yang akan di-encode ke dalam token (biasanya berisi 'sub' atau 'username').
    :param expires_delta: Durasi kadaluarsa token. Jika None, akan menggunakan default dari settings.
    :return: Encoded JWT string.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return encoded_jwt

async def get_current_user(
        db: Session = Depends(get_db), # Menggunakan get_db langsung
        token: str = Depends(oauth2_scheme)
    ) -> user_schemas.User: # Tipe hint yang lebih spesifik
    """
    Dependency untuk mendapatkan user saat ini berdasarkan token JWT.
    Mendekode token, mengekstrak username (subject), dan mengambil user dari database.
    """
    # Impor crud_user di sini untuk menghindari circular import
    # jika security.py diimpor oleh crud_user atau sebaliknya secara tidak langsung.
    from app.crud import crud_user
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # "sub" (subject) adalah klaim standar untuk identitas utama (username)
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
        # Membuat instance TokenData untuk validasi (opsional, tapi baik untuk kejelasan)
        token_data = token_schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user_in_db = crud_user.get_user_by_username(db=db, username=token_data.username)
    if user_in_db is None:
        raise credentials_exception
        # Mengembalikan data user sesuai skema User (tanpa password_hash)

    return user_schemas.User.model_validate(user_in_db)

async def get_current_active_user(
        current_user: user_schemas.User = Depends(get_current_user)
    ) -> user_schemas.User:
    """
    Dependency untuk mendapatkan user yang aktif saat ini.
    Memastikan user yang didapat dari token adalah user yang aktif.
    """
    # Asumsikan model User (SQLAlchemy) dan skema User (Pydantic) memiliki field 'is_active'
    if not current_user.is_active: # Periksa field is_active dari skema User
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    return current_user