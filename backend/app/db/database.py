# backend/app/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from .models_db import Base # Pastikan Base diimpor dari models_db.py

# URL koneksi database diambil dari konfigurasi
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Buat engine SQLAlchemy
# Untuk PostgreSQL, URL koneksi biasanya: "postgresql://user:password@host:port/database_name"
# Jika menggunakan driver async seperti asyncpg, URL akan menjadi "postgresql+asyncpg://..."
# dan Anda perlu menggunakan create_async_engine dari sqlalchemy.ext.asyncio
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # pool_pre_ping=True # Opsional: untuk memeriksa koneksi sebelum digunakan
    # echo=settings.DEBUG # Opsional: untuk melihat query SQL yang dijalankan (berguna saat debug)
)

# Buat SessionLocal class yang akan membuat sesi database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_db_and_tables():
    """
    Fungsi ini akan membuat semua tabel di database yang didefinisikan
    dalam models_db.py (yang mewarisi dari Base).
    Ini hanya akan membuat tabel jika belum ada.
    Untuk perubahan skema setelah tabel dibuat, gunakan Alembic.
    """
    try:
        print("Mencoba membuat tabel database...")
        Base.metadata.create_all(bind=engine)
        print("Tabel berhasil diperiksa/dibuat.")
    except Exception as e:
        print(f"Terjadi kesalahan saat membuat tabel: {e}")
        # Pertimbangkan untuk menangani error ini lebih lanjut jika perlu

# Fungsi dependency untuk mendapatkan sesi database di endpoint FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

