from fastapi import APIRouter, HTTPException, status
from database import get_pool
from models import RuteCreate, RuteUpdate
import json

router = APIRouter(prefix="/api/rute", tags=["CRUD - Rute"])

# --- POST (Create Rute & Relasi Halte secara Transaksional) ---
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_rute(rute: RuteCreate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Menggunakan transaction agar jika salah satu proses gagal, database akan di-rollback
        async with conn.transaction():
            try:
                # Konversi format List[List[float]] dari Pydantic menjadi format WKT LineString PostGIS
                # Contoh hasil: 'LINESTRING(107.61 -6.92, 107.62 -6.93)'
                wkt_coords = ", ".join([f"{pt[0]} {pt[1]}" for pt in rute.jalur])
                linestring_wkt = f"LINESTRING({wkt_coords})"

                # Insert ke tabel rute
                rute_row = await conn.fetchrow("""
                    INSERT INTO rute (nama_rute, kode_rute, warna_jalur, keterangan, jenis, panjang_km, estimasi_waktu, tarif, geom)
                    VALUES ($1, $2, $3, $4, $5::jenis_rute, $6, $7, $8, ST_GeomFromText($9, 4326))
                    RETURNING id_rute
                """, rute.nama_rute, rute.kode_rute, rute.warna_jalur, rute.keterangan, rute.jenis, 
                     rute.panjang_km, rute.estimasi_waktu, rute.tarif, linestring_wkt)
                
                id_rute_baru = rute_row["id_rute"]

                # Insert urutan halte ke tabel pivot rute_halte
                # Menerima daftar id_halte dari properti 'daftar_id_halte' di Pydantic
                if rute.daftar_id_halte:
                    for indeks, id_halte in enumerate(rute.daftar_id_halte):
                        urutan = indeks + 1  # Urutan dimulai dari 1
                        await conn.execute("""
                            INSERT INTO rute_halte (id_rute, id_halte, urutan)
                            VALUES ($1, $2, $3)
                        """, id_rute_baru, id_halte, urutan)

                return {"message": "Rute dan relasi halte berhasil dibuat", "id_rute": id_rute_baru}

            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Gagal membuat rute: {str(e)}")
                
# --- GET ALL RUTE ---
@router.get("/")
async def get_all_rute():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id_rute, nama_rute, kode_rute, warna_jalur, keterangan, 
                   jenis, panjang_km, estimasi_waktu, tarif, aktif, 
                   ST_AsGeoJSON(geom) AS geom 
            FROM rute
        """)
        
        result = []
        for row in rows:
            data = dict(row)
            # Konversi DECIMAL dan string GeoJSON agar aman saat serialisasi JSON
            if data["panjang_km"]:
                data["panjang_km"] = float(data["panjang_km"])
            if data["geom"]:
                data["geom"] = json.loads(data["geom"])
            result.append(data)
            
        return result

# --- GET RUTE BY ID (Lengkap dengan Detail Halte) ---
@router.get("/{id}")
async def get_rute_by_id(id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # 1. Ambil data rutenya terlebih dahulu
        rute_row = await conn.fetchrow("""
            SELECT id_rute, nama_rute, kode_rute, warna_jalur, keterangan, 
                   jenis, panjang_km, estimasi_waktu, tarif, aktif, 
                   ST_AsGeoJSON(geom) AS geom 
            FROM rute 
            WHERE id_rute = $1
        """, id)
        
        if not rute_row:
            raise HTTPException(status_code=404, detail="Rute tidak ditemukan")
            
        rute_data = dict(rute_row)
        if rute_data["panjang_km"]:
            rute_data["panjang_km"] = float(rute_data["panjang_km"])
        if rute_data["geom"]:
            rute_data["geom"] = json.loads(rute_data["geom"])

        # 2. Ambil daftar halte yang dilewati oleh rute ini berdasarkan urutan (Tabel Pivot)
        halte_rows = await conn.fetch("""
            SELECT h.id_halte, h.nama, h.kode, h.jenis, h.alamat, rh.urutan
            FROM rute_halte rh
            JOIN halte h ON rh.id_halte = h.id_halte
            WHERE rh.id_rute = $1
            ORDER BY rh.urutan ASC
        """, id)
        
        rute_data["daftar_halte"] = [dict(h) for h in halte_rows]
        return rute_data

# --- GET GEOJSON RUTE (Untuk Mapbox / Leaflet) ---
@router.get("/data/geojson")
async def get_rute_geojson():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id_rute, nama_rute, kode_rute, warna_jalur, jenis, aktif, 
                   ST_AsGeoJSON(geom) AS geom 
            FROM rute
        """)
        
        features = []
        for row in rows:
            feature = {
                "type": "Feature",
                "geometry": json.loads(row["geom"]) if row["geom"] else None,
                "properties": {
                    "id_rute": row["id_rute"],
                    "nama_rute": row["nama_rute"],
                    "kode_rute": row["kode_rute"],
                    "warna_jalur": row["warna_jalur"],
                    "jenis": row["jenis"],
                    "aktif": row["aktif"]
                }
            }
            features.append(feature)
            
        return {"type": "FeatureCollection", "features": features}

