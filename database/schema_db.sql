-- =========================================================================
-- AKTIVASI EKSTENSI & PEMBERSIHAN SKEMA (Idempotent)
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rute_halte CASCADE;
DROP TABLE IF EXISTS objek_wisata CASCADE;
DROP TABLE IF EXISTS rute CASCADE;
DROP TABLE IF EXISTS halte CASCADE;

DROP TYPE IF EXISTS jenis_halte;
DROP TYPE IF EXISTS jenis_rute;

-- =========================================================================
-- PEMBUATAN TABEL USERS (Untuk Otentikasi Sederhana)
-- =========================================================================
-- Buat tabel users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Tambahkan user admin default (email: admin@gmail.com, password: admin123)
INSERT INTO users (email, hashed_password) 
VALUES ('admin@gmail.com', 'admin123');

-- =========================================================================
-- PEMBUATAN TIPE DATA ENUM (Moda Transportasi)
-- =========================================================================
CREATE TYPE jenis_halte AS ENUM ('Bus Trans', 'Angkot', 'Bandros');
CREATE TYPE jenis_rute AS ENUM ('Bus Trans', 'Angkot');

-- =========================================================================
-- PEMBUATAN TABEL UTAMA & STRUKTUR GEOMETRI (DDL)
-- =========================================================================

-- Tabel Halte (Entitas Point)
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

