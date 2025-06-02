# backend/app/main.py
import logging # Untuk logging
import sys # Untuk sys.exit jika database gagal
import datetime
from datetime import datetime, timezone
from sqlalchemy import text

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.database import get_db # Untuk health check, engine bisa diakses dari sini jika perlu
# from app.db.database import create_db_and_tables # Dikomentari, Alembic lebih direkomendasikan

# Impor semua router Anda
from app.routers import (
    auth,
    users,
    categories,
    products,
    stock,
    orders,
    reports,
    bot_interface
)

# Konfigurasi logging dasar
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# # Panggil fungsi ini saat aplikasi FastAPI dimulai JIKA TIDAK MENGGUNAKAN ALEMBIC untuk pembuatan tabel awal.
# # Jika Anda menggunakan Alembic untuk membuat tabel awal, baris ini tidak diperlukan dan sebaiknya dikomentari/dihapus.
# try:
#     logger.info("Memeriksa dan membuat tabel database jika belum ada (jika create_db_and_tables aktif)...")
#     # create_db_and_tables() # Pastikan database sudah ada sebelum ini dijalankan
#     logger.info("Pemeriksaan tabel selesai.")
# except Exception as e:
#     logger.error(f"Tidak dapat terhubung ke database atau membuat tabel: {e}")
#     logger.error("Pastikan database server berjalan dan URL database di .env sudah benar.")
#     logger.error("Jika ini adalah setup awal dan database belum ada, buat database secara manual terlebih dahulu.")
#     # Untuk produksi, Anda mungkin ingin aplikasi gagal start jika database tidak siap.
#     # sys.exit(1)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API untuk Aplikasi Point of Sale (POS) dengan Integrasi WhatsApp Bot.",
    openapi_url="/api/v1/openapi.json", # Sesuaikan path OpenAPI spec
    docs_url="/api/v1/docs",            # Path untuk Swagger UI
    redoc_url="/api/v1/redoc"           # Path untuk ReDoc
)

# Konfigurasi CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost",         # Umum
    "http://localhost:3000",    # Port default create-react-app
    "http://127.0.0.1:3000",
    # Tambahkan origin frontend produksi Anda di sini, contoh:
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Izinkan semua metode (GET, POST, PUT, DELETE, dll.)
    allow_headers=["*"], # Izinkan semua header
)

# -- Include Routers --
# Tambahkan prefix "/api/v1" untuk semua endpoint agar terstruktur
API_V1_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=f"{API_V1_PREFIX}/auth", tags=["1. Authentication & Users"])
app.include_router(users.router, prefix=f"{API_V1_PREFIX}/users", tags=["2. Users Management"])
app.include_router(categories.router, prefix=f"{API_V1_PREFIX}/categories", tags=["3. Categories"])
app.include_router(products.router, prefix=f"{API_V1_PREFIX}/products", tags=["4. Products"])
app.include_router(stock.router, prefix=f"{API_V1_PREFIX}/stock", tags=["5. Stock Management"])
app.include_router(orders.router, prefix=f"{API_V1_PREFIX}/orders", tags=["6. Orders"])
app.include_router(reports.router, prefix=f"{API_V1_PREFIX}/reports", tags=["7. Reports"])
app.include_router(bot_interface.router, prefix=f"{API_V1_PREFIX}/bot", tags=["8. Bot Interface"])


# -- Global Exception Handler (Contoh) --
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Menangani error validasi Pydantic dengan format yang lebih detail."""
    error_details = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error['loc'])
        message = error['msg']
        error_type = error['type']
        error_details.append({
            "field": field,
            "message": message,
            "type": error_type
        })
    logger.warning(f"Validation error for request {request.method} {request.url}: {error_details}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation Error", "errors": error_details},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Menangani HTTPException umum dan log error."""
    logger.error(f"HTTPException for request {request.method} {request.url}: Status {exc.status_code}, Detail: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc: Exception):
    """Menangani error umum yang tidak tertangkap (500 Internal Server Error)."""
    logger.exception(f"Unhandled exception for request {request.method} {request.url}: {exc}") # logger.exception akan menyertakan stack trace
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred."},
    )


# -- Root and Health Check Endpoints --
@app.get("/", tags=["0. Root & Health"])
async def read_root():
    """
    Endpoint root untuk memeriksa apakah API berjalan.
    """
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.PROJECT_VERSION,
        "docs_url": app.docs_url,
        "redoc_url": app.redoc_url,
        "openapi_url": app.openapi_url
    }

@app.get("/health", tags=["0. Root & Health"])
async def health_check(db: Session = Depends(get_db)):
    """
    Endpoint untuk memeriksa kesehatan aplikasi dan koneksi database.
    """
    db_status = "unknown"
    try:
        # Coba lakukan query sederhana ke database
        result = db.execute(text("SELECT 1")).scalar_one_or_none()
        if result == 1:
            db_status = "connected"
        else:
            db_status = "connected_but_query_failed"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f"disconnected ({type(e).__name__})"
        # Jangan lempar HTTPException di sini agar endpoint health tetap memberikan status
        # raise HTTPException(
        #     status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        #     detail=f"Database connection failed: {e}"
        # )

    return {
        "application_status": "running",
        "database_connection": db_status,
        "project_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Untuk menjalankan dengan `python main.py` (biasanya Uvicorn dijalankan dari terminal)
# if __name__ == "__main__":
#     import uvicorn
#     logger.info(f"Starting Uvicorn server for {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}...")
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=8000,
#         reload=True, # Aktifkan reload hanya untuk pengembangan
#         log_level="info"
#     )