# --- PUT / UPDATE RUTE ---
@router.put("/{id}")
async def update_rute(id: int, rute: RuteUpdate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            #Cek eksistensi rute
            existing = await conn.fetchrow("SELECT id_rute FROM rute WHERE id_rute = $1", id)
            if not existing:
                raise HTTPException(status_code=404, detail="Rute tidak ditemukan")
                
            update_data = rute.model_dump(exclude_unset=True)
            if not update_data:
                return {"message": "Tidak ada data yang diubah"}

            daftar_id_halte = update_data.pop("daftar_id_halte", None)
            jalur = update_data.pop("jalur", None)
            
            set_clauses = []
            values = []
            param_idx = 1
            
            # Tangani update geometri jalur (LineString)
            if jalur:
                wkt_coords = ", ".join([f"{pt[0]} {pt[1]}" for pt in jalur])
                linestring_wkt = f"LINESTRING({wkt_coords})"
                set_clauses.append(f"geom = ST_GeomFromText(${param_idx}, 4326)")
                values.append(linestring_wkt)
                param_idx += 1
                
            # Tangani atribut teks/angka lainnya
            for key, value in update_data.items():
                if key == "jenis":
                    set_clauses.append(f"{key} = ${param_idx}::jenis_rute")
                else:
                    set_clauses.append(f"{key} = ${param_idx}")
                values.append(value)
                param_idx += 1
                
            # Jalankan query update tabel rute jika ada perubahan pada rute
            if set_clauses:
                values.append(id)
                query = f"""
                    UPDATE rute
                    SET {', '.join(set_clauses)}
                    WHERE id_rute = ${param_idx}
                """
                await conn.execute(query, *values)
                
            # Tangani update daftar halte yang dilewati (Tabel Relasi)
            if daftar_id_halte is not None:
                # Karena urutan bisa berubah, cara teraman adalah hapus relasi lama, lalu insert yang baru
                await conn.execute("DELETE FROM rute_halte WHERE id_rute = $1", id)
                
                # Insert relasi halte yang baru dengan urutan ter-update
                for indeks, id_halte in enumerate(daftar_id_halte):
                    await conn.execute("""
                        INSERT INTO rute_halte (id_rute, id_halte, urutan)
                        VALUES ($1, $2, $3)
                    """, id, id_halte, indeks + 1)
                    
            return {"message": f"Data rute dengan ID {id} berhasil diperbarui"}

# --- DELETE ---
@router.delete("/{id}")
async def delete_rute(id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # ON DELETE CASCADE di database akan otomatis menghapus relasi di tabel rute_halte
        result = await conn.execute("""DELETE FROM rute WHERE id_rute = $1""", id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Rute tidak ditemukan")
        return {"message": "Rute berhasil dihapus"}