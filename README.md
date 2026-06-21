<div align="center">

# 🗺️ Kabandung Heula

### Smart Mobility & Tourism WebGIS Platform for Bandung City

*"Ke Bandung Dulu"* — Platform peta interaktif yang mengintegrasikan transportasi publik dan destinasi wisata Kota Bandung dalam satu pengalaman geospasial yang mulus.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?logo=fastapi&logoColor=white&style=flat-square)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white&style=flat-square)](https://www.postgresql.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.x-orange?style=flat-square)](https://postgis.net)
[![Leaflet](https://img.shields.io/badge/React--Leaflet-Map-199900?logo=leaflet&logoColor=white&style=flat-square)](https://react-leaflet.js.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#-lisensi)

[Demo Video](#-demo) · [Fitur](#-fitur-utama) · [Tech Stack](#-tech-stack) · [API Docs](#-rest-api) · [Instalasi](#-instalasi--menjalankan-proyek) · [Tim](#-tim-pengembang)

</div>

---

## 📖 Tentang Proyek

**Kabandung Heula** adalah platform **WebGIS interaktif** yang dikembangkan untuk informasi mengenai rute transportasi publik, lokasi halte, dan destinasi wisata di sekitarnya kota bandung

Kabandung Heula menyatukan tiga moda transportasi utama Kota Bandung — **Trans Metro Bandung (BRT)**, **Bandros (Bus Wisata)**, dan **Angkutan Kota** — dengan **20 destinasi wisata unggulan**, lengkap dengan analisis spasial cerdas yang merekomendasikan wisata terdekat dari setiap halte yang dipilih pengguna.

> Proyek ini dikembangkan sebagai studi kasus Mata Kuliah **Sistem Informasi Geografis (IF25-40405)**, Program Studi Teknik Informatika, Institut Teknologi Sumatera (ITERA).

---

## 🎬 Video Demo Aplikasi

<div align="center">

[![Watch Demo](https://img.shields.io/badge/▶️_Tonton_Video_Demo-Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1b2h-hpvpqy-FcMcNBlQ76igCLVJlI4Xv/view?usp=sharing)

</div>

---

## ✨ Fitur Utama

| | |
|---|---|
| 🗺️ **Peta Interaktif Multi-Layer** | Visualisasi halte (Point), rute (LineString), dan wisata (Polygon) secara real-time di atas basemap OpenStreetMap |
| 🚌 **Filter Moda Transportasi** | Toggle on/off untuk Trans Metro, Bandros, dan Angkutan Kota beserta daftar koridor aktif |
| 🔍 **Pencarian Cerdas** | Search box untuk menemukan halte, rute, atau destinasi wisata secara instan |
| 📍 **Analisis Wisata Terdekat** | Rekomendasi objek wisata dalam radius 3,5 km dari halte menggunakan `ST_DWithin`, dengan mekanisme **fallback** otomatis jika radius kosong |
| 📐 **Perhitungan Spasial Otomatis** | Panjang rute (`ST_Length`) dan luas area wisata (`ST_Area`) dihitung langsung dari geometri |
| 🔐 **Panel Admin (CRUD)** | Manajemen data halte, rute, dan wisata berbasis autentikasi **JWT** |
| 📑 **Dokumentasi API Otomatis** | Swagger UI (OpenAPI 3.0) untuk eksplorasi dan pengujian seluruh endpoint |
| 🎨 **Onboarding & Landing Page** | Splash screen, halaman pengantar, serta halaman Transportasi & Wisata bergaya editorial |

---

## Tampilan Aplikasi

<table>
<tr>
<td width="50%">

**Landing Page**
<img width="1914" height="916" alt="Screenshot 2026-06-10 215015" src="https://github.com/user-attachments/assets/70c77bad-08eb-49e3-9c7d-a7b011077e27" alt="Landing Page Kabandung Heula" width="100%">

</td>
<td width="50%">

**Halaman Onboarding**
<img width="1907" height="925" alt="Screenshot 2026-06-10 215050" src="https://github.com/user-attachments/assets/0acb8ae6-617f-4ba3-960c-4115af16a65d" alt="Onboarding Kabandung Heula" width="100%">

</td>
</tr>
<tr>
<td width="50%">

**Peta Interaktif — Filter & Layer**
<img width="1908" height="826" alt="Screenshot 2026-06-10 215210" src="https://github.com/user-attachments/assets/6e0ba36d-9cf1-4446-b635-536d2c806ae3" alt="Peta Interaktif Kabandung Heula" width="100%">

</td>
<td width="50%">

**Analisis Wisata Terdekat (Popup)**
<img width="1884" height="929" alt="Screenshot 2026-06-10 220342" src="https://github.com/user-attachments/assets/4324ee22-d179-4539-aa39-69b06b44d50d" alt="Popup Analisis Spasial" width="100%">

</td>
</tr>
<tr>
<td colspan="2">

**Halaman Transportasi — Katalog Moda Transportasi**
<img width="1915" height="915" alt="Screenshot 2026-06-10 215251" src="https://github.com/user-attachments/assets/5de44f35-9b93-4658-b533-1f15a62381fd" alt="Halaman Transportasi" width="100%">

</td>
</tr>
</table>

---

## Arsitektur Sistem

Kabandung Heula dibangun menggunakan **Three-Tier Architecture**, memisahkan presentasi, logika bisnis, dan penyimpanan data agar setiap lapisan dapat dikembangkan secara independen.

```
┌──────────────────────────┐      HTTP/Axios      ┌──────────────────────────┐      asyncpg      ┌──────────────────────────┐
│   LAPIS 1 — PRESENTASI   │ ───────────────────▶ │    LAPIS 2 — APLIKASI    │ ─────────────────▶ │     LAPIS 3 — DATA       │
│                          │                       │                          │                     │                          │
│  ReactJS + React-Leaflet │ ◀─────────────────── │   FastAPI + Pydantic     │ ◀───────────────── │ PostgreSQL + PostGIS     │
│  Axios · Filter · Search │      GeoJSON          │   JWT Auth · CORS        │     GeoJSON         │ GiST Index · ST_DWithin │
│  Popup · CRUD Forms      │                       │   19 REST Endpoints      │                     │ ST_Length · ST_Area     │
└──────────────────────────┘                       └──────────────────────────┘                     └──────────────────────────┘
```

**Alur kerja:** Pengguna berinteraksi dengan peta → React-Leaflet mengirim request via Axios → FastAPI memvalidasi & menjalankan query spasial → PostGIS mengeksekusi komputasi geometri → Hasil dikembalikan sebagai GeoJSON standar (RFC 7946) untuk dirender di peta.

---

## Tech Stack

<table>
<tr><th>Lapisan</th><th>Teknologi</th><th>Peran</th></tr>
<tr>
<td><b>Frontend</b></td>
<td>

![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) ![Leaflet](https://img.shields.io/badge/-React--Leaflet-199900?logo=leaflet&logoColor=white) ![Axios](https://img.shields.io/badge/-Axios-5A29E4?logo=axios&logoColor=white) ![CSS](https://img.shields.io/badge/-CSS3-1572B6?logo=css3&logoColor=white)

</td>
<td>Antarmuka peta interaktif, rendering layer GeoJSON, filter & state management</td>
</tr>
<tr>
<td><b>Backend</b></td>
<td>

![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white) ![Pydantic](https://img.shields.io/badge/-Pydantic-E92063?logo=pydantic&logoColor=white) ![JWT](https://img.shields.io/badge/-JWT-black?logo=jsonwebtokens&logoColor=white)

</td>
<td>19 REST API endpoint, validasi skema, autentikasi admin berbasis token</td>
</tr>
<tr>
<td><b>Database</b></td>
<td>

![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?logo=postgresql&logoColor=white) ![PostGIS](https://img.shields.io/badge/-PostGIS-orange) ![pgAdmin](https://img.shields.io/badge/-pgAdmin-336791?logo=postgresql&logoColor=white)

</td>
<td>Penyimpanan data spasial, query geospasial (`ST_DWithin`, `ST_Length`, `ST_Area`), indeks GiST</td>
</tr>
<tr>
<td><b>Basemap & Data</b></td>
<td>

![OSM](https://img.shields.io/badge/-OpenStreetMap-7EBC6F?logo=openstreetmap&logoColor=white) ![GeoJSON](https://img.shields.io/badge/-GeoJSON-blue)

</td>
<td>Peta dasar dan format tukar data spasial standar (RFC 7946)</td>
</tr>
<tr>
<td><b>Dokumentasi API</b></td>
<td>

![Swagger](https://img.shields.io/badge/-Swagger-85EA2D?logo=swagger&logoColor=black)

</td>
<td>Dokumentasi interaktif endpoint di <code>/docs</code></td>
</tr>
</table>

---

## Model Data Spasial

| Entitas | Tipe Geometri | Jumlah Data | Sumber |
|---|---|---|---|
| **Halte** | `Point` (EPSG:4326) | 59 titik | Digitasi QGIS + OpenStreetMap |
| **Rute** | `LineString` (EPSG:4326) | 20 rute (5 TMB + 15 Angkot) | Digitasi QGIS + OpenStreetMap |
| **Objek Wisata** | `Polygon` (EPSG:4326) | 20 objek | Portal Wisata Bandung + OpenStreetMap |
| **Users** | Non-spasial | 1 akun admin | Manual |
| **Rute_Halte** | Pivot (many-to-many) | Sesuai relasi | Derived |

Seluruh tabel spasial menggunakan **indeks GiST** untuk mengoptimalkan query jarak dan radius pada skala data yang besar.

<details>
<summary><b>📐 Lihat Entity Relationship Diagram (ERD)</b></summary>
<br>

```
 rute                       users
 ├─ id_rute (PK)            ├─ id (PK)
 ├─ nama_rute                ├─ email
 ├─ kode_rute                ├─ hashed_password
 ├─ jenis (ENUM)             └─ is_active
 ├─ panjang_km
 ├─ geom (LineString)       objek_wisata
 └─ ...                     ├─ id_wisata (PK)
        │                   ├─ nama_wisata
        │ M:N                ├─ kode_wisata
        ▼                   ├─ luas_km2
 rute_halte                 └─ geom (Polygon)
 ├─ id_rute (FK)
 ├─ id_halte (FK)
 └─ urutan
        ▲
        │
 halte
 ├─ id_halte (PK)
 ├─ nama
 ├─ kode
 ├─ jenis (ENUM)
 ├─ jam_operasi
 └─ geom (Point)
```

</details>

---

## REST API

Backend menyediakan **19 endpoint** yang terbagi dalam 4 modul, seluruhnya menghasilkan output **GeoJSON** dan terdokumentasi otomatis via Swagger UI di `/docs`.

<details>
<summary><b> Halte</b></summary>

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/halte/` | Ambil seluruh data halte |
| `GET` | `/api/halte/{id}` | Detail halte berdasarkan ID |
| `GET` | `/api/halte/data/geojson` | Export GeoJSON FeatureCollection |
| `GET` | `/api/halte/search/nearby` | Cari halte terdekat dari koordinat tertentu |
| `GET` | `/api/halte/{id}/wisata-terdekat` | Analisis wisata terdekat (dengan fallback) |
| `POST` | `/api/halte/` | Tambah halte baru |
| `PUT` | `/api/halte/{id}` | Perbarui data halte |
| `DELETE` | `/api/halte/{id}` | Hapus halte |

</details>

<details>
<summary><b> Rute</b></summary>

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/rute/` | Ambil seluruh data rute |
| `GET` | `/api/rute/{id}` | Detail rute + daftar halte berurutan |
| `GET` | `/api/rute/data/geojson` | Export GeoJSON LineString |
| `POST` | `/api/rute/` | Buat rute baru (transaksional, otomatis daftarkan halte) |
| `PUT` | `/api/rute/{id}` | Perbarui rute atau urutan haltenya |
| `DELETE` | `/api/rute/{id}` | Hapus rute |

</details>

<details>
<summary><b> Objek Wisata</b></summary>

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/objek-wisata/` | Ambil seluruh objek wisata |
| `GET` | `/api/objek-wisata/{id}` | Detail objek wisata |
| `GET` | `/api/objek-wisata/data/geojson` | Export GeoJSON Polygon |
| `GET` | `/api/objek-wisata/{id}/halte-terdekat` | Analisis halte terdekat (dengan fallback) |
| `POST` | `/api/objek-wisata/` | Tambah objek wisata baru |
| `PUT` | `/api/objek-wisata/{id}` | Perbarui data/area wisata |
| `DELETE` | `/api/objek-wisata/{id}` | Hapus objek wisata |

</details>

<details>
<summary><b> Autentikasi</b></summary>

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/login` | Login admin & penerbitan JWT token |

</details>

###  Query Analisis Spasial — Wisata Terdekat dengan Fallback

Logika inti sistem menggunakan **CTE bertingkat** untuk menjamin pengguna selalu mendapat rekomendasi bermakna, bahkan saat tidak ada objek wisata di dalam radius pencarian:

```sql
WITH halte_terpilih AS (
  SELECT geom FROM halte WHERE id_halte = :id
),
wisata_dalam_radius AS (
  SELECT w.id_wisata, w.nama_wisata,
    ROUND(ST_Distance(w.geom::geography, h.geom::geography)::numeric) AS jarak_meter
  FROM objek_wisata w, halte_terpilih h
  WHERE ST_DWithin(w.geom::geography, h.geom::geography, :radius)
),
wisata_terdekat_absolut AS (
  SELECT w.id_wisata, w.nama_wisata,
    ROUND(ST_Distance(w.geom::geography, h.geom::geography)::numeric) AS jarak_meter
  FROM objek_wisata w, halte_terpilih h
  ORDER BY jarak_meter ASC LIMIT 1
)
SELECT * FROM wisata_dalam_radius
UNION
SELECT * FROM wisata_terdekat_absolut
WHERE NOT EXISTS (SELECT 1 FROM wisata_dalam_radius)
ORDER BY jarak_meter ASC;
```

---

##  Struktur Proyek

```
Kabandung-Heula/
├── backend/
│   ├── routers/
│   │   ├── halte.py            # CRUD + analisis spasial halte
│   │   ├── rute.py             # CRUD rute + relasi halte (transaksional)
│   │   ├── objek_wisata.py     # CRUD + analisis spasial wisata
│   │   └── auth.py             # Login & JWT
│   ├── models.py                # Skema validasi Pydantic
│   ├── database.py              # Connection pool asyncpg
│   ├── schema_db.sql            # DDL + DML + spatial indexing
│   └── main.py                  # Entry point FastAPI
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView/         # MapContainer, layer GeoJSON, popup
│   │   │   ├── FilterPanel/
│   │   │   ├── SearchBox/
│   │   │   └── AdminPanel/      # Form CRUD admin
│   │   ├── pages/
│   │   │   ├── Beranda.jsx
│   │   │   ├── PetaInteraktif.jsx
│   │   │   ├── Transportasi.jsx
│   │   │   ├── Wisata.jsx
│   │   │   └── Kontak.jsx
│   │   └── App.jsx
│   └── package.json
├── docs/
│   ├── Laporan_Akhir.pdf
│   ├── Dokumentasi_Database_Spasial.pdf
│   └── Dokumentasi_Backend_API.pdf
└── README.md
```

---

##  Instalasi & Menjalankan Proyek

### Prasyarat
- Node.js ≥ 18
- Python ≥ 3.10
- PostgreSQL ≥ 15 dengan ekstensi PostGIS aktif

### 1. Clone Repository

```bash
git clone https://github.com/EL-graha26/Kabandung-Heula.git
cd Kabandung-Heula
```

### 2. Setup Database

```bash
createdb sigma_bandoeng
psql -d sigma_bandoeng -f backend/schema_db.sql
```

### 3. Jalankan Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend berjalan di `http://127.0.0.1:8000` — dokumentasi API tersedia di `http://127.0.0.1:8000/docs`.

### 4. Jalankan Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

> **Kredensial Admin Default:** `admin@gmail.com` / `admin123`


## Batasan Proyek

- Cakupan wilayah: Kota Bandung + sebagian kawasan Lembang 
- Moda transportasi daring (ojek/taksi online) tidak termasuk dalam cakupan
- Belum mendukung *optimal routing* (direncanakan menggunakan pgRouting — lihat [Roadmap](#-roadmap))
- Dioptimalkan untuk akses desktop; antarmuka mobile dapat diakses namun belum menjadi prioritas optimasi

## Roadmap

- [ ] Optimal routing antar-titik menggunakan **pgRouting** (Dijkstra/A*)
- [ ] Integrasi posisi kendaraan real-time via GTFS-Realtime / API BEMO
- [ ] Pelengkapan atribut `fasilitas`, `jam_operasi`, `tarif` yang masih kosong
- [ ] Optimasi antarmuka responsif untuk perangkat mobile
- [ ] Eksplorasi navigasi berbasis suara & panduan wisata AR

---

## Tim Pengembang

Proyek ini dikembangkan oleh **Kelompok 5** — Mata Kuliah Sistem Informasi Geografis (IF25-40405), ITERA.

| Nama | NIM |
|---|---|
| **Muhammad Piela Nugraha** | 123140200 | 
| **Reyhan Oktavian Putra** | 123140202 | 
| **Firman Gultom** | 123140171 | 

**Dosen Pengampu:** Muhammad Habib Alghifari, S.Kom., M.T.I. · Alya Khairunnisa Rizkita, S.Kom., M.Kom.

---

## 📚 Dokumentasi Lengkap

| Dokumen | Deskripsi |
|---|---|
| 📄 [Laporan Akhir](docs/Laporan_Akhir.pdf) | Latar belakang, analisis kebutuhan, perancangan, hasil pengujian, dan kesimpulan |
| 📄 [Dokumentasi Database Spasial](docs/Dokumentasi_Database_Spasial.pdf) | ERD, skema tabel, dan script SQL lengkap |
| 📄 [Dokumentasi Backend & API](docs/Dokumentasi_Backend_API.pdf) | Implementasi kode seluruh endpoint REST API dan Swagger |
| 📁 [Folder Dokumentasi & Sumber Data](https://drive.google.com/drive/folders/1DM7IQyZ3_7T-lLmR6qdDyZg_TYJrPmgA?usp=sharing) | Aset pendukung dan data mentah proyek |

---



Proyek ini dikembangkan untuk keperluan akademik Mata Kuliah Sistem Informasi Geografis, Program Studi Teknik Informatika, Institut Teknologi Sumatera (ITERA), Tahun 2026.

---

<div align="center">

Made with 💚 in Bandung by **Kelompok 5** — ITERA

</div>
