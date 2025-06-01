# backend/app/schemas/token_schemas.py
from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None # Atau subject (sub) tergantung implementasi JWT Anda
    # Anda bisa menambahkan field lain di sini jika perlu disimpan dalam token, misal user_id, role