# README -> DATABASE

Ini adalah readme untuk database.

## 💾 Spesifikasi Database (PostGIS)
Berikut adalah spesifikasi teknis database yang diimplementasikan:
- **Tipe Geometri**: Point (Halte), LineString (Rute), dan Polygon (Objek Wisata).
- **SRID**: EPSG:4326 (WGS 84).
- **Optimasi**: Spatial Index (GiST) pada setiap kolom geometri.
- **Relasi**: Relasi fisik untuk jaringan transportasi dan relasi spasial dinamis untuk akses wisata.

## 📌 Entity Relationship Diagram (ERD)


## 📕 Skema Database
Database terdiri dari 4 tabel utama:
1.  **`halte`**: Menyimpan titik lokasi pemberhentian (Point).
2.  **`rute`**: Menyimpan jalur fisik perjalanan (LineString).
3.  **`objek_wisata`**: Menyimpan area wilayah wisata (Polygon).
4.  **`rute_halte`**: Tabel penghubung untuk urutan halte pada rute.

## 📑 SQL Scripts