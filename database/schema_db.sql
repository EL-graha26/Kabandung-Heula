--Mengaktifkan Ekstensi PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

DROP TYPE IF EXISTS jenis_halte;
DROP TYPE IF EXISTS jenis_rute;

DROP TABLE IF EXISTS halte;
DROP TABLE IF EXISTS rute;
DROP TABLE IF EXISTS objek_wisata;
DROP TABLE IF EXISTS rute_halte;

--Membuat Tipe ENUM untuk Jenis Moda
CREATE TYPE jenis_halte AS ENUM ('Bus Trans', 'Angkot', 'Bandros');
CREATE TYPE jenis_rute AS ENUM ('Bus Trans', 'Angkot');


--Tabel Halte (Entitas Point)
CREATE TABLE halte (
    id_halte SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    kode VARCHAR(20) UNIQUE,
    jenis jenis_halte NOT NULL,
    alamat VARCHAR(255),
    fasilitas TEXT,
    jam_operasi_mulai TIME,
    jam_operasi_selesai TIME,
    aktif BOOLEAN DEFAULT true,
    geom GEOMETRY(Point, 4326)
);


--Tabel Rute (Entitas LineString)
CREATE TABLE rute (
    id_rute SERIAL PRIMARY KEY,
    nama_rute VARCHAR(100) NOT NULL,
    kode_rute VARCHAR(20) UNIQUE,
    warna_jalur VARCHAR(7), -- Format Hex (misal: #FF0000)
    keterangan TEXT, [cite: 118]
    jenis jenis_rute NOT NULL,
    panjang_km DECIMAL(10,2),
    estimasi_waktu INTEGER, -- Dalam menit
    tarif INTEGER,
    aktif BOOLEAN DEFAULT true,
    geom GEOMETRY(LineString, 4326)
);


--Tabel Objek Wisata (Entitas Polygon)
CREATE TABLE objek_wisata (
    id_wisata SERIAL PRIMARY KEY,
    nama_wisata VARCHAR(100) NOT NULL,
    kode_wisata VARCHAR(20) UNIQUE,
    deskripsi TEXT,
    luas_km2 DECIMAL(10,2),
    geom GEOMETRY(Polygon, 4326)
);


--Tabel Relasi Rute_Halte (Pivot Table)
CREATE TABLE rute_halte (
    id_rute INT REFERENCES rute(id_rute) ON DELETE CASCADE,
    id_halte INT REFERENCES halte(id_halte) ON DELETE CASCADE,
    urutan INT NOT NULL,
    PRIMARY KEY (id_rute, id_halte, urutan)
);


--Spatial Index untuk Optimasi Performa SIG
CREATE INDEX idx_halte_geom ON halte USING GIST (geom);
CREATE INDEX idx_rute_geom ON rute USING GIST (geom);
CREATE INDEX idx_wisata_geom ON objek_wisata USING GIST (geom);