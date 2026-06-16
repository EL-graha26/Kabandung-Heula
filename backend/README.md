# Backend API - Sistem Informasi Geografis (SIG) Transportasi & Pariwisata 🗺️🚌

Ini adalah *source code backend* untuk Sistem Informasi Geografis (SIG) Transportasi Publik dan Pariwisata (Project: Sigma Bandoeng). API ini dibangun menggunakan **FastAPI** dan memanfaatkan **PostgreSQL + PostGIS** untuk menangani pemrosesan data spasial secara efisien (*Point, LineString, Polygon*).

---

## 🚀 Teknologi yang Digunakan

*   **Framework:** FastAPI
*   **Database:** PostgreSQL dengan ekstensi PostGIS
*   **Database Driver:** `asyncpg` (Asynchronous PostgreSQL driver)
*   **Server:** Uvicorn
*   **Validasi Data:** Pydantic
*   **Environment Manager:** `python-dotenv`
*   **Password Hashing:** `passlib[bcrypt]`
*   **Token Authentication:** `pyjwt`

---

## 🛠️ Prasyarat (Prerequisites)

Sebelum menjalankan proyek ini, pastikan sistem kamu sudah terinstal:
1.  **Python 3.8+**
2.  **PostgreSQL** (versi 12 ke atas disarankan)
3.  **PostGIS Extension** (Harus diaktifkan di dalam database menggunakan perintah SQL: `CREATE EXTENSION postgis;`)

---

## ⚙️ Cara Instalasi dan Setup

Ikuti langkah-langkah di bawah ini untuk menjalankan *backend* di komputer lokal (*development environment*):

### 1. Buat dan Aktifkan Virtual Environment
Buka terminal di dalam folder proyek, lalu jalankan:

```bash
# Membuat virtual environment bernama 'venv'
python -m venv venv

# Mengaktifkan virtual environment (Windows)
venv\Scripts\activate

# Catatan: Jika menggunakan Linux / Mac, gunakan perintah ini:
# source venv/bin/activate
```

### 2. Instal Library yang Dibutuhkan
Setelah *virtual environment* aktif (terlihat tanda `(venv)` di terminal), instal *dependencies* utama:

```bash
pip install fastapi uvicorn asyncpg python-dotenv passlib[bcrypt] pyjwt
```

### 3. Konfigurasi Database (Environment Variables)
Buat sebuah file bernama `.env` di *root directory* proyek kamu, dan isi dengan URL koneksi database PostgreSQL kamu:

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/sigma_bandoeng
```

### 4. Jalankan Server
Gunakan Uvicorn untuk menjalankan server API dengan mode *reload* otomatis saat ada perubahan kode:

```bash
uvicorn main:app --reload
```
Server akan berjalan di: `[http://127.0.0.1:8000](http://127.0.0.1:8000)`

---

## 📚 Dokumentasi Interaktif (Swagger UI)

FastAPI secara otomatis membuat dokumentasi API interaktif. Setelah server berjalan, buka browser dan kunjungi:

👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

Melalui Swagger UI, tim *frontend* dapat melihat skema data, mencoba *request*, dan membaca respons API secara langsung.

---

## 📡 Daftar Endpoint API Utama

API ini dibagi menjadi empat modul utama: **Halte** (Titik), **Rute** (Garis), dan **Objek Wisata** (Area), **Authentication**.

### 🚏 1. Halte (Titik/Point)
Menangani data halte bus/angkot dengan fitur pencarian spasial berbasis radius.
*   `GET /api/halte/` : Mengambil semua data halte.
*   `GET /api/halte/{id}` : Mengambil detail halte berdasarkan ID (termasuk koordinat).
*   `GET /api/halte/data/geojson` : Mengambil seluruh halte dalam format standar **GeoJSON FeatureCollection** untuk *layer* peta.
*   `GET /api/halte/search/nearby` : Mencari halte terdekat berdasarkan koordinat pengguna (Longitude, Latitude) dan batasan radius meter.
*   `GET /api/halte/{id}/wisata-terdekat` : Mencari objek wisata di sekitar halte (dengan sistem *Nearest Neighbor Fallback*).
*   `POST /api/halte/` : Menambahkan data halte baru.
*   `PUT /api/halte/{id}` : Memperbarui data halte.
*   `DELETE /api/halte/{id}` : Menghapus data halte.

### 🚌 2. Rute (Jalur/LineString)
Menangani data rute perjalanan dan relasinya dengan halte yang dilewati secara berurutan.
*   `GET /api/rute/` : Mengambil semua rute beserta jalur *LineString*-nya.
*   `GET /api/rute/{id}` : Mengambil detail rute beserta **daftar halte lengkap yang dilewati sesuai urutan**.
*   `GET /api/rute/data/geojson` : Mengambil jalur rute dalam format standar **GeoJSON**.
*   `POST /api/rute/` : Membuat rute baru *(Transactional)*. Otomatis menyimpan titik jalur dan mendaftarkan urutan halte ke tabel relasi.
*   `PUT /api/rute/{id}` : Memperbarui informasi rute atau urutan haltenya.
*   `DELETE /api/rute/{id}` : Menghapus rute.

### 🏛️ 3. Objek Wisata (Area/Polygon)
Menangani data kawasan wisata dengan geometri berbentuk poligon.
*   `GET /api/objek-wisata/` : Mengambil semua area wisata.
*   `GET /api/objek-wisata/{id}` : Mengambil detail objek wisata.
*   `GET /api/objek-wisata/data/geojson` : Mengambil geometri *Polygon* dalam format standar **GeoJSON**.
*   `GET /api/objek-wisata/{id}/halte-terdekat` : Mencari halte yang berdekatan/menempel dengan batas luar area tempat wisata (dengan sistem *Nearest Neighbor Fallback*).
*   `POST /api/objek-wisata/` : Menambahkan poligon kawasan wisata baru.
*   `PUT /api/objek-wisata/{id}` : Memperbarui data atau batas area wisata.
*   `DELETE /api/objek-wisata/{id}` : Menghapus area wisata.

### 👨🏾‍💻 4. Authentication
Menangani login admin.
*   `POST /auth/login` : Memeriksa kredensial pengguna (email & password) dan membuat JWT Access Token untuk masuk ke mode Admin.

---

## ⚠️ Catatan Penting untuk Pengembangan

1.  **CORS (Cross-Origin Resource Sharing):** Fitur CORS sudah diaktifkan di `main.py`. Jika proyek di-*deploy* ke *production*, pastikan domain pada `allow_origins` disesuaikan demi keamanan.
2.  **Format Input Spasial:** Selalu gunakan format *Longitude* terlebih dahulu lalu *Latitude* `[lon, lat]` saat mengirim data berformat GeoJSON dari *frontend*.
3.  **Polygon Closing:** Saat menambah atau mengedit poligon di Objek Wisata, pastikan titik koordinat pertama dan terakhir persis sama agar area tertutup secara valid di PostGIS.
