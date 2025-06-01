# backend/app/core/config.py
import os
from dotenv import load_dotenv
from pathlib import Path

# Tentukan path ke file .env di root folder 'backend'
# Ini mengasumsikan bahwa config.py ada di backend/app/core/
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Aplikasi POS Sederhana"
    PROJECT_VERSION: str = "1.0.0"

    # Konfigurasi Database
    # Pastikan variabel ini ada di file .env Anda
    # Contoh: DATABASE_URL="postgresql://user:password@host:port/dbname"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/pos_db_default")

    # Konfigurasi JWT (JSON Web Token)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ganti_dengan_kunci_rahasia_yang_kuat_dan_acak")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)) # 30 menit

    # Konfigurasi untuk API Key Bot (jika digunakan)
    BOT_API_KEY: str = os.getenv("BOT_API_KEY", "kunci_api_rahasia_untuk_bot")

    # Mode Debug (opsional)
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

settings = Settings()

if settings.DEBUG:
    print("Menjalankan aplikasi dalam mode DEBUG")
    print(f"DATABASE_URL: {settings.DATABASE_URL}") # Hati-hati menampilkan ini di log produksi