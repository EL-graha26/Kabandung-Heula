import { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import api from "../api";

function MapView() {
  const [openMenu, setOpenMenu] = useState(false);
  
  // State Spasial GeoJSON murni dari backend
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [halteGeoJson, setHalteGeoJson] = useState(null);
  const [wisataGeoJson, setWisataGeoJson] = useState(null);

  useEffect(() => {
    //Ambil Data Rute 
    const fetchRoutes = async () => {
      try {
        const response = await api.get("/rute/data/geojson");
        setRouteGeoJson(response.data);
      } catch (error) {
        console.error("Gagal memuat layer rute:", error);
      }
    };

    //Ambil Data Halte 
    const fetchHalte = async () => {
      try {
        const response = await api.get("/halte/data/geojson");
        setHalteGeoJson(response.data);
      } catch (error) {
        console.error("Gagal memuat layer halte:", error);
      }
    };

    //Ambil Data Objek Wisata (Polygon)
    const fetchWisata = async () => {
      try {
        const response = await api.get("/objek-wisata/data/geojson");
        setWisataGeoJson(response.data);
      } catch (error) {
        console.error("Gagal memuat layer objek wisata area:", error);
      }
    };

    fetchRoutes();
    fetchHalte();
    fetchWisata();
  }, []);

  // ================= STYLE & POPUP LAYER RUTE (LINESTRING) =================
  const getRouteStyle = (feature) => {
    return {
      color: feature.properties?.warna_jalur || "#10b981", 
      weight: 6,
      opacity: 0.85,
    };
  };

  // ================= STYLE & POPUP LAYER HALTE (POINT) =================
  const haltePointToLayer = (feature, latlng) => {
    const jenis = feature.properties?.jenis ? String(feature.properties.jenis).toLowerCase() : "";
    let color = "#64748b"; 
    if (jenis === "brt") color = "#fa31fa";
    else if (jenis === "bus") color = "#1fcee6";
    else if (jenis === "angkot") color = "#ff8d2f";

    return L.circleMarker(latlng, {
      radius: 7,
      fillColor: color,
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });
  };

  // ================= STYLE & POPUP LAYER WISATA (POLYGON ASLI) =================
  const getWisataStyle = (feature) => {
    return {
      color: "#e11d48",
      weight: 2.5,
      fillColor: "#f43f5e",
      fillOpacity: 0.45
    };
  };

  const onEachWisataFeature = (feature, layer) => {
    // Murni membaca dari properti kolom asli database Anda
    const nama = feature.properties?.nama_wisata || "Objek Wisata";
    const kode = feature.properties?.kode_wisata || "-";
    const deskripsi = feature.properties?.deskripsi || "Tidak ada deskripsi tersedia.";
    const luas = feature.properties?.luas_km2 ? `${feature.properties.luas_km2} km²` : "-";

    layer.bindPopup(`
      <div style="font-family: sans-serif; max-width: 250px; padding: 2px;">
        <h4 style="margin: 0 0 5px 0; color: #e11d48; font-size: 14px; border-bottom: 2px solid #ffe4e6; padding-bottom: 4px; font-weight: bold;">
          🏛️ ${nama}
        </h4>
        <div style="font-size: 12px; color: #475569; display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
          <div><strong>Kode Wisata:</strong> ${kode}</div>
          <div><strong>Luas Wilayah:</strong> ${luas}</div>
          <div style="margin-top: 4px; line-height: 1.4; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
            ${deskripsi}
          </div>
        </div>
      </div>
    `);

    // Interaktivitas efek melayang (hover) di atas area poligon objek wisata
    layer.on({
      mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.65, weight: 3.5 }); },
      mouseout: (e) => { e.target.setStyle({ fillOpacity: 0.45, weight: 2.5 }); }
    });
  };

  return (
    <div className="map-section">
      <div className="map-container">

        {/* TOMBOL KEMBALI KE HOME (KIRI ATAS) */}
        <Link to="/" className="back-btn">
          ⬅ Kembali
        </Link>

        <MapContainer
          center={[-6.914744, 107.60981]} 
          zoom={12}
          className="map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* LAYER RUTE (LINESTRING) */}
          {routeGeoJson && (
            <GeoJSON data={routeGeoJson} style={getRouteStyle} onEachFeature={(f, l) => l.bindPopup(`<strong>Rute: ${f.properties?.nama_rute}</strong>`)} />
          )}

          {/* LAYER HALTE (POINT) */}
          {halteGeoJson && (
            <GeoJSON data={halteGeoJson} pointToLayer={haltePointToLayer} onEachFeature={(f, l) => l.bindPopup(`<strong>Halte: ${f.properties?.nama}</strong>`)} />
          )}

          {/* LAYER OBJEK WISATA (POLYGON) */}
          {wisataGeoJson && (
            <GeoJSON 
              data={wisataGeoJson} 
              style={getWisataStyle} 
              onEachFeature={onEachWisataFeature} 
            />
          )}
        </MapContainer>

        {/* FLOATING CONTROL UI */}
        <button className="floating-btn" onClick={() => setOpenMenu(!openMenu)}>☰</button>
        {openMenu && routeGeoJson?.features && (
          <div className="floating-panel right-side">
            <div className="panel-header">
              <h3>Daftar Trayek</h3>
              <button onClick={() => setOpenMenu(false)}>✕</button>
            </div>
            <div className="route-list">
              {routeGeoJson.features.map((feature, idx) => (
                <div className="route-item" key={`panel-${feature.properties?.id_rute || idx}`}>
                  <div className="route-dot" style={{ background: feature.properties?.warna_jalur || "#10b981" }}></div>
                  <p>{feature.properties?.nama_rute || "Rute"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapView;