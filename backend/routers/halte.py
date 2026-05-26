from fastapi import APIRouter, HTTPException
from database import get_pool
from models import HalteCreate, HalteUpdate
import json

router = APIRouter(prefix="/api/halte", tags=["CRUD - Halte"])

# --- POST (Create Halte Baru) ---
@router.post("/")
async def create_halte(halte: HalteCreate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow("""
                INSERT INTO halte (nama, kode, jenis, alamat, fasilitas, geom)
                VALUES ($1, $2, $3::jenis_halte, $4, $5, ST_SetSRID(ST_Point($6, $7), 4326))
                RETURNING id_halte
            """, halte.nama, halte.kode, halte.jenis, halte.alamat, halte.fasilitas, halte.longitude, halte.latitude)
            
            return {"message": "Halte berhasil ditambahkan", "id": row["id_halte"]}
            
        except Exception as e:
            # Mengantisipasi jika kode unik duplikat atau melanggar aturan ENUM
            raise HTTPException(status_code=400, detail=f"Gagal menyimpan data: {str(e)}")

# --- GET ALL HALTE ---
@router.get("/")
async def get_halte():
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Mengambil semua field sesuai skema baru, termasuk jam_operasi dan status aktif
        rows = await conn.fetch("""
            SELECT id_halte, nama, kode, jenis, alamat, fasilitas, 
                   jam_operasi_mulai, jam_operasi_selesai, aktif, 
                   ST_AsGeoJSON(geom) AS geom 
            FROM halte
        """)
        
        result = []
        for row in rows:
            data = dict(row)
            # Konversi objek TIME Postgre dan string GeoJSON agar serialization aman
            if data["jam_operasi_mulai"]:
                data["jam_operasi_mulai"] = data["jam_operasi_mulai"].isoformat()
            if data["jam_operasi_selesai"]:
                data["jam_operasi_selesai"] = data["jam_operasi_selesai"].isoformat()
            if data["geom"]:
                data["geom"] = json.loads(data["geom"])
            result.append(data)
            
        return result

# --- GET HALTE BY ID ---
@router.get("/{id}")
async def get_halte_by_id(id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id_halte, nama, kode, jenis, alamat, fasilitas, 
                   jam_operasi_mulai, jam_operasi_selesai, aktif,
                   ST_X(geom) AS longitude, ST_Y(geom) AS latitude 
            FROM halte 
            WHERE id_halte = $1
        """, id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Halte tidak ditemukan")
            
        data = dict(row)
        if data["jam_operasi_mulai"]:
            data["jam_operasi_mulai"] = data["jam_operasi_mulai"].isoformat()
        if data["jam_operasi_selesai"]:
            data["jam_operasi_selesai"] = data["jam_operasi_selesai"].isoformat()
            
        return data

# --- GET GEOJSON (Format standar SIG untuk Mapbox/Leaflet) ---
@router.get("/data/geojson")
async def get_halte_geojson():
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Mengambil halte beserta daftar rute (nama rute) yang melewatinya
        rows = await conn.fetch("""
            SELECT h.id_halte, h.nama, h.kode, h.jenis, h.alamat, h.fasilitas, h.aktif, 
                   ST_AsGeoJSON(h.geom) AS geom,
                   COALESCE(
                       (SELECT array_agg(r.nama_rute) 
                        FROM rute_halte rh 
                        JOIN rute r ON rh.id_rute = r.id_rute 
                        WHERE rh.id_halte = h.id_halte), 
                       '{}'::character varying[]
                   ) as rute_terkait
            FROM halte h
        """)
        
        features = []
        for row in rows:
            feature = {
                "type": "Feature",
                "geometry": json.loads(row["geom"]) if row["geom"] else None,
                "properties": {
                    "id_halte": row["id_halte"],
                    "nama": row["nama"],
                    "kode": row["kode"],
                    "jenis": row["jenis"],
                    "alamat": row["alamat"],
                    "fasilitas": row["fasilitas"],
                    "aktif": row["aktif"],
                    "rute_terkait": row["rute_terkait"]
                }
            }
            features.append(feature)
            
        return {"type": "FeatureCollection", "features": features}

# --- GET NEARBY (Pencarian Radius Berbasis Spasial) ---
@router.get("/search/nearby")
async def search_nearby_halte(longitude: float, latitude: float, radius: float):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Menggunakan tipe data geography untuk kalkulasi jarak meter yang akurat
        rows = await conn.fetch("""
            SELECT id_halte, nama, kode, jenis, alamat, fasilitas, aktif,
                   ROUND(ST_Distance(geom::geography, ST_Point($1, $2)::geography)::numeric) AS jarak_m
            FROM halte
            WHERE ST_DWithin(geom::geography, ST_Point($1, $2)::geography, $3)
            ORDER BY jarak_m ASC
        """, longitude, latitude, radius)
        
        return [dict(row) for row in rows]

# --- GET WISATA TERDEKAT DARI HALTE ---
@router.get("/{id}/wisata-terdekat")
async def get_wisata_terdekat_dari_halte(id: int, radius_m: float = 5000.0):
    """
    Mencari objek wisata dalam radius tertentu (default 5000 meter). 
    Jika tidak ada di dalam radius, sistem akan otomatis mencari 1 objek wisata terdekat tanpa batasan radius.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Cek apakah halte ada
        halte_exists = await conn.fetchval("SELECT id_halte FROM halte WHERE id_halte = $1", id)
        if not halte_exists:
            raise HTTPException(status_code=404, detail="Halte tidak ditemukan")

        rows = await conn.fetch("""
            WITH ref_halte AS (
                -- Ambil koordinat halte yang menjadi titik pusat
                SELECT geom::geography AS ref_geom FROM halte WHERE id_halte = $1
            ),
            dalam_radius AS (
                -- Cari objek wisata dalam radius X meter
                SELECT o.id_wisata, o.nama_wisata, o.deskripsi, 
                       ROUND(ST_Distance(o.geom::geography, r.ref_geom)::numeric, 2) AS jarak_meter
                FROM objek_wisata o, ref_halte r
                WHERE ST_DWithin(o.geom::geography, r.ref_geom, $2)
            ),
            satu_terdekat_absolut AS (
                -- Cari 1 objek wisata paling dekat (mengabaikan radius)
                SELECT o.id_wisata, o.nama_wisata, o.deskripsi, 
                       ROUND(ST_Distance(o.geom::geography, r.ref_geom)::numeric, 2) AS jarak_meter
                FROM objek_wisata o, ref_halte r
                ORDER BY ST_Distance(o.geom::geography, r.ref_geom) ASC
                LIMIT 1
            )
            -- Gabungkan hasil
            SELECT * FROM dalam_radius
            UNION ALL
            -- Outputkan yang terdekat absolut HANYA JIKA dalam_radius kosong
            SELECT * FROM satu_terdekat_absolut 
            WHERE NOT EXISTS (SELECT 1 FROM dalam_radius)
            
            ORDER BY jarak_meter ASC;
        """, id, radius_m)
        
        return [dict(row) for row in rows]

# --- PUT / UPDATE HALTE ---
@router.put("/{id}")
async def update_halte(id: int, halte: HalteUpdate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Memasitikan halte ada di database
        existing = await conn.fetchrow("SELECT id_halte FROM halte WHERE id_halte = $1", id)
        if not existing:
            raise HTTPException(status_code=404, detail="Halte tidak ditemukan")

        # Ambil hanya data yang dikirim oleh user (tidak null/unset)
        update_data = halte.model_dump(exclude_unset=True) 
        
        if not update_data:
            return {"message": "Tidak ada data yang diubah"}

        set_clauses = []
        values = []
        param_idx = 1
        
        #Tangani update lokasi spasial jika longitude & latitude dikirim
        if "longitude" in update_data and "latitude" in update_data:
            lon = update_data.pop("longitude")
            lat = update_data.pop("latitude")
            set_clauses.append(f"geom = ST_SetSRID(ST_Point(${param_idx}, ${param_idx+1}), 4326)")
            values.extend([lon, lat])
            param_idx += 2
        elif "longitude" in update_data or "latitude" in update_data:
            raise HTTPException(status_code=400, detail="Longitude dan latitude harus diupdate bersamaan")

        #angani update atribut lainnya
        for key, value in update_data.items():
            if key == "jenis":
                # Casting khusus untuk ENUM jenis halte
                set_clauses.append(f"{key} = ${param_idx}::jenis_halte")
            else:
                set_clauses.append(f"{key} = ${param_idx}")
            values.append(value)
            param_idx += 1

        #Eksekusi query dinamis jika ada data yang akan diupdate
        if set_clauses:
            values.append(id) # Memasukkan ID untuk parameter WHERE
            query = f"""
                UPDATE halte 
                SET {', '.join(set_clauses)}
                WHERE id_halte = ${param_idx}
            """
            await conn.execute(query, *values)
            
        return {"message": f"Data halte dengan ID {id} berhasil diperbarui"}


# --- DELETE ---
@router.delete("/{id}")
async def delete_halte(id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""DELETE FROM halte WHERE id_halte = $1""", id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Halte tidak ditemukan")
        return {"message": "Halte berhasil dihapus"}