-- Tabel Rute (Entitas LineString)
CREATE TABLE rute (
    id_rute SERIAL PRIMARY KEY,
    nama_rute VARCHAR(100) NOT NULL,
    kode_rute VARCHAR(20) UNIQUE,
    warna_jalur VARCHAR(7), -- Format Hex (misal: #FF0000)
    keterangan TEXT,
    jenis jenis_rute NOT NULL,
    panjang_km DECIMAL(10,2),
    estimasi_waktu INTEGER, -- Dalam menit
    tarif INTEGER,
    aktif BOOLEAN DEFAULT true,
    geom GEOMETRY(LineString, 4326)
);

-- Tabel Objek Wisata (Entitas Polygon)
CREATE TABLE objek_wisata (
    id_wisata SERIAL PRIMARY KEY,
    nama_wisata VARCHAR(100) NOT NULL,
    kode_wisata VARCHAR(20) UNIQUE,
    deskripsi TEXT,
    luas_km2 DECIMAL(10,2),
    geom GEOMETRY(Polygon, 4326)
);

-- Tabel Relasi Rute_Halte (Pivot Table Many-to-Many)
CREATE TABLE rute_halte (
    id_rute INT REFERENCES rute(id_rute) ON DELETE CASCADE,
    id_halte INT REFERENCES halte(id_halte) ON DELETE CASCADE,
    urutan INT NOT NULL,
    PRIMARY KEY (id_rute, id_halte, urutan)
);

-- =========================================================================
-- SPATIAL INDEXING (Optimasi Performa Query SIG)
-- =========================================================================
CREATE INDEX idx_halte_geom ON halte USING GIST (geom);
CREATE INDEX idx_rute_geom ON rute USING GIST (geom);
CREATE INDEX idx_wisata_geom ON objek_wisata USING GIST (geom);

-- =========================================================================
-- ATA MANIPULATION LANGUAGE (DML) - SAMPLE RECORDS
-- =========================================================================

-- Sample Data untuk Tabel Halte. Atribut lainnya seperti fasilitas, jam_operasi, dan tarif blm ad datany.
INSERT INTO halte (nama, kode, jenis, alamat, geom)
VALUES 
    ('Halte BKKBN', 'HLT-001', 'Bus Trans', 'Jalan Surapati, Sukaluyu, Cibeunying Kaler, Kota Bandung, Jawa Barat, Jawa, 64222, Indonesia', ST_SetSRID(ST_MakePoint(107.6324886, -6.8982473), 4326)),
    ('Halte Bundaran Cibiru', 'HLT-002', 'Bus Trans', 'Jalan Soekarno-Hatta, Cipadung Kidul, Panyileukan, Kota Bandung, Jawa Barat, Jawa, 40626, Indonesia', ST_SetSRID(ST_MakePoint(107.7175908, -6.9352673), 4326)),
    ('Halte Cikapayang Dago 1', 'HLT-003', 'Bus Trans', 'TIKI, 3, Jalan Cikapayang, Tamansari, Bandung Wetan, Kota Bandung, Jawa Barat, Jawa, 40116, Indonesia', ST_SetSRID(ST_MakePoint(107.6120546, -6.8990335), 4326)),
    ('Halte Cikapayang Dago 2', 'HLT-004', 'Bus Trans', 'Majelis Wali Amanat ITB, 1, Jalan Surapati, Lebak Gede, Coblong, Kota Bandung, Jawa Barat, Jawa, 40132, Indonesia', ST_SetSRID(ST_MakePoint(107.6135004, -6.898852), 4326)),
    ('Halte Cikutra', 'HLT-005', 'Bus Trans', 'Sekolah Menengah Pertama Negeri 16 Bandung, 53, Jalan PH. H. Mustofa, Cikutra, Cibeunying Kidul, Kota Bandung, Jawa Barat, Jawa, 40124, Indonesia', ST_SetSRID(ST_MakePoint(107.6426735, -6.8997726), 4326)),
    ('Halte Cimuncang', 'HLT-006', 'Bus Trans', 'Jalan PH. H. Mustofa, Padasuka, Cibeunying Kidul, Kota Bandung, Jawa Barat, Jawa, 40125, Indonesia', ST_SetSRID(ST_MakePoint(107.6490533, -6.9016812), 4326)),
    ('Halte Dapen Telkom', 'HLT-007', 'Bus Trans', 'Jalan Surapati, Cihaurgeulis, Cibeunying Kaler, Kota Bandung, Jawa Barat, Jawa, 40122, Indonesia', ST_SetSRID(ST_MakePoint(107.6285873, -6.8998503), 4326)),
    ('Halte Depan Terminal Antapani', 'HLT-008', 'Bus Trans', 'Jalan Terusan Jakarta, Antapani Tengah, Antapani, Kota Bandung, Jawa Barat, Jawa, 40293, Indonesia', ST_SetSRID(ST_MakePoint(107.6658787, -6.9149864), 4326)),
    ('Halte Distan Jabar', 'HLT-009', 'Bus Trans', 'Jalan Surapati, Cihaurgeulis, Cibeunying Kaler, Kota Bandung, Jawa Barat, Jawa, 40122, Indonesia', ST_SetSRID(ST_MakePoint(107.6225131, -6.8992349), 4326)),
    ('Halte Flyover Antapani', 'HLT-010', 'Bus Trans', 'Jalan Jakarta, Kebonwaru, Batununggal, Kota Bandung, Jawa Barat, Jawa, 40282, Indonesia', ST_SetSRID(ST_MakePoint(107.6429791, -6.9138756), 4326)),
    ('Halte Gasibu', 'HLT-011', 'Bus Trans', 'Jalan Surapati, Lebak Gede, Coblong, Kota Bandung, Jawa Barat, Jawa, 40133, Indonesia', ST_SetSRID(ST_MakePoint(107.6179657, -6.8992842), 4326)),
    ('Halte Griya Pasteur 1', 'HLT-012', 'Bus Trans', 'Jalan Dr. Djunjunan, Pajajaran, Cicendo, Kota Bandung, Jawa Barat, Jawa, 40163, Indonesia', ST_SetSRID(ST_MakePoint(107.5884432, -6.8950796), 4326)),
    ('Halte Griya Pasteur 2', 'HLT-013', 'Bus Trans', 'Jalan Dr. Djunjunan, Sukabungah, Sukasari, Kota Bandung, Jawa Barat, Jawa, 40163, Indonesia', ST_SetSRID(ST_MakePoint(107.5883918, -6.8948914), 4326)),
    ('Halte ITENAS', 'HLT-014', 'Bus Trans', 'Institut Teknologi Nasional, 23, Jalan PH. H. Mustofa, Neglasari, Cibeunying Kaler, Kota Bandung, Jawa Barat, Jawa, 64222, Indonesia', ST_SetSRID(ST_MakePoint(107.6362093, -6.8982483), 4326)),
    ('Halte Jalaprang', 'HLT-015', 'Bus Trans', 'Jalan Surapati, Sukaluyu, Cibeunying Kaler, Kota Bandung, Jawa Barat, Jawa, 64222, Indonesia', ST_SetSRID(ST_MakePoint(107.6321413, -6.8983546), 4326)),
    ('Halte Lemahneundeut', 'HLT-016', 'Bus Trans', 'Jalan Lemah Neundeut, Sarijadi, Sukajadi, Kota Bandung, Jawa Barat, Jawa, 40151, Indonesia', ST_SetSRID(ST_MakePoint(107.5787258, -6.8813034), 4326)),
    ('Halte Mall d''Botanica', 'HLT-017', 'Bus Trans', 'Jalan Dr. Djunjunan, Sukagalih, Sukasari, Kota Bandung, Jawa Barat, Jawa, 40163, Indonesia', ST_SetSRID(ST_MakePoint(107.5849478, -6.8925604), 4326)),
    ('Halte Maranatha', 'HLT-018', 'Bus Trans', 'McDonald''s, 63, Jalan Prof. Dr. Surya Soemantri, Sukawarna, Sukasari, Kota Bandung, Jawa Barat, Jawa, 40164, Indonesia', ST_SetSRID(ST_MakePoint(107.5813547, -6.8857246), 4326)),
    ('Halte SMPN 63 Kota Bandung', 'HLT-019', 'Bus Trans', 'Jalan Surapati, Cihaurgeulis, Cibeunying Kaler, Kota Bandung, Jawa Barat, Jawa, 40122, Indonesia', ST_SetSRID(ST_MakePoint(107.6293496, -6.8998537), 4326)),
    ('Halte Sarijadi', 'HLT-020', 'Bus Trans', 'Jalan Sariwangi, Sukawarna, Sukasari, Kota Bandung, Jawa Barat, Jawa, 40151, Indonesia', ST_SetSRID(ST_MakePoint(107.5784297, -6.881656), 4326)),
    ('Halte Sarimanah', 'HLT-021', 'Bus Trans', 'Jalan Perintis, Sarijadi, Sukajadi, Kota Bandung, Jawa Barat, Jawa, 40151, Indonesia', ST_SetSRID(ST_MakePoint(107.5764264, -6.8814266), 4326)),
    ('Halte Seberang Borma Antapani', 'HLT-022', 'Bus Trans', '38, Jalan Terusan Jakarta, Babakan Surabaya, Kiaracondong, Kel. Babakan Surabaya, Jawa Barat, Jawa, 40125, Indonesia', ST_SetSRID(ST_MakePoint(107.6492727, -6.9130091), 4326)),
    ('Halte Seberang Terminal Cicaheum', 'HLT-023', 'Bus Trans', 'Jalan Abdul Haris Nasution, Pasirlayung, Cibeunying Kidul, Kota Bandung, Jawa Barat, Jawa, 40129, Indonesia', ST_SetSRID(ST_MakePoint(107.6567969, -6.9021302), 4326)),
    ('Halte Sekolah Pribadi', 'HLT-024', 'Bus Trans', 'Jalan PH. H. Mustofa, Neglasari, Cibeunying Kaler, Kota Bandung, Jawa Barat, Jawa, 40124, Indonesia', ST_SetSRID(ST_MakePoint(107.6404383, -6.8992417), 4326)),
    ('Halte Setrasari', 'HLT-025', 'Bus Trans', 'Dominos Pizza, 8D, Jalan Prof. Dr. Surya Soemantri, Sukagalih, Sukasari, Kota Bandung, Jawa Barat, Jawa, 40151, Indonesia', ST_SetSRID(ST_MakePoint(107.5814944, -6.8821984), 4326)),
    ('Halte Stasiun Hall', 'HLT-026', 'Bus Trans', 'Jalan Suniaraja, Kebon Jeruk, Andir, Kota Bandung, Jawa Barat, Jawa, 40181, Indonesia', ST_SetSRID(ST_MakePoint(107.6024325, -6.9161432), 4326)),
    ('Halte Sukapada', 'HLT-027', 'Bus Trans', 'Jalan PH. H. Mustofa, Padasuka, Cibeunying Kidul, Kota Bandung, Jawa Barat, Jawa, 40125, Indonesia', ST_SetSRID(ST_MakePoint(107.6439328, -6.9000256), 4326)),
    ('Halte Sukasenang Raya 1', 'HLT-028', 'Bus Trans', 'Jalan PH. H. Mustofa, Cikutra, Cibeunying Kidul, Kota Bandung, Jawa Barat, Jawa, 40124, Indonesia', ST_SetSRID(ST_MakePoint(107.637183, -6.8984713), 4326)),
    ('Halte Sukasenang Raya 2', 'HLT-029', 'Bus Trans', 'Jalan PH. H. Mustofa, Cikutra, Cibeunying Kidul, Kota Bandung, Jawa Barat, Jawa, 40124, Indonesia', ST_SetSRID(ST_MakePoint(107.6370818, -6.8984481), 4326)),
    ('Halte Surapati Core', 'HLT-030', 'Bus Trans', 'RedDoorz plus near Surapati Core, 149, Jalan PH. H. Mustofa, Pasirlayung, Cibeunying Kidul, Kota Bandung, Jawa Barat, Jawa, 40192, Indonesia', ST_SetSRID(ST_MakePoint(107.6525276, -6.9018908), 4326)),
    ('Halte Tamansari Cikapayang', 'HLT-031', 'Bus Trans', 'Kopi kamu, 66, Jalan Cikapayang, Lebak Siliwangi, Coblong, Kota Bandung, Jawa Barat, Jawa, 40132, Indonesia', ST_SetSRID(ST_MakePoint(107.610121, -6.8982089), 4326)),
    ('Halte Terminal Cicaheum', 'HLT-032', 'Bus Trans', 'Terminal Cicaheum, Jalan Abdul Haris Nasution, Cicaheum, Kiaracondong, Kota Bandung, Jawa Barat, Jawa, 40125, Indonesia', ST_SetSRID(ST_MakePoint(107.6565637, -6.902329), 4326)),
    ('Halte Terminal Elang', 'HLT-033', 'Bus Trans', 'Jalan Elang, Garuda, Andir, Kota Bandung, Jawa Barat, Jawa, 40211, Indonesia', ST_SetSRID(ST_MakePoint(107.575723, -6.9133498), 4326)),
    ('Halte Terminal Elang', 'HLT-034', 'Bus Trans', 'Jalan Elang, Garuda, Andir, Kota Bandung, Jawa Barat, Jawa, 40211, Indonesia', ST_SetSRID(ST_MakePoint(107.5755571, -6.9135373), 4326)),
    ('Halte Terminal Leuwipanjang', 'HLT-035', 'Bus Trans', 'Jalur Bus Kota Terminal Leuwipanjang, Situ Saeur, Bojongloa Kidul, Kota Bandung, Jawa Barat, Jawa, 40236, Indonesia', ST_SetSRID(ST_MakePoint(107.593264, -6.9458573), 4326)),
    ('Halte Warung Cepot', 'HLT-036', 'Bus Trans', 'Jalan Dr. Djunjunan, Pajajaran, Cicendo, Kota Bandung, Jawa Barat, Jawa, 40163, Indonesia', ST_SetSRID(ST_MakePoint(107.5832389, -6.8923414), 4326)),
    ('Halte Wisma BKN', 'HLT-037', 'Bus Trans', 'Jalan Surapati, Cihaurgeulis, Cibeunying Kaler, Kota Bandung, Jawa Barat, Jawa, 40133, Indonesia', ST_SetSRID(ST_MakePoint(107.6222912, -6.89924), 4326));

INSERT INTO halte (nama, kode, jenis, alamat, geom)
VALUES 
    ('Halte Abdul Muis/Kebon Kalapa', 'HLT-038', 'Angkot', 'Jalan Dewi Sartika, Pungkur, Regol, Kota Bandung, Jawa Barat, Jawa, 40252, Indonesia', ST_SetSRID(ST_MakePoint(107.6058121, -6.9276265), 4326)),
    ('Halte Angkot Cicaheum', 'HLT-0039', 'Angkot', 'Terminal Angkot Cicaheum, JPO Terminal Cicaheum, Cicaheum, Kiaracondong, Kota Bandung, Jawa Barat, Jawa, 40129, Indonesia', ST_SetSRID(ST_MakePoint(107.6562486, -6.9024172), 4326)),
    ('Halte Dago', 'HLT-0040', 'Angkot', 'Terminal Dago, Dago, Coblong, Kota Bandung, Jawa Barat, Jawa, 41035, Indonesia', ST_SetSRID(ST_MakePoint(107.6212119, -6.8670778), 4326)),
    ('Halte Ledeng', 'HLT-0041', 'Angkot', 'Terminal Ledeng, Jalan Dr. Setiabudi, Isola, Sukajadi, Kota Bandung, Jawa Barat, Jawa, 40154, Indonesia', ST_SetSRID(ST_MakePoint(107.5951942, -6.85933), 4326)),
    ('Halte Simpang Holis Soekarno Hatta', 'HLT-0042', 'Angkot', 'Jalan Holis, Cibuntu, Bandung Kulon, Kota Bandung, Jawa Barat, Jawa, 40211, Indonesia', ST_SetSRID(ST_MakePoint(107.5751042, -6.923662), 4326)),
    ('Halte Seberang Kiara Artha', 'HLT-0043', 'Angkot', 'Jalan H. Ibrahim Adjie, Babakan Surabaya, Kiaracondong, Kota Bandung, Jawa Barat, Jawa, 40283, Indonesia', ST_SetSRID(ST_MakePoint(107.6438226, -6.9146708), 4326)),
    ('Halte Leuwipanjang Soekarno Hatta', 'HLT-0044', 'Angkot', 'Jalan Soekarno-Hatta, Situ Saeur, Bojongloa Kidul, Kota Bandung, Jawa Barat, Jawa, 40236, Indonesia', ST_SetSRID(ST_MakePoint(107.5934341, -6.9468277), 4326)),
    ('Halte Cipagalo', 'HLT-0045', 'Angkot', 'Jalan Raya Bojongsoang, Kujangsari, Bandung Kidul, Kota Bandung, Kabupaten Bandung, Jawa Barat, Jawa, 40257, Indonesia', ST_SetSRID(ST_MakePoint(107.6379086, -6.9657162), 4326)),
    ('Halte Junction 8 Sukajadi', 'HLT-0046', 'Angkot', 'Jalan Cemara, Pasteur, Sukasari, Kota Bandung, Jawa Barat, Jawa, 40161, Indonesia', ST_SetSRID(ST_MakePoint(107.596703, -6.8840134), 4326)),
    ('Halte Pasar Ciwastra', 'HLT-0047', 'Angkot', 'Jalan Marga Cinta, Mekarjaya, Rancasari, Kota Bandung, Jawa Barat, Jawa, 40287, Indonesia', ST_SetSRID(ST_MakePoint(107.6664238, -6.9611563), 4326)),
    ('Halte Ujungberung', 'HLT-0048', 'Angkot', 'Terminal Ujungberung, Jalan Nagrog, Cigending, Ujungberung, Kota Bandung, Jawa Barat, Jawa, 45474, Indonesia', ST_SetSRID(ST_MakePoint(107.7028132, -6.9140461), 4326)),
    ('Halte Pusdiklat Geologi Cisitu', 'HLT-0049', 'Angkot', 'Jalan Cisitu Lama, Cisitu Lama, Dago, Coblong, Kota Bandung, Jawa Barat, Jawa, 40135, Indonesia', ST_SetSRID(ST_MakePoint(107.6120709, -6.8796668), 4326)),
    ('Halte Tegallega', 'HLT-0050', 'Angkot', 'Terminal Tegallega, Jalan Astana Anyar, Nyengseret, Astanaanyar, Kota Bandung, Jawa Barat, Jawa, 40252, Indonesia', ST_SetSRID(ST_MakePoint(107.6027695, -6.9338128), 4326)),
    ('Halte Overpass Mengger', 'HLT-0051', 'Angkot', 'Batununggal Sentosa, Batununggal Indah, Mengger, Bandung Kidul, Kota Bandung, Jawa Barat, Jawa, 40258, Indonesia', ST_SetSRID(ST_MakePoint(107.6229457, -6.9619679), 4326)),
    ('Halte Soekarno Hatta', 'HLT-0052', 'Angkot', 'Jalan Soekarno-Hatta, Pasirluyu, Regol, Kota Bandung, Jawa Barat, Jawa, 40267, Indonesia', ST_SetSRID(ST_MakePoint(107.6213965, -6.949255), 4326)),
    ('Halte BTM', 'HLT-0053', 'Angkot', 'Toko Buahbuahan Niaga Mandiri (Fruit Shop), 47, Jalan H. Ibrahim Adjie, Kebonwaru, Batununggal, Kota Bandung, Jawa Barat, Jawa, 40282, Indonesia', ST_SetSRID(ST_MakePoint(107.6434964, -6.9113612), 4326)),
    ('Halte Pangkalan Angkot Rajawali', 'HLT-0054', 'Angkot', '105, Jalan Rajawali Timur, Garuda, Andir, Kota Bandung, Jawa Barat, Jawa, 40211, Indonesia', ST_SetSRID(ST_MakePoint(107.5761151, -6.9132715), 4326)),
    ('Halte Karangsetra Waterland', 'HLT-0055', 'Angkot', 'Jalan Sirna Galih, Gegerkalong, Sukajadi, Kota Bandung, Jawa Barat, Jawa, 40153, Indonesia', ST_SetSRID(ST_MakePoint(107.5951798, -6.8790317), 4326)),
    ('Halte Cibaduyut', 'HLT-0056', 'Angkot', 'Jl. Cibaduyut, Cibaduyut Wetan, Kec. Bojongloa Kidul, Kabupaten Bandung, Jawa Barat 40239', ST_SetSRID(ST_MakePoint(107.5936395, -6.961841825), 4326)),
    ('Halte Bandros Jl. Diponegoro', 'HLT-0057', 'Bandros', 'Jl. Diponegoro, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40122', ST_SetSRID(ST_MakePoint(107.6211793, -6.901278286), 4326)),
    ('Halte Bandros Braga', 'HLT-0058', 'Bandros', 'Jl. Braga No.115-117, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111', ST_SetSRID(ST_MakePoint(107.6090105, -6.916229183), 4326)),
    ('Halte Bandros Alun-alun', 'HLT-0059', 'Bandros', 'Jl. Dalem Kaum 58, Balonggede, Kec. Regol, Kota Bandung, Jawa Barat 40251', ST_SetSRID(ST_MakePoint(107.6071612, -6.922418396), 4326));


-- Sample Data untuk Tabel Rute. Atribut lainnya seperti warna_jalur, keterangan, panjang_km, estimasi_waktu, dan tarif blm ad.
INSERT INTO rute (nama_rute, kode_rute, jenis, geom)
VALUES 
    ('Koridor 1: Cibeureum - Cibiru', 'RUTE-001', 'Bus Trans', ST_GeomFromText('LINESTRING(107.7175908 -6.9352673, 107.664302 -6.938964, 107.658183 -6.940214, 107.628522 -6.949384, 107.625542 -6.949562, 107.595191 -6.947379, 107.584694 -6.94337, 107.581175 -6.940075, 107.575896 -6.930469, 107.574457 -6.917329, 107.572177 -6.915741, 107.569138 -6.91058, 107.575736 -6.913181, 107.5755571 -6.9135373)', 4326)),
    ('Koridor 2: Cibeureum - Cicaheum', 'RUTE-002', 'Bus Trans', ST_GeomFromText('LINESTRING(107.6565637 -6.902329, 107.6563513 -6.9023366, 107.6563163 -6.9021406, 107.6556565 -6.9021233, 107.64318 -6.9087529, 107.643735 -6.913765, 107.636037 -6.914737, 107.634797 -6.914261, 107.634317 -6.913527, 107.617382 -6.922459, 107.574457 -6.917329, 107.572177 -6.915741, 107.569138 -6.91058, 107.575736 -6.913181, 107.575723 -6.9133498, 107.575736 -6.913181)', 4326)),
    ('Koridor 3: Cicaheum - Sarijadi', 'RUTE-003', 'Bus Trans', ST_GeomFromText('LINESTRING(107.6565637 -6.902329, 107.6563513 -6.9023366, 107.6490533 -6.9016812, 107.6477019 -6.9015712, 107.6443253 -6.9000999, 107.6426735 -6.8997726, 107.637183 -6.8984713, 107.634182 -6.8977788, 107.6324886 -6.8982473, 107.6293496 -6.8998537, 107.6261175 -6.8992547, 107.6222912 -6.89924, 107.6120546 -6.8990335, 107.6089058 -6.8981215, 107.6040626 -6.9003787, 107.59592 -6.900232, 107.5884432 -6.8950796, 107.5832389 -6.8923414, 107.581117 -6.892136, 107.5813547 -6.8857246, 107.5814822 -6.8824267, 107.5808334 -6.8824633, 107.5799378 -6.8828425, 107.5787864 -6.881618, 107.5787258 -6.8813034, 107.5786676 -6.8807636, 107.5764264 -6.8814266, 107.5762506 -6.8814809, 107.5764973 -6.8822348, 107.5784297 -6.881656)', 4326)),
    ('Koridor 4: Flyover Antapani - Leuwipanjang', 'RUTE-004', 'Bus Trans', ST_GeomFromText('LINESTRING(107.6429791 -6.9138756, 107.6360507 -6.9146753, 107.6347394 -6.9143281, 107.634118 -6.917202, 107.6314337 -6.9186093, 107.6304764 -6.9220795, 107.6282741 -6.9233954, 107.6250027 -6.9347724, 107.621983 -6.937441, 107.61957 -6.938172, 107.601476 -6.937258, 107.597127 -6.937806, 107.595007 -6.937112, 107.589633 -6.945683, 107.5951529 -6.9471546, 107.5952603 -6.9458707, 107.5939689 -6.9457039, 107.593809 -6.9457462, 107.5936731 -6.9459072, 107.593264 -6.9458573)', 4326)),
    ('Koridor 5: Antapani - Stasiun Hall', 'RUTE-005', 'Bus Trans', ST_GeomFromText('LINESTRING(107.6492727 -6.9130091, 107.6360507 -6.9146753, 107.6347394 -6.9143281, 107.634118 -6.917202, 107.6314337 -6.9186093, 107.62901 -6.913291, 107.621261 -6.905999, 107.613804 -6.906583, 107.612781 -6.907077, 107.610551 -6.907022, 107.610058 -6.916581, 107.61247 -6.91797, 107.611959 -6.921789, 107.5983244 -6.9201445, 107.598242 -6.916343, 107.6024325 -6.9161432)', 4326));

INSERT INTO rute (nama_rute, kode_rute, jenis, geom)
VALUES 
    ('Abdul Muis - Cicaheum', 'RTE-006', 'Angkot', ST_GeomFromText('LINESTRING(107.6058121 -6.9276265, 107.6060703 -6.9256964, 107.6071300 -6.9258254, 107.6070300 -6.9275224, 107.6086750 -6.9276951, 107.6133143 -6.9320495, 107.6149251 -6.9324971, 107.6157526 -6.9314085, 107.6174076 -6.9248159, 107.6181740 -6.9168803, 107.6184046 -6.9155780, 107.6172889 -6.9135670, 107.6179196 -6.9130447, 107.6176212 -6.9122817, 107.6175737 -6.9115119, 107.6183435 -6.9115017, 107.6189743 -6.9088633, 107.6212278 -6.9093550, 107.6211922 -6.9092194, 107.6258519 -6.9103351, 107.6267268 -6.9095381, 107.6273745 -6.9096840, 107.6284699 -6.9086327, 107.6292940 -6.9080290, 107.6292228 -6.9078018, 107.6293991 -6.9074830, 107.6301317 -6.9069574, 107.6298468 -6.9065063, 107.6302944 -6.9063605, 107.6324479 -6.9034474, 107.6329566 -6.9030269, 107.6350456 -6.9019315, 107.6340181 -6.8995406, 107.6340452 -6.8982316, 107.6354628 -6.8928123, 107.6361003 -6.8934770, 107.6400885 -6.8938840, 107.6424827 -6.8949895, 107.6435476 -6.8959594, 107.6437104 -6.8969565, 107.6434187 -6.8999815, 107.6449855 -6.9002528, 107.6478138 -6.9016161, 107.6572959 -6.9021994, 107.6573230 -6.9028098, 107.6562853 -6.9028844, 107.6562486 -6.9024172)', 4326)),
    ('Abdul Muis - Dago', 'RTE-007', 'Angkot', ST_GeomFromText('LINESTRING(107.6058121 -6.9276265, 107.6060703 -6.9256964, 107.6071300 -6.9258254, 107.6070300 -6.9275224, 107.6086750 -6.9276951, 107.6133143 -6.9320495, 107.6149251 -6.9324971, 107.6157526 -6.9314085, 107.6174076 -6.9248159, 107.6181740 -6.9168803, 107.6184046 -6.9155780, 107.6172889 -6.9135670, 107.616105 -6.91162, 107.613094 -6.912651, 107.612551 -6.911254, 107.612511 -6.909816, 107.613908 -6.904413, 107.614912 -6.909965, 107.613786 -6.908975, 107.612741 -6.907022, 107.610611 -6.906968, 107.610652 -6.90477, 107.612728 -6.899819, 107.614111 -6.883798, 107.615902 -6.88156, 107.616879 -6.87802, 107.618791 -6.875388, 107.620609 -6.86908, 107.620975 -6.866828, 107.6212119 -6.8670778)', 4326)),
    ('Abdul Muis - Ledeng', 'RTE-008', 'Angkot', ST_GeomFromText('LINESTRING(107.6058121 -6.9276265, 107.6060703 -6.9256964, 107.6071300 -6.9258254, 107.6070300 -6.9275224, 107.6086750 -6.9276951, 107.6133143 -6.9320495, 107.6149251 -6.9324971, 107.6157526 -6.9314085, 107.6174076 -6.9248159, 107.6181740 -6.9168803, 107.6184046 -6.9155780, 107.6172889 -6.9135670, 107.6179196 -6.9130447, 107.6176212 -6.9122817, 107.6175737 -6.9115119, 107.6175975 -6.9100061, 107.6167564 -6.9061875, 107.6137314 -6.9065402, 107.6127751 -6.9070489, 107.6105979 -6.9070015, 107.6103401 -6.9136484, 107.6099739 -6.9139672, 107.6090243 -6.9138383, 107.6090718 -6.9105759, 107.6073829 -6.9076662, 107.6063791 -6.9071846, 107.6044393 -6.9071914, 107.6043036 -6.9043495, 107.6029810 -6.9043630, 107.6024181 -6.9024097, 107.6022553 -6.9002731, 107.5973990 -6.9003410, 107.5966529 -6.8866605, 107.5964019 -6.8859009, 107.5965851 -6.8848428, 107.5958051 -6.8740585, 107.5939263 -6.8716032, 107.5934854 -6.8699754, 107.5946452 -6.8634641, 107.5958458 -6.8630775, 107.5962188 -6.8622297, 107.5948826 -6.8612530, 107.5946588 -6.8606968, 107.5949132 -6.8589198, 107.5952489 -6.8589775, 107.5951942 -6.85933)', 4326)),
    ('Abdul Muis - Elang', 'RTE-009', 'Angkot', ST_GeomFromText('LINESTRING(107.6058121 -6.9276265, 107.6036864 -6.9272407, 107.6033744 -6.931473, 107.6017602 -6.9312152, 107.6007631 -6.9302182, 107.5973515 -6.9298519, 107.5982536 -6.9267387, 107.5999085 -6.9268608, 107.5986537 -6.9232661, 107.5838813 -6.9218485, 107.581365 -6.9235374, 107.5808156 -6.9215026, 107.5808495 -6.9206276, 107.5773972 -6.9205463, 107.5768885 -6.9224115, 107.5755591 -6.9220859, 107.5751042 -6.923662)', 4326)),
    ('Cicaheum - Ledeng', 'RTE-010', 'Angkot', ST_GeomFromText('LINESTRING(107.6562486 -6.9024172, 107.6562378 -6.9021468, 107.647668 -6.901582, 107.644412 -6.900063, 107.634157 -6.89777, 107.633967 -6.899575, 107.634985 -6.901921, 107.632489 -6.903386, 107.630047 -6.906628, 107.626154 -6.90108, 107.615926 -6.901379, 107.614922 -6.900646, 107.611883 -6.899981, 107.609333 -6.899385, 107.609265 -6.898706, 107.609591 -6.896332, 107.60841 -6.894135, 107.608004 -6.891775, 107.608343 -6.887841, 107.610418 -6.887719, 107.611653 -6.886823, 107.611408 -6.88487, 107.610418 -6.884449, 107.608573 -6.884938, 107.607841 -6.884599, 107.606593 -6.884694, 107.605345 -6.883296, 107.604856 -6.883418, 107.603893 -6.887814, 107.6019263 -6.8879085, 107.6017296 -6.8875083, 107.6013498 -6.8875558, 107.6005698 -6.887332, 107.6004477 -6.8886003, 107.5998712 -6.8900518, 107.5983994 -6.8893532, 107.5967377 -6.8876983, 107.5966631 -6.8866877, 107.5963782 -6.8858873, 107.5965749 -6.8848971, 107.5958152 -6.8740653, 107.5938551 -6.8714811, 107.5934888 -6.8701857, 107.5945944 -6.8635116, 107.5958288 -6.8631318, 107.5962154 -6.8622161, 107.5949945 -6.8613954, 107.5946554 -6.8607647, 107.5949165 -6.8589164, 107.5952489 -6.8589775, 107.5951942 -6.85933)', 4326)),
    ('Kiara Artha - Leuwipanjang  (Cicaheum - Cibaduyut)', 'RTE-011', 'Angkot', ST_GeomFromText('LINESTRING(107.6438226 -6.9146708, 107.644443 -6.927074, 107.643900 -6.931008, 107.643086 -6.931904, 107.641784 -6.945496, 107.626754 -6.949593, 107.595201 -6.947368, 107.5751042 -6.923662)', 4326)),
    ('Kalapa - Buah Batu', 'RTE-012', 'Angkot', ST_GeomFromText('LINESTRING(107.6058121 -6.9276265, 107.606393 -6.922381, 107.611832 -6.923046, 107.611697 -6.925053, 107.613189 -6.927264, 107.617068 -6.929123, 107.617014 -6.930222, 107.617326 -6.931049, 107.618045 -6.931944, 107.619347 -6.931375, 107.620256 -6.931646, 107.624814 -6.934956, 107.622739 -6.937045, 107.638651 -6.953377, 107.639573 -6.957894, 107.6379086 -6.9657162)', 4326)),
    ('Kalapa - Sukajadi', 'RTE-013', 'Angkot', ST_GeomFromText('LINESTRING(107.6058121 -6.9276265, 107.606393 -6.922381, 107.6075864 -6.922503, 107.6076542 -6.9212415, 107.6064334 -6.921038, 107.6066707 -6.9188811, 107.6061417 -6.9165479, 107.6065012 -6.9161274, 107.6064876 -6.915422, 107.6044868 -6.9158697, 107.6045953 -6.9147438, 107.6066097 -6.9149947, 107.6069692 -6.9153745, 107.6071455 -6.9144996, 107.6067453 -6.9147641, 107.6045681 -6.9144589, 107.6046495 -6.9127565, 107.5979823 -6.9123699, 107.5976228 -6.906564, 107.6044054 -6.9071134, 107.6042901 -6.9043596, 107.6031506 -6.9044139, 107.6024655 -6.9045292, 107.6021332 -6.9048751, 107.6014346 -6.9048412, 107.6013261 -6.9040476, 107.6010616 -6.9040273, 107.6009327 -6.9037424, 107.6009937 -6.9034983, 107.5985384 -6.9011786, 107.5983892 -6.9012939, 107.5982400 -6.9011786, 107.5982129 -6.9003308, 107.5973718 -6.9003715, 107.5972972 -6.8967564, 107.5982739 -6.8959153, 107.5998543 -6.8900755, 107.5982943 -6.8892752, 107.5967275 -6.887722, 107.5966597 -6.8867114, 107.5963884 -6.8859007, 107.5965579 -6.884914, 107.5965274 -6.8840187, 107.596703 -6.8840134)', 4326)),
    ('Ciwastra - Ujungberung', 'RTE-014', 'Angkot', ST_GeomFromText('LINESTRING(107.6664238 -6.9611563, 107.6728008 -6.9623032, 107.6727533 -6.9637478, 107.6765245 -6.9640666, 107.677596 -6.955351, 107.6763074 -6.955195, 107.6765109 -6.9502437, 107.6760632 -6.9501488, 107.6761718 -6.9468796, 107.6760022 -6.945462, 107.6761582 -6.9437257, 107.6771213 -6.9436443, 107.6773485 -6.9380622, 107.692569 -6.93695, 107.692989 -6.932392, 107.697520 -6.921404, 107.6993851 -6.9140859, 107.7028132 -6.9140461)', 4326)),
    ('Cisitu - Tegallega', 'RTE-015', 'Angkot', ST_GeomFromText('LINESTRING(107.6120709 -6.8796668, 107.6116661 -6.8828792, 107.6112524 -6.8829199, 107.6112524 -6.8838491, 107.6121477 -6.8850225, 107.6128802 -6.8851582, 107.6128938 -6.8854091, 107.6123172 -6.8862298, 107.6116932 -6.8863180, 107.6114287 -6.8848394, 107.6103842 -6.8844528, 107.6085868 -6.8849411, 107.6078272 -6.8845749, 107.6068030 -6.8846834, 107.6060637 -6.8841815, 107.6053787 -6.8833201, 107.6048496 -6.8834015, 107.6039272 -6.8874168, 107.604219 -6.891846, 107.603890 -6.895702, 107.604378 -6.904356, 107.6049751 -6.9043156, 107.6055855 -6.9039832, 107.607491 -6.905414, 107.607790 -6.906418, 107.607505 -6.907815, 107.606230 -6.907151, 107.604480 -6.907205, 107.604412 -6.909213, 107.604100 -6.910108, 107.603897 -6.912672, 107.597969 -6.912387, 107.598267 -6.916375, 107.602201 -6.916239, 107.602106 -6.920607, 107.598308 -6.920200, 107.598661 -6.923307, 107.603856 -6.923917, 107.603205 -6.933860, 107.6027695 -6.9338128)', 4326)),
    ('Mengger - Soekarno Hatta (Mengger - Kalapa)', 'RTE-016', 'Angkot', ST_GeomFromText('LINESTRING(107.6229457 -6.9619679, 107.622901 -6.95842, 107.622603 -6.95781, 107.622684 -6.956575, 107.622305 -6.956236, 107.622386 -6.954893, 107.621993 -6.953591, 107.621640 -6.95351, 107.6213965 -6.949255)', 4326)),
    ('Cicadas - Kalapa', 'RTE-017', 'Angkot', ST_GeomFromText('LINESTRING(107.6434964 -6.9113612, 107.644484 -6.926976, 107.643914 -6.930964, 107.643046 -6.931887, 107.63941 -6.93011, 107.638311 -6.92893, 107.632329 -6.925674, 107.622427 -6.923002, 107.620093 -6.922676, 107.619849 -6.923015, 107.620012 -6.924046, 107.619456 -6.927017, 107.619483 -6.928061, 107.617638 -6.928577, 107.617096 -6.929214, 107.6131617 -6.9273017, 107.612768 -6.93074, 107.61133 -6.93249, 107.605416 -6.93169, 107.6058121 -6.9276265)', 4326)),
    ('Elang - Kalapa', 'RTE-018', 'Angkot', ST_GeomFromText('LINESTRING(107.5761151 -6.9132715, 107.586181 -6.916049, 107.598226 -6.916429, 107.604521 -6.915859, 107.603354 -6.931514, 107.605402 -6.931731, 107.6058121 -6.9276265)', 4326)),
    ('Kalapa - Karangsetra', 'RTE-019', 'Angkot', ST_GeomFromText('LINESTRING(107.6058121 -6.9276265, 107.6058365 -6.9274102, 107.6036593 -6.9272271, 107.6033608 -6.9314391, 107.6017737 -6.9312152, 107.6008309 -6.9302589, 107.6006343 -6.9289431, 107.598803 -6.9238901, 107.5983214 -6.9201461, 107.596212 -6.8782976, 107.5957305 -6.8778432, 107.5951336 -6.8786774, 107.5951798 -6.8790317)', 4326)),
    ('Cibaduyut - Kalapa', 'RTE-020', 'Angkot', ST_GeomFromText('LINESTRING(107.5936395 -6.961841825, 107.5940484 -6.9608483, 107.5934922 -6.9600073, 107.5935465 -6.958922, 107.5932141 -6.9581081, 107.5930717 -6.9565888, 107.593499 -6.9550967, 107.5932548 -6.9541268, 107.5932955 -6.9528449, 107.5944892 -6.9483005, 107.5951404 -6.9478800, 107.5952828 -6.945852, 107.5946859 -6.9457876, 107.5944892 -6.9456282, 107.5940179 -6.9455366, 107.5938754 -6.9453535, 107.5931531 -6.9452314, 107.592719 -6.9443361, 107.5918305 -6.9438681, 107.5916609 -6.9438613, 107.5910166 -6.9435595, 107.595039 -6.937001, 107.597046 -6.937747, 107.601089 -6.937204, 107.606176 -6.937543, 107.606596 -6.931873, 107.605430 -6.931697, 107.6058121 -6.9276265)', 4326));

-- Sample Data untuk Table objek_wisata. Atribut luas_km2ny blm dimasukkan karena bisa dihitung dari data geometrinya menggunakan fungsi ST_Area(geom) / 1000000 untuk mendapatkan luas dalam km2.
INSERT INTO objek_wisata (nama_wisata, kode_wisata, deskripsi, geom)
VALUES 
    ('Gedung Sate', 'WST-001', 'Gedung Sate merupakan salah satu ikon arsitektur paling bersejarah dan terkenal di Kota Bandung. Berdiri sejak tahun 1920-an pada masa pemerintahan kolonial Belanda, bangunan megah ini memadukan gaya arsitektur tradisional Indonesia dengan elemen modern Barat. Saat ini, gedung tersebut berfungsi aktif sebagai pusat pemerintahan atau Kantor Gubernur Provinsi Jawa Barat.', ST_GeomFromText('POLYGON((107.61696849162047 -6.90140484206635, 107.61708650881559 -6.903178246721071, 107.61763367944955 -6.903614939942753, 107.6196775227026 -6.903577661266477, 107.6209810762721 -6.902640367935175, 107.62012276939267 -6.902065209739338, 107.61967215828675 -6.901378214314305, 107.61696849162047 -6.90140484206635))', 4326)),
    ('Grand Mosque of Bandung', 'WST-002', 'Grand Mosque of Bandung atau yang lebih dikenal sebagai Masjid Raya Bandung merupakan pusat kegiatan keagamaan sekaligus salah satu tengara (landmark) paling ikonik di jantung Kota Bandung. Berdiri megah tepat di alun-alun kota, masjid bersejarah ini pertama kali dibangun pada awal abad ke-19 dan telah mengalami beberapa kali renovasi besar hingga tampil modern seperti saat ini. Tempat ini selalu ramai dikunjungi warga maupun wisatawan untuk beribadah sekaligus bersantai.', ST_GeomFromText('POLYGON((107.60582310658884 -6.921331754469017, 107.60641044317026 -6.921552722750231, 107.60652041373945 -6.921275805900287, 107.60680346483885 -6.921375059835921, 107.60644666900198 -6.9222596750221514, 107.60605433565544 -6.92204435630789, 107.60564605380009 -6.921762541960395, 107.60582310658884 -6.921331754469017))', 4326)),
    ('Bandung City Square', 'WST-003', 'Bandung City Square atau Alun-Alun Kota Bandung merupakan pusat ruang publik terbuka yang terletak tepat di jantung kota. Kawasan ini terintegrasi langsung dengan Masjid Raya Bandung, menjadikannya salah satu destinasi wisata gratis dan tempat berkumpul paling favorit bagi warga lokal maupun wisatawan yang berkunjung ke Bandung.', ST_GeomFromText('POLYGON((107.6069079573203 -6.9213313135603, 107.60759073625876 -6.921446163535847, 107.60743711099823 -6.922449687537545, 107.60646415101196 -6.922306596065563, 107.6069079573203 -6.9213313135603))', 4326)),
    ('Trans Studio Bandung', 'WST-004', 'Trans Studio Bandung merupakan salah satu taman bermain dalam ruangan (indoor theme park) terbesar di Indonesia, bahkan di dunia. Terletak di dalam kawasan terpadu Trans Studio Mall (TSM) Bandung, tempat rekreasi ini menjadi destinasi favorit keluarga dan anak muda karena menawarkan keseruan bermain tanpa perlu khawatir dengan cuaca hujan atau panas.', ST_GeomFromText('POLYGON((107.63483562466232 -6.926857754316776, 107.6364432344718 -6.9277380182781405, 107.63687703394311 -6.926686767599636, 107.63725341877998 -6.925046558544096, 107.63734910983995 -6.924058630647512, 107.63588184691905 -6.9232923518173655, 107.63557563552659 -6.925261875887524, 107.63483562466232 -6.926857754316776))', 4326)),
    ('Bandung Zoological Garden', 'WST-005', 'Bandung Zoological Garden atau yang lebih dikenal sebagai Kebun Binatang Bandung merupakan salah satu destinasi wisata edukasi dan konservasi satwa tertua di Kota Bandung, yang sudah berdiri sejak tahun 1933 pada masa kolonial Belanda. Terletak strategis di kawasan Coblong dan sangat dekat dengan area kampus ITB, tempat ini menawarkan suasana yang rindang karena dikelilingi oleh pepohonan hijau yang rimbun.', ST_GeomFromText('POLYGON((107.60535650024899 -6.887903590796397, 107.60534747840934 -6.889202314309351, 107.60582563591113 -6.8907607778333935, 107.60616846581904 -6.891728097441195, 107.60786457167488 -6.893725427051843, 107.60836979469877 -6.893653774118253, 107.6079187027154 -6.891853490578858, 107.60800892111027 -6.888772392442467, 107.60686314747012 -6.88832455674221, 107.60535650024899 -6.887903590796397))', 4326)),
    ('Ade Irma Suryani Nasution Traffic Garden', 'WST-006', 'Ade Irma Suryani Nasution Traffic Garden atau yang lebih akrab dikenal sebagai Taman Lalu Lintas Bandung merupakan salah satu taman edukasi tertua di Indonesia yang didirikan sejak tahun 1958. Taman ini dinamai sebagai bentuk penghormatan kepada Ade Irma Suryani Nasution, putri Jenderal A.H. Nasution. Terletak di pusat Kota Bandung, taman ini berfungsi sebagai ruang terbuka hijau sekaligus pusat edukasi keselamatan berlalu lintas sejak dini bagi anak-anak.', ST_GeomFromText('POLYGON((107.61251477786561 -6.909793056570425, 107.61247012090563 -6.910046378012875, 107.61254986345561 -6.910454860570445, 107.61257219136961 -6.911183161929111, 107.61302193935241 -6.91247826896435, 107.61319418326107 -6.912528933225975, 107.6143903215123 -6.912126785497442, 107.61370772528173 -6.910331365878201, 107.61251477786561 -6.909793056570425))', 4326)),
    ('NuArt Sculpture Park', 'WST-007', 'NuArt Sculpture Park merupakan sebuah ruang seni dan galeri terbuka yang didirikan oleh maestro patung kenamaan Indonesia, Nyoman Nuarta—seniman besar di balik mahakarya Garuda Wisnu Kencana (GWK) di Bali dan Istana Garuda di Ibu Kota Nusantara (IKN). Terletak di kawasan Bandung Utara yang sejuk, tempat ini memadukan keindahan karya seni patung kontemporer dengan lanskap alam yang asri.', ST_GeomFromText('POLYGON((107.57169226618497 -6.877977199286948, 107.57167330010371 -6.878052517645031, 107.57159174595301 -6.878078879067555, 107.57155571039861 -6.878182441784723, 107.5719477073613 -6.878284065288709, 107.57205901171479 -6.87789395955707, 107.57169226618497 -6.877977199286948))', 4326)),
    ('Taman Lansia', 'WST-008', 'Taman Lansia (Taman Lanjut Usia) merupakan salah satu ruang terbuka hijau yang sangat populer di Kota Bandung. Terletak sangat strategis di dekat Gedung Sate dan bersebelahan dengan Taman Kandaga Puspa, taman ini menawarkan suasana yang sejuk, rindang, dan asri di tengah hiruk-pikuk pusat kota. Meskipun dinamakan "Taman Lansia", tempat ini dikunjungi oleh semua kalangan usia, mulai dari anak-anak, remaja, hingga keluarga yang ingin menyegarkan pikiran.', ST_GeomFromText('POLYGON((107.62156393995333 -6.903017701010471, 107.62185739253978 -6.902732708734849, 107.62124496975667 -6.9021120582993465, 107.62083349819794 -6.901326744336324, 107.61979046564181 -6.90135207706627, 107.62000417567654 -6.901855564770914, 107.62016366077765 -6.901988561433053, 107.62064849548071 -6.902200722698485, 107.62156393995333 -6.903017701010471))', 4326)),
    ('Teras Cikapundung BBWS', 'WST-009', 'Teras Cikapundung BBWS merupakan sebuah objek wisata ruang terbuka hijau yang terletak di sepanjang bantaran Sungai Cikapundung, Babakan Siliwangi, Bandung. Dikelola oleh Balai Besar Wilayah Sungai (BBWS) Citarum, kawasan ini berhasil direvitalisasi dari bantaran sungai kumuh menjadi ruang publik yang estetik, asri, dan ramah lingkungan yang memadukan konsep alam, edukasi, dan budaya lokal.', ST_GeomFromText('POLYGON((107.6062263873881 -6.88410686180365, 107.60726644636341 -6.883920705875928, 107.60761829811125 -6.884538724765536, 107.60676347880369 -6.8845835087116525, 107.60663942850812 -6.8845342463706185, 107.6062469784813 -6.884238672216434, 107.6062263873881 -6.88410686180365))', 4326)),
    ('Babakan Siliwangi City Forest', 'WST-010', 'Babakan Siliwangi City Forest (sering disingkat Babsil) merupakan salah satu oasis hijau terpenting di Bandung yang berfungsi sebagai paru-paru kota sekaligus ruang terbuka hijau publik yang menyajikan petualangan alam di tengah area urban.', ST_GeomFromText('POLYGON((107.61019362809188 -6.885118360262294, 107.61110557914904 -6.885001194131767, 107.61119409204642 -6.884796153335914, 107.61063082816025 -6.8845272035863685, 107.60965222182493 -6.884639992011254, 107.6091111114051 -6.884872991818582, 107.6091084291982 -6.885078032583505, 107.61019362809188 -6.885118360262294))', 4326)),
    ('Monumen Bandung Lautan Api', 'WST-011', 'Bandung Lautan Api Monument merupakan salah satu monumen bersejarah paling penting di Kota Bandung yang berdiri megah di tengah Lapangan Tegallega. Monumen setinggi sekitar 15 meter ini dibangun untuk memperingati peristiwa heroik "Bandung Lautan Api" pada tanggal 24 Maret 1946, sebuah peristiwa di mana ratusan ribu warga Bandung dengan sengaja membakar rumah dan kota mereka sebelum mengungsi, demi mencegah tentara Sekutu dan NICA menggunakan Bandung sebagai markas militer mereka.', ST_GeomFromText('POLYGON((107.60604417141076 -6.937269496896586, 107.60625659152402 -6.933406133350896, 107.60540691106816 -6.932336736673436, 107.60501241657093 -6.932193648201799, 107.60428411903898 -6.932314143760007, 107.60341926571968 -6.9332178594648415, 107.60322960490386 -6.937066162768986, 107.60604417141076 -6.937269496896586))', 4326)),
    ('Monumen Perjuangan Rakyat Jawa Barat', 'WST-012', 'Monumen Perjuangan Rakyat Jawa Barat (sering disingkat Monju) merupakan monumen megah yang berdiri di kawasan Dipati Ukur, Bandung, tepat berada dalam satu garis lurus dengan Gedung Sate dan Lapangan Gasibu. Monumen ini dibangun untuk menghormati serta mengenang sejarah perjuangan rakyat Jawa Barat dalam merebut dan mempertahankan kemerdekaan Indonesia dari masa kolonial hingga pasca-kemerdekaan.', ST_GeomFromText('POLYGON((107.61799695233256 -6.892448993138594, 107.6191484410933 -6.892462821773927, 107.6191902289932 -6.893873340374604, 107.6188977137033 -6.8941360835717935, 107.6188240123253 -6.894061441143627, 107.61889088266756 -6.899162756559559, 107.618498848545 -6.89916823818545, 107.61824840864833 -6.893975840613653, 107.61807440077678 -6.893907392575732, 107.61799695233256 -6.892448993138594))', 4326)),
    ('Museum Geologi Bandung', 'WST-013', 'Museum Geologi Bandung merupakan salah satu museum tertua dan paling bersejarah di Indonesia yang terletak di Jalan Diponegoro, sangat dekat dengan Gedung Sate. Didirikan pada tanggal 16 Mei 1929 dengan nama Geologisch Laboratorium semasa pemerintahan kolonial Belanda, museum ini berfungsi sebagai pusat dokumentasi, penelitian, dan edukasi mengenai materi kegeologian serta peninggalan fosil purbakala.', ST_GeomFromText('POLYGON((107.62083805765567 -6.899323255857888, 107.62205621985268 -6.899284494920767, 107.6220718373171 -6.901051990420362, 107.62083805765845 -6.901082999054215, 107.62083805765567 -6.899323255857888))', 4326)),
    ('Asia-Africa Conference Museum', 'WST-014', 'Museum of the Asian-African Conference (Museum Konferensi Asia Afrika atau MKAA) merupakan salah satu museum paling bersejarah di Indonesia yang terletak di Jalan Asia Afrika, Bandung. Museum ini menempati sebagian area dari Gedung Merdeka, gedung yang menjadi lokasi diselenggarakannya Konferensi Asia Afrika (KAA) pada 18–24 April 1955. Konferensi bersejarah tersebut berhasil mempersatukan negara-negara di Asia dan Afrika untuk melawan kolonialisme dan melahirkan semangat "Dasasila Bandung".', ST_GeomFromText('POLYGON((107.60940852616196 -6.92080576602763, 107.60982347506946 -6.920881265869003, 107.60973875495243 -6.921396180705111, 107.60933590215215 -6.921344689246451, 107.60940852616196 -6.92080576602763))', 4326)),
    ('Farmhouse Susu Lembang', 'WST-015', 'Farmhouse Susu Lembang merupakan salah satu destinasi wisata keluarga paling populer yang terletak di jalur utama menuju Lembang, Kabupaten Bandung Barat. Tempat wisata ini mengusung konsep rekreasi edukatif berlatar arsitektur perkebunan dan pedesaan bergaya Eropa abad pertengahan yang dipadukan dengan keindahan alam pegunungan yang sejuk.', ST_GeomFromText('POLYGON((107.60538101995374 -6.832329565528683, 107.60575717623496 -6.8329556823157445, 107.60573089663798 -6.833445792711034, 107.60478638577577 -6.832973125576245, 107.60538101995374 -6.832329565528683))', 4326)),
    ('The Great Asia Africa', 'WST-016', 'The Great Asia Africa merupakan kawasan wisata edukasi budaya terbesar di Lembang, Kabupaten Bandung Barat, yang terletak tepat di seberang Farmhouse Susu Lembang. Tempat rekreasi ini menawarkan pengalaman unik berupa "keliling dunia dalam satu hari" dengan menghadirkan replika arsitektur, lanskap, kuliner, dan budaya dari berbagai negara ikonik di benua Asia dan Afrika.', ST_GeomFromText('POLYGON((107.60455017563761 -6.833006524915092, 107.60197995013083 -6.833044956936752, 107.60123966044686 -6.8325389567606605, 107.60259279823727 -6.830799508819425, 107.60399149666347 -6.831262462665885, 107.60455017563761 -6.833006524915092))', 4326)),
    ('Gua Belanda', 'WST-017', 'Gua Belanda merupakan salah satu objek wisata sejarah yang sangat ikonik di Kota Bandung, terletak di dalam kawasan Taman Hutan Raya (Tahura) Ir. H. Djuanda, Dago Pakar. Terowongan bersejarah ini dibangun pertama kali pada tahun 1906 oleh pemerintah kolonial Hindia Belanda dan awalnya berfungsi sebagai terowongan penyadapan aliran air Sungai Cikapundung untuk pembangkit listrik tenaga air (PLTA) Bengkok.', ST_GeomFromText('POLYGON((107.63848315166527 -6.852206796041225, 107.63968247961883 -6.853606572013514, 107.63818969908185 -6.855228026820782, 107.63733485894544 -6.854651650938289, 107.63708606219028 -6.852846513168669, 107.63848315166527 -6.852206796041225))', 4326)),
    ('Curug Dago', 'WST-018', 'Curug Dago merupakan salah satu air terjun tersembunyi yang memiliki nilai sejarah tinggi di Kota Bandung. Terletak di kawasan Bukit Dago, tepatnya di dalam wilayah Taman Hutan Raya (Tahura) Ir. H. Djuanda, air terjun dengan ketinggian sekitar 10-12 meter ini terbentuk dari aliran Sungai Cikapundung yang membelah batuan beku vulkanik purba.', ST_GeomFromText('POLYGON((107.61803387645797 -6.865507025808419, 107.61848732163472 -6.865296331281606, 107.61855974127678 -6.865445457988523, 107.61815070440744 -6.865868871062152, 107.61803387645797 -6.865507025808419))', 4326)),
    ('Panghega Waterboom', 'WST-019', 'Panghegar Waterboom merupakan salah satu destinasi wisata permainan air (waterpark) keluarga yang sangat populer di Bandung bagian selatan. Terletak di kawasan Bandung Kidul (dekat dengan area Moh. Toha), tempat rekreasi ini menjadi pilihan favorit warga Bandung dan sekitarnya untuk menghabiskan waktu liburan bersama anak-anak tanpa harus menempuh perjalanan jauh ke area Lembang atau Ciwidey.', ST_GeomFromText('POLYGON((107.6226299478369 -6.9612193701662335, 107.6221326137092 -6.961222741360462, 107.62211795321993 -6.961448863496029, 107.6225993259344 -6.96151469119759, 107.6226299478369 -6.9612193701662335))', 4326)),
    ('Margacinta Park', 'WST-020', 'Margacinta Park merupakan salah satu destinasi wisata rekreasi keluarga terpadu yang sangat populer di kawasan Bandung Timur. Terletak di Jalan Margacinta, Buahbatu, tempat ini menjadi pilihan favorit bagi warga lokal karena menggabungkan fasilitas taman bermain air modern (waterpark) dan area bermain anak dalam ruangan (indoor playground) di satu lokasi yang strategis dan mudah dijangkau.', ST_GeomFromText('POLYGON((107.64784404358267 -6.953917574938506, 107.64836956574335 -6.954047429289094, 107.64822747176862 -6.954900437138818, 107.64765684040992 -6.95477729961845, 107.64784404358267 -6.953917574938506))', 4326));

-- Update Otomatis Atribut Luas Menggunakan Fungsi Spasial PostGIS (Satuan: KM persegi)
UPDATE objek_wisata SET luas_km2 = ROUND((ST_Area(geom::geography) / 1000000)::numeric, 2);

-- Update Otomatis Atribut Panjang Jalur Menggunakan Fungsi Spasial PostGIS (Satuan: KM)
UPDATE rute SET panjang_km = ROUND((ST_Length(geom::geography) / 1000)::numeric, 2);

-- =========================================================================
-- QUERY ANALISIS SPASIAL UTAMA (Core GIS Logic)
-- =========================================================================

--- QUERY: MENCARI OBJEK WISATA TERDEKAT DARI HALTE YANG DIKLIK (RADIUS 5 KM)
--- Menggunakan logi fallback: Jika radius 5 KM kosong, otomatis beri 1 rekomendasi terdekat absolut mutlak.
WITH halte_terpilih AS (
    SELECT geom FROM halte WHERE id_halte = 59 -- Simulasi "Halte Bandros Alun-alun" diklik di frontend
),
wisata_dalam_radius AS (
    SELECT 
        w.id_wisata, w.nama_wisata,
        ROUND(ST_Distance(w.geom::geography, h.geom::geography)::numeric) AS jarak_meter
    FROM objek_wisata w, halte_terpilih h
    WHERE ST_DWithin(w.geom::geography, h.geom::geography, 5000) -- Radius batasan 5 Kilometer
),
wisata_terdekat_absolut AS (
    SELECT 
        w.id_wisata, w.nama_wisata,
        ROUND(ST_Distance(w.geom::geography, h.geom::geography)::numeric) AS jarak_meter
    FROM objek_wisata w, halte_terpilih h
    ORDER BY jarak_meter ASC LIMIT 1
)
SELECT * FROM wisata_dalam_radius
UNION
SELECT * FROM wisata_terdekat_absolut WHERE NOT EXISTS (SELECT 1 FROM wisata_dalam_radius)
ORDER BY jarak_meter ASC;