# README -> DATABASE

Ini adalah readme untuk database.

## 💾 Spesifikasi Database (PostGIS)
Berikut adalah spesifikasi teknis database yang diimplementasikan:
- **Tipe Geometri**: Point (Halte), LineString (Rute), dan Polygon (Objek Wisata).
- **SRID**: EPSG:4326 (WGS 84).
- **Optimasi**: Spatial Index (GiST) pada setiap kolom geometri.
- **Relasi**: Relasi fisik untuk jaringan transportasi dan relasi spasial dinamis untuk akses wisata menggunakan ST_DWithin.

## 📌 Entity Relationship Diagram (ERD)
<img width="866" height="1128" alt="ERD from pgadmin" src="https://github.com/user-attachments/assets/8f975a54-4322-4654-aa86-97d93c2022e6" />

## 📕 Skema Database
Database terdiri dari 5 tabel utama:
1.  **`halte`**: Menyimpan titik lokasi pemberhentian (Point).
2.  **`rute`**: Menyimpan jalur fisik perjalanan (LineString).
3.  **`objek_wisata`**: Menyimpan area wilayah wisata (Polygon).
4.  **`rute_halte`**: Tabel penghubung untuk urutan halte pada rute.
5.  **`users`**: Menyimpan data email dan password untuk admin.

## 🗺️ Hasil Tampilan QGIS
<img width="2260" height="1239" alt="ss-qgis-sig_tubes" src="https://github.com/user-attachments/assets/6d016464-a1b4-40d1-94e5-b0fa1550e2ab" />
