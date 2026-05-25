from fastapi import APIRouter, HTTPException, status
from database import get_pool
from models import ObjekWisataCreate, ObjekWisataUpdate
import json

router = APIRouter(prefix="/api/objek-wisata", tags=["CRUD - Objek Wisata"])

# --- POST / CREATE OBJEK WISATA ---
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_wisata(wisata: ObjekWisataCreate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        try:
            # Mengubah koordinat 3D Pydantic menjadi format WKT POLYGON
            # Contoh hasil WKT: 'POLYGON((107 -6, 108 -6, 108 -7, 107 -7, 107 -6))'
            rings_wkt = []
            for ring in wisata.geom:
                ring_str = ", ".join([f"{pt[0]} {pt[1]}" for pt in ring])
                rings_wkt.append(f"({ring_str})")
            polygon_wkt = f"POLYGON({', '.join(rings_wkt)})"

            row = await conn.fetchrow("""
                INSERT INTO objek_wisata (nama_wisata, kode_wisata, deskripsi, luas_km2, geom)
                VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326))
                RETURNING id_wisata
            """, wisata.nama_wisata, wisata.kode_wisata, wisata.deskripsi, wisata.luas_km2, polygon_wkt)
            
            return {"message": "Objek wisata berhasil ditambahkan", "id_wisata": row["id_wisata"]}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Gagal menyimpan data: {str(e)}")

# --- GET ALL OBJEK WISATA ---
@router.get("/")
async def get_all_wisata():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id_wisata, nama_wisata, kode_wisata, deskripsi, luas_km2, 
                   ST_AsGeoJSON(geom) AS geom 
            FROM objek_wisata
        """)
        
        result = []
        for row in rows:
            data = dict(row)
            if data["luas_km2"]:
                data["luas_km2"] = float(data["luas_km2"]) # Konversi DECIMAL Postgre ke Float Python
            if data["geom"]:
                data["geom"] = json.loads(data["geom"])
            result.append(data)
        return result

# --- GET OBJEK WISATA BY ID ---
@router.get("/{id}")
async def get_wisata_by_id(id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id_wisata, nama_wisata, kode_wisata, deskripsi, luas_km2, 
                   ST_AsGeoJSON(geom) AS geom 
            FROM objek_wisata 
            WHERE id_wisata = $1
        """, id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Objek wisata tidak ditemukan")
            
        data = dict(row)
        if data["luas_km2"]:
            data["luas_km2"] = float(data["luas_km2"])
        if data["geom"]:
            data["geom"] = json.loads(data["geom"])
        return data

# --- GET GEOJSON (Untuk Layer GIS / Leaflet / Mapbox) ---
@router.get("/data/geojson")
async def get_wisata_geojson():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id_wisata, nama_wisata, kode_wisata, deskripsi, luas_km2, 
                   ST_AsGeoJSON(geom) AS geom_json 
            FROM objek_wisata
            WHERE geom IS NOT NULL  -- Pengaman agar tidak ada data null yang lolos ke frontend
        """)
        
        features = []
        for row in rows:
            feature = {
                "type": "Feature",
                "geometry": json.loads(row["geom_json"]) if row["geom_json"] else None,
                "properties": {
                    "id_wisata": row["id_wisata"],
                    "nama_wisata": row["nama_wisata"],
                    "kode_wisata": row["kode_wisata"],
                    "deskripsi": row["deskripsi"],
                    "luas_km2": float(row["luas_km2"]) if row["luas_km2"] else 0.0
                }
            }
            features.append(feature)
        return {"type": "FeatureCollection", "features": features}

# --- GET HALTE TERDEKAT DARI OBJEK WISATA ---
@router.get("/{id}/halte-terdekat")
async def get_halte_terdekat_dari_wisata(id: int, radius_m: float = 5000.0):
    """
    Mencari halte dalam radius tertentu (default 5000 meter). 
    Jika tidak ada di dalam radius, sistem otomatis mencari 1 halte terdekat.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Cek apakah objek wisata ada
        wisata_exists = await conn.fetchval("SELECT id_wisata FROM objek_wisata WHERE id_wisata = $1", id)
        if not wisata_exists:
            raise HTTPException(status_code=404, detail="Objek wisata tidak ditemukan")

        rows = await conn.fetch("""
            WITH ref_wisata AS (
                -- Ambil geometri (Polygon) objek wisata
                SELECT geom::geography AS ref_geom FROM objek_wisata WHERE id_wisata = $1
            ),
            dalam_radius AS (
                -- Cari halte yang masuk dalam radius polygon objek wisata
                SELECT h.id_halte, h.nama, h.kode, h.jenis, h.alamat,
                       ROUND(ST_Distance(h.geom::geography, r.ref_geom)::numeric, 2) AS jarak_meter
                FROM halte h, ref_wisata r
                WHERE ST_DWithin(h.geom::geography, r.ref_geom, $2)
            ),
            satu_terdekat_absolut AS (
                -- Cari 1 halte yang paling menempel/dekat dengan polygon wisata
                SELECT h.id_halte, h.nama, h.kode, h.jenis, h.alamat,
                       ROUND(ST_Distance(h.geom::geography, r.ref_geom)::numeric, 2) AS jarak_meter
                FROM halte h, ref_wisata r
                ORDER BY ST_Distance(h.geom::geography, r.ref_geom) ASC
                LIMIT 1
            )
            -- Gabungkan hasil
            SELECT * FROM dalam_radius
            UNION ALL
            -- Tampilkan yang terdekat HANYA JIKA tidak ada halte di dalam radius
            SELECT * FROM satu_terdekat_absolut 
            WHERE NOT EXISTS (SELECT 1 FROM dalam_radius)
            
            ORDER BY jarak_meter ASC;
        """, id, radius_m)
        
        return [dict(row) for row in rows]

# --- PUT / UPDATE OBJEK WISATA ---
@router.put("/{id}")
async def update_wisata(id: int, wisata: ObjekWisataUpdate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id_wisata FROM objek_wisata WHERE id_wisata = $1", id)
        if not existing:
            raise HTTPException(status_code=404, detail="Objek wisata tidak ditemukan")

        update_data = wisata.model_dump(exclude_unset=True)
        if not update_data:
            return {"message": "Tidak ada data yang diubah"}

        geom = update_data.pop("geom", None)
        set_clauses = []
        values = []
        param_idx = 1

        # Penanganan khusus update Geometri Polygon
        if geom:
            rings_wkt = []
            for ring in geom:
                ring_str = ", ".join([f"{pt[0]} {pt[1]}" for pt in ring])
                rings_wkt.append(f"({ring_str})")
            polygon_wkt = f"POLYGON({', '.join(rings_wkt)})"
            
            set_clauses.append(f"geom = ST_GeomFromText(${param_idx}, 4326)")
            values.append(polygon_wkt)
            param_idx += 1

        # Penanganan field biasa
        for key, value in update_data.items():
            set_clauses.append(f"{key} = ${param_idx}")
            values.append(value)
            param_idx += 1

        if set_clauses:
            values.append(id)
            query = f"UPDATE objek_wisata SET {', '.join(set_clauses)} WHERE id_wisata = ${param_idx}"
            await conn.execute(query, *values)

        return {"message": f"Data objek wisata dengan ID {id} berhasil diperbarui"}

# --- 6. DELETE OBJEK WISATA ---
@router.delete("/{id}")
async def delete_wisata(id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM objek_wisata WHERE id_wisata = $1", id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Objek wisata tidak ditemukan")
        return {"message": "Objek wisata berhasil dihapus"}