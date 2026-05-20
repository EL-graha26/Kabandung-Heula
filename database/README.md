# README -> DATABASE

Ini adalah readme untuk database.

## 💾 Spesifikasi Database (PostGIS)
Berikut adalah spesifikasi teknis database yang diimplementasikan:
- **Tipe Geometri**: Point (Halte), LineString (Rute), dan Polygon (Objek Wisata).
- **SRID**: EPSG:4326 (WGS 84).
- **Optimasi**: Spatial Index (GiST) pada setiap kolom geometri.
- **Relasi**: Relasi fisik untuk jaringan transportasi dan relasi spasial dinamis untuk akses wisata.

## 📌 Entity Relationship Diagram (ERD)
<img width="1188" height="441" alt="ERD-sigma" src="https://github.com/user-attachments/assets/65cff852-3ece-4bdd-b17c-08b162ba91eb" />


## 📕 Skema Database
Database terdiri dari 4 tabel utama:
1.  **`halte`**: Menyimpan titik lokasi pemberhentian (Point).
2.  **`rute`**: Menyimpan jalur fisik perjalanan (LineString).
3.  **`objek_wisata`**: Menyimpan area wilayah wisata (Polygon).
4.  **`rute_halte`**: Tabel penghubung untuk urutan halte pada rute.

## 🗺️ Hasil Tampilan QGIS
<img width="2260" height="1239" alt="ss-qgis-sig_tubes" src="https://github.com/user-attachments/assets/6d016464-a1b4-40d1-94e5-b0fa1550e2ab" />
