# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware # Untuk menangani CORS
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import create_db_and_tables, get_db
# Anda perlu membuat router dan schema terlebih dahulu
# from app.routers import products_router, auth_router # Contoh, sesuaikan dengan nama file router Anda
# from app.schemas import product_schemas # Contoh

# Panggil fungsi ini saat aplikasi FastAPI dimulai.
# Ini akan membuat tabel jika belum ada.
# PERHATIAN: Untuk produksi dan perubahan skema berkelanjutan, gunakan Alembic.
try:
    create_db_and_tables()
except Exception as e:
    print(f"Tidak dapat terhubung ke database atau membuat tabel: {e}")
    # Anda mungkin ingin menghentikan aplikasi di sini jika database adalah kritikal
    # sys.exit(1)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    # Tambahkan parameter lain jika perlu, seperti docs_url, redoc_url
)

# Konfigurasi CORS (Cross-Origin Resource Sharing)
# Ini penting agar frontend React Anda (yang berjalan di port berbeda)
# dapat berkomunikasi dengan backend FastAPI.
origins = [
    "http://localhost",         # Jika frontend berjalan tanpa port spesifik (jarang)
    "http://localhost:3000",    # Port default create-react-app
    "http://127.0.0.1:3000",
    # Tambahkan origin frontend Anda jika berbeda (misal, URL produksi)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Daftar origin yang diizinkan
    allow_credentials=True, # Izinkan cookies (jika menggunakan autentikasi berbasis cookie)
    allow_methods=["*"],    # Izinkan semua metode (GET, POST, PUT, DELETE, dll.)
    allow_headers=["*"],    # Izinkan semua header
)


@app.get("/", tags=["Root"])
async def read_root():
    """
    Endpoint root untuk memeriksa apakah API berjalan.
    """
    return {"message": f"Selamat datang di {settings.PROJECT_NAME} API v{settings.PROJECT_VERSION}"}

@app.get("/health", tags=["Health Check"])
async def health_check(db: Session = Depends(get_db)):
    """
    Endpoint untuk memeriksa kesehatan aplikasi dan koneksi database.
    """
    try:
        # Coba lakukan query sederhana ke database
        db.execute("SELECT 1")
        db_status = "terhubung"
    except Exception as e:
        db_status = f"tidak terhubung ({e})"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Koneksi database gagal: {e}"
        )

    return {
        "status": "berjalan",
        "database_connection": db_status,
        "project_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }

# TODO: Tambahkan router Anda di sini setelah dibuat
# Contoh:
# from app.routers import products, categories, orders, auth # Sesuaikan dengan nama file router Anda
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
# app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
# app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
# ... dan seterusnya untuk router lain (stock, reports, bot_interface)

# Jika Anda ingin menambahkan penanganan error global (opsional)
# from fastapi.exceptions import RequestValidationError
# from fastapi.responses import JSONResponse
# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request, exc):
#     return JSONResponse(
#         status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#         content={"detail": exc.errors(), "body": exc.body},
#     )

if __name__ == "__main__":
    import uvicorn
    # Ini hanya untuk menjalankan langsung dari script, biasanya Uvicorn dijalankan dari terminal
    uvicorn.run(app, host="0.0.0.0", port=8000)

