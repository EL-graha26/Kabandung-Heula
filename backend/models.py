from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import time

# ==========================================
# SKEMA MODEL HALTE
# ==========================================
class HalteBase(BaseModel):
    nama: str = Field(..., description="Nama halte")
    kode: str = Field(..., description="Kode halte")
    jenis: str = Field(..., description="Jenis halte [Bus Trans | Angkot | Bandros]")
    alamat: Optional[str] = Field(None, description="Alamat lengkap lokasi halte")
    fasilitas: Optional[str] = Field(None, description="Fasilitas yang tersedia (opsional)")
    jam_operasi_mulai: Optional[time] = Field(None, description="Jam mulai operasi, contoh: 05:00:00")
    jam_operasi_selesai: Optional[time] = Field(None, description="Jam selesai operasi, contoh: 22:00:00")
    aktif: bool = Field(True, description="Status keaktifan halte")

class HalteCreate(HalteBase):
    longitude: float = Field(..., ge=-180, le=180, description="Longitude lokasi halte")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude lokasi halte")

class HalteUpdate(HalteBase):
    nama: Optional[str] = None
    kode: Optional[str] = None
    jenis: Optional[str] = None
    alamat: Optional[str] = None
    fasilitas: Optional[str] = None
    jam_operasi_mulai: Optional[time] = None
    jam_operasi_selesai: Optional[time] = None
    aktif: Optional[bool] = None
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    latitude: Optional[float] = Field(None, ge=-90, le=90)


# ==========================================
# SKEMA MODEL RUTE
# ==========================================
class RuteBase(BaseModel):
    nama_rute: str = Field(..., description="Nama rute, contoh: Leuwi Panjang - Dago")
    kode_rute: str = Field(..., description="Kode rute, contoh: TMB-K1")
    warna_jalur: Optional[str] = Field("#FF0000", description="Warna format HEX untuk peta")
    keterangan: Optional[str] = Field(None, description="Keterangan tambahan rute")
    jenis: str = Field(..., description="Jenis rute moda [Bus Trans | Angkot]")
    panjang_km: Optional[float] = Field(None, description="Total panjang rute dalam KM")
    estimasi_waktu: Optional[int] = Field(None, description="Estimasi perjalanan dalam menit")
    tarif: Optional[int] = Field(None, ge=0, description="Tarif perjalanan rute ini")
    aktif: bool = Field(True, description="Status keaktifan rute")
    
    # Format GeoJSON LineString: [[lon1, lat1], [lon2, lat2], ...]
    jalur: List[List[float]] = Field(
        ..., 
        description="Koordinat jalur (LineString) format GeoJSON: [[lon, lat], [lon, lat]]"
    )

class RuteCreate(RuteBase):
    # Menggunakan daftar_id_halte agar bisa langsung dimasukkan ke tabel relasi rute_halte
    daftar_id_halte: List[int] = Field(..., description="Daftar ID Halte yang dilewati secara berurutan")

class RuteUpdate(BaseModel):
    nama_rute: Optional[str] = None
    kode_rute: Optional[str] = None
    warna_jalur: Optional[str] = None
    keterangan: Optional[str] = None
    jenis: Optional[str] = None
    panjang_km: Optional[float] = None
    estimasi_waktu: Optional[int] = None
    tarif: Optional[int] = None
    aktif: Optional[bool] = None
    jalur: Optional[List[List[float]]] = None
    daftar_id_halte: Optional[List[int]] = None

class RuteResponse(RuteBase):
    id_rute: int
    daftar_halte: List[dict] = [] # Menggunakan list dict untuk menampung data join dari database

    class Config:
        from_attributes = True

# ==========================================
# SKEMA MODEL OBJEK WISATA (POLYGON)
# ==========================================
class ObjekWisataBase(BaseModel):
    nama_wisata: str = Field(..., description="Nama objek wisata")
    kode_wisata: str = Field(..., description="Kode unik objek wisata")
    deskripsi: Optional[str] = Field(None, description="Deskripsi objek wisata")
    luas_km2: Optional[float] = Field(None, description="Luas area dalam KM persegi")
    
    # Format GeoJSON Polygon: [[[lon1, lat1], [lon2, lat2], [lon3, lat3], [lon1, lat1]]]
    geom: List[List[List[float]]] = Field(
        ..., 
        description="Koordinat Polygon GeoJSON. Ingat: Titik pertama dan terakhir harus sama untuk menutup polygon.",
        example=[[[107.610, -6.910], [107.620, -6.910], [107.620, -6.920], [107.610, -6.920], [107.610, -6.910]]]
    )

class ObjekWisataCreate(ObjekWisataBase):
    pass

class ObjekWisataUpdate(BaseModel):
    nama_wisata: Optional[str] = None
    kode_wisata: Optional[str] = None
    deskripsi: Optional[str] = None
    luas_km2: Optional[float] = None
    geom: Optional[List[List[List[float]]]] = None

class ObjekWisataResponse(ObjekWisataBase):
    id_wisata: int

    class Config:
        from_attributes = True