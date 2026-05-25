## 🚀 Cara Menjalankan Proyek Lokal

Pastikan PostgreSQL dan ekstensi PostGIS sudah berjalan di komputermu dan database sudah terhubung melalui file `.env`.

### Terminal 1: Menjalankan Backend (FastAPI)
Buka terminal pertama di dalam folder utama proyek (root directory) untuk menjalankan server API.

1. **Aktifkan Virtual Environment**
   Gunakan perintah berikut sesuai dengan sistem operasi yang kamu gunakan:
   * **Windows:**
     ```bash
     venv\Scripts\activate
     ```
   * **Mac/Linux:**
     ```bash
     source venv/bin/activate
     ```
   *(Pastikan muncul tanda `(venv)` di awal baris terminalmu yang menandakan environment sudah aktif).*

2. **Install Dependencies (Jika belum)**
   Jika ini pertama kalinya kamu membuka proyek di komputer ini, instal library yang dibutuhkan:
   ```bash
   pip install fastapi uvicorn asyncpg python-dotenv
   ```

3. **Jalankan Server Backend**
   Mulai server FastAPI dengan fitur auto-reload:
   ```bash
   uvicorn main:app --reload
   ```
   ✅ **Berhasil:** Backend API sekarang berjalan di `http://127.0.0.1:8000`. Kamu bisa melihat dokumentasi API-nya di `http://127.0.0.1:8000/docs`.

---

### Terminal 2: Menjalankan Frontend (React + Vite)
Buka terminal kedua (bisa menggunakan tab baru di terminal VS Code atau command prompt baru) untuk menjalankan antarmuka pengguna (peta interaktif).

1. **Masuk ke Direktori Frontend**
   Arahkan terminal ke dalam folder frontend:
   ```bash
   cd frontend
   ```

2. **Install Dependencies (Jika belum)**
   Jika kamu baru saja men-clone (unduh) proyek atau ada tambahan library baru (seperti Leaflet), instal dependency Node.js:
   ```bash
   npm install
   ```

3. **Jalankan Server Frontend**
   Mulai development server Vite:
   ```bash
   npm run dev
   ```
   ✅ **Berhasil:** Frontend sekarang berjalan (biasanya di `http://localhost:5173`). Buka link tersebut di browser untuk melihat peta interaktifmu.

---

## 💡 Troubleshooting (Kendala Umum)
* **Peta tidak muncul/abu-abu:** Pastikan terminal backend berjalan dan CORS sudah diatur di `main.py` agar React (port 5173) diizinkan mengambil data dari FastAPI (port 8000).
* **Data wisata/halte kosong:** Periksa kembali apakah file `.env` di backend sudah mengarah ke database `sigma_bandoeng` dengan password yang benar.
* **Tidak bisa menjalankan `uvicorn`:** Pastikan kamu sudah mengaktifkan `venv` di Terminal 1 sebelum menjalankan perintah tersebut.
