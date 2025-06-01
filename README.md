# Aplikasi Point of Sale (POS) dengan Integrasi WhatsApp Bot

Aplikasi POS sederhana untuk mengelola stok barang, harga, transaksi penjualan, dan laporan keuangan, dengan kemampuan interaksi melalui bot WhatsApp.

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Instalasi dan Setup](#instalasi-dan-setup)
  - [Lingkungan Virtual (Python)](#lingkungan-virtual-python)
  - [Backend (FastAPI)](#backend-fastapi)
  - [Frontend (React.js)](#frontend-reactjs)
  - [WhatsApp Bot (Baileys)](#whatsapp-bot-baileys)
  - [Variabel Lingkungan (.env)](#variabel-lingkungan-env)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [WhatsApp Bot](#whatsapp-bot)
- [Penggunaan Git](#penggunaan-git)
- [Penggunaan Bot WhatsApp](#penggunaan-bot-whatsapp)
  - [Contoh Perintah](#contoh-perintah)
- [Dokumentasi API](#dokumentasi-api)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## Fitur Utama

- Manajemen Produk (CRUD, Kategori, Harga, Satuan)
- Manajemen Stok (Stok Masuk, Penyesuaian, Log Pergerakan Stok)
- Pencatatan Transaksi Penjualan
- Laporan Keuangan Sederhana (Penjualan, Laba)
- Dashboard Web untuk administrasi
- Integrasi Bot WhatsApp untuk:
  - Pengecekan stok
  - Pencatatan penjualan cepat
  - Text suggestion untuk nama barang
- Autentikasi pengguna untuk dashboard

## Teknologi yang Digunakan

- **Backend:** Python 3.9+, FastAPI, Uvicorn
- **Database:** PostgreSQL
- **Frontend:** Node.js, React.js, [Nama React UI Framework/Template, misal: Material UI, Ant Design]
- **WhatsApp Bot:** Node.js, Baileys
- **State Management Frontend (opsional):** React Context API / Redux / Zustand
- **Styling Frontend:** CSS Modules / Styled Components / Tailwind CSS (sesuai pilihan UI Framework)
- **API Client Frontend:** Axios / Fetch API
- **Charting:** Recharts / Chart.js

## Struktur Proyek

pos/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # Entri utama aplikasi FastAPI
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py               # Memuat konfigurasi dari .env
│   │   │   └── security.py             # Fungsi terkait keamanan (JWT, hashing password)
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── database.py             # Koneksi database dan session SQLAlchemy (opsional)
│   │   │   └── models_db.py            # Model SQLAlchemy (jika menggunakan ORM)
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── product_schemas.py
│   │   │   ├── category_schemas.py
│   │   │   ├── stock_schemas.py
│   │   │   ├── order_schemas.py
│   │   │   ├── user_schemas.py
│   │   │   └── token_schemas.py
│   │   ├── crud/                       # Fungsi untuk operasi Create, Read, Update, Delete
│   │   │   ├── __init__.py
│   │   │   ├── crud_product.py
│   │   │   ├── crud_category.py
│   │   │   ├── crud_stock.py
│   │   │   ├── crud_order.py
│   │   │   └── crud_user.py
│   │   ├── routers/                    # Endpoints API
│   │   │   ├── __init__.py
│   │   │   ├── products.py
│   │   │   ├── categories.py
│   │   │   ├── stock.py
│   │   │   ├── orders.py
│   │   │   ├── reports.py
│   │   │   ├── auth.py                 # Endpoint untuk login/autentikasi
│   │   │   └── bot_interface.py        # Endpoint khusus untuk interaksi bot WA
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── custom_exceptions.py    # Definisi exception kustom (opsional)
│   ├── tests/                          # Unit dan integration tests (opsional tapi direkomendasikan)
│   │   └── ...
│   ├── venv/                           # Virtual environment
│   ├── .env                            # Variabel lingkungan untuk backend
│   ├── .gitignore
│   └── requirements.txt                # Dependensi Python
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                      # Komponen utama React
│   │   ├── index.js                    # Titik masuk aplikasi React
│   │   ├── reportWebVitals.js
│   │   ├── setupTests.js
│   │   ├── assets/                     # Gambar, font, dll.
│   │   ├── components/                 # Komponen UI yang dapat digunakan kembali
│   │   │   ├── common/                 # Tombol, input, modal, dll.
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── layout/                 # Navbar, Sidebar, Footer
│   │   ├── pages/                      # Komponen level halaman (Dashboard, Produk, Pesanan, Laporan)
│   │   │   ├── DashboardPage.js
│   │   │   ├── ProductsPage.js
│   │   │   ├── ProductDetailPage.js
│   │   │   ├── OrdersPage.js
│   │   │   ├── ReportsPage.js
│   │   │   └── LoginPage.js
│   │   ├── services/                   # Fungsi untuk memanggil API backend
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   ├── orderService.js
│   │   │   └── reportService.js
│   │   ├── contexts/                   # State management (React Context API, atau Redux/Zustand jika kompleks)
│   │   │   └── AuthContext.js
│   │   ├── hooks/                      # Custom React Hooks
│   │   ├── routes/                     # Konfigurasi routing (React Router)
│   │   │   └── AppRoutes.js
│   │   ├── styles/                     # File CSS global atau tema
│   │   └── utils/                      # Fungsi utilitas frontend
│   ├── .env                            # Variabel lingkungan untuk frontend (misal: REACT_APP_API_URL)
│   ├── .gitignore
│   ├── package.json
│   └── README.md                       # Catatan spesifik frontend
│
├── whatsapp_bot/
│   ├── node_modules/
│   ├── .env                            # Variabel lingkungan untuk bot (API URL backend, dll.)
│   ├── .gitignore
│   ├── bot.js                          # Logika utama bot Baileys
│   ├── messageHandler.js               # Memproses pesan masuk dan memanggil API
│   ├── commandParser.js                # Mengurai perintah dari pesan WhatsApp
│   ├── apiClient.js                    # Helper untuk memanggil API backend
│   └── package.json
│
└── README.md                           # README utama proyek
└── .gitignore                          # Gitignore global

## Prasyarat

- Python 3.9 atau lebih tinggi
- Node.js (versi LTS direkomendasikan, misal v18 atau v20)
- npm atau yarn
- PostgreSQL server
- Git

## Instalasi dan Setup

### Lingkungan Virtual (Python)

Sangat direkomendasikan untuk menggunakan lingkungan virtual untuk proyek Python (backend).

1.  Buat lingkungan virtual di dalam folder `backend`:
    ```bash
    cd backend
    python -m venv venv
    ```
2.  Aktifkan lingkungan virtual:
    -   Windows: `venv\Scripts\activate`
    -   macOS/Linux: `source venv/bin/activate`

### Backend (FastAPI)

1.  **Navigasi ke folder backend:**
    ```bash
    cd backend
    ```
2.  **(Jika belum) Aktifkan virtual environment.**
3.  **Install dependensi:**
    ```bash
    pip install -r requirements.txt
    ```
    File `requirements.txt` akan berisi:
    ```
    fastapi
    uvicorn[standard]
    psycopg2-binary  # atau asyncpg jika menggunakan driver async
    sqlalchemy       # Jika menggunakan ORM
    python-dotenv
    passlib[bcrypt]
    python-jose[cryptography]
    # tambahkan library lain yang dibutuhkan
    ```
4.  **Setup Database:**
    - Pastikan PostgreSQL server berjalan.
    - Buat database baru untuk aplikasi ini (misal: `pos_db`).
    - Konfigurasikan koneksi database di file `backend/.env` (lihat bagian `.env`).
    - Jika menggunakan SQLAlchemy, jalankan migrasi (jika ada, misal dengan Alembic) atau buat tabel secara manual/programatik.

### Frontend (React.js)

1.  **Navigasi ke folder frontend:**
    ```bash
    cd frontend
    ```
2.  **Install dependensi:**
    ```bash
    npm install
    # atau
    yarn install
    ```
    `package.json` akan berisi dependensi seperti: `react`, `react-dom`, `react-router-dom`, `axios`, UI framework pilihan Anda (`@mui/material`, `antd`), charting library (`recharts`, `chart.js`).
3.  Konfigurasikan URL API backend di file `frontend/.env` (lihat bagian `.env`).

### WhatsApp Bot (Baileys)

1.  **Navigasi ke folder whatsapp_bot:**
    ```bash
    cd whatsapp_bot
    ```
2.  **Install dependensi:**
    ```bash
    npm install
    # atau
    yarn install
    ```
    `package.json` akan berisi `baileys`, `axios` (atau `node-fetch`), `dotenv`.
3.  Konfigurasikan URL API backend di file `whatsapp_bot/.env`.
4.  Saat pertama kali menjalankan bot, Anda mungkin perlu memindai kode QR untuk menghubungkan sesi WhatsApp. Baileys akan menangani ini dan biasanya menyimpan file sesi (misal: `session.json`). Pastikan file sesi ini **tidak** di-commit ke Git jika berisi informasi sensitif. Tambahkan ke `.gitignore`.

### Variabel Lingkungan (.env)

Buat file `.env` di root masing-masing folder (`backend`, `frontend`, `whatsapp_bot`) dan isi dengan konfigurasi yang sesuai. **Jangan commit file `.env` ke Git!** Buat file `.env.example` sebagai template.

**`backend/.env.example`:**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
SECRET_KEY="your_super_secret_key_for_jwt"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
# BOT_API_KEY="your_bot_api_key_if_used"
```

**`frontend/.env.example`:**
```env
REACT_APP_API_URL="http://localhost:8000/api" # Sesuaikan dengan URL backend Anda
```

**`whatsapp_bot/.env.example`:**
```env
BACKEND_API_URL="http://localhost:8000/bot" # Sesuaikan dengan URL endpoint bot di backend
# WHATSAPP_SESSION_FILE="session.json" # Opsional, nama file sesi Baileys
```

## Menjalankan Aplikasi

Pastikan semua dependensi terinstal dan file `.env` sudah dikonfigurasi.

### Backend

1.  Navigasi ke `backend/.`
2.  Aktifkan virtual environment.
3.  Jalankan server FastAPI dengan Uvicorn:   
    ```bash
    uvicorn app.main:app --reload
    ```
    Aplikasi backend akan berjalan di http://localhost:8000 (default).

### Frontend

1.  Navigasi ke `frontend/.`
2.  Jalankan server development React:
    ```bash
    npm start
    # atau
    yarn start
    ```
    Aplikasi frontend akan berjalan di http://localhost:3000 (default).

### WhatsApp Bot

1.  Navigasi ke `whatsapp_bot/.`
2.  Jalankan bot:
    ```bash
    node bot.js
    ```
    Ikuti instruksi di terminal jika perlu memindai kode QR.

## Penggunaan Git

1.  **Inisialisasi Git (jika belum):** Di root folder `pos_project/`:
    ```bash
    git init
    ```
2.  **Buat file `.gitignore` global** di root `pos_project/` dan tambahkan entri seperti:
    ```
    # Python
    **/venv/
    **/*.pyc
    **/__pycache__/
    backend/.env

    # Node
    **/node_modules/
    frontend/.env
    frontend/build/
    whatsapp_bot/.env
    whatsapp_bot/session.json # atau nama file sesi Baileys Anda

    # OS generated files
    .DS_Store
    Thumbs.db
    ```
3. **Tambahkan file ke staging:**
    ```bash
    git add .
    ```
4.  **Commit perubahan:**
    ```bash
    git commit -m "Initial project setup with backend, frontend, and bot structure"
    ```
5.  **Buat branch baru untuk pengembangan fitur:**
    ```bash
    git checkout -b feature/product-management
    ```

## Penggunaan Bot WhatsApp

Kirim pesan ke nomor WhatsApp yang terhubung dengan bot menggunakan format perintah yang telah ditentukan.

### Contoh Perintah

- `/jual` <jumlah> <satuan> <nama barang> Contoh: `/jual` 2 pcs Indomie Goreng
- `/stok` <nama barang> Contoh: `/stok` Kopi Kapal Api Special
- `/tambahstok` <jumlah> <satuan> <nama barang> Contoh: `/tambahstok` 10 box Teh Celup Sosro (Perintah ini mungkin memerlukan otorisasi lebih)
- `/hargacek` <nama barang> Contoh: `/hargacek` Susu Ultra Coklat 250ml

### Text Suggestion:
Saat Anda mengetik perintah seperti `/jual` atau `/stok` diikuti beberapa huruf dari nama barang, bot akan mencoba memberikan saran produk yang cocok.

**Misal, ketik: `/jual` Indom**

Bot mungkin merespons dengan:
```
Pilih produk:
1. Indomie Goreng
2. Indomie Soto
3. Indomie Kari Ayam
Ketik nomor pilihan Anda atau lanjutkan mengetik nama barang.
```

## Dokumentasi API

Dokumentasi API (Swagger UI / OpenAPI) untuk backend FastAPI dapat diakses secara otomatis di http://localhost:8000/docs atau http://localhost:8000/redoc saat backend berjalan.

## Kontribusi

Untuk sementara proyek ini masih bersifat tertutup. -Zwinkle

## Lisensi

... -Zwinkle