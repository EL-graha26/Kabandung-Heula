import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import api from "../api";
import { Bus, ArrowLeft, Layers, Map as MapIcon, Moon, CheckSquare, Square, ChevronDown, ChevronUp, X, Filter, Activity, MapPin, Navigation } from "lucide-react";
import { renderToString } from 'react-dom/server';

// ==========================================
// 1. KOMPONEN PENGENDALI FLY-TO PETA
// ==========================================
function MapController({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget) {
      map.flyTo(flyTarget.latlng, flyTarget.zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [flyTarget, map]);
  return null;
}

// ==========================================
// 2. KOMPONEN UTAMA MAP VIEW (INTERACTIVE GIS)
// ==========================================
function MapView() {
  const [openModal, setOpenModal] = useState(false); 
  const [layerType, setLayerType] = useState('dark'); 
  
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [halteGeoJson, setHalteGeoJson] = useState(null);
  const [wisataGeoJson, setWisataGeoJson] = useState(null);
  const mapRef = useRef(null); 

  const [activeRoutes, setActiveRoutes] = useState({});
  const [accordionOpen, setAccordionOpen] = useState({ brt: true, bus: true, angkot: true });
  
  const [focusedRoute, setFocusedRoute] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  const [visibleStopsCount, setVisibleStopsCount] = useState(0);
  const [activeRoutesCount, setActiveRoutesCount] = useState(0);

  // Standar Warna Global HUD Legenda Anda
  const colorBrt = "#10b981";    // Emerald / Hijau (Trans Metro Bandung)
  const colorBus = "#06b6d4";    // Cyan / Biru Muda (Bandros)
  const colorAngkot = "#f59e0b"; // Amber / Kuning Tua (Angkot)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRoute, resHalte, resWisata] = await Promise.all([
          api.get("/rute/data/geojson"),
          api.get("/halte/data/geojson"),
          api.get("/objek-wisata/data/geojson")
        ]);
        
        setRouteGeoJson(resRoute.data);
        setHalteGeoJson(resHalte.data);
        setWisataGeoJson(resWisata.data);

        if (resRoute.data?.features) {
          const initialActive = {};
          resRoute.data.features.forEach(f => {
            const nama = f.properties?.nama_rute;
            if (nama) initialActive[nama.trim()] = true;
          });
          setActiveRoutes(initialActive);
        }
      } catch (error) {
        console.error("Gagal memuat data GIS", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let routesOn = 0;
    Object.values(activeRoutes).forEach(val => { if(val) routesOn++; });
    setActiveRoutesCount(routesOn);

    if (halteGeoJson?.features) {
      let stopsOn = 0;
      halteGeoJson.features.forEach(f => {
        if (filterHalteFeatures(f)) stopsOn++;
      });
      setVisibleStopsCount(stopsOn);
    }
  }, [activeRoutes, halteGeoJson]);

  // ==========================================
  // LOGIKA SMART RADAR 500M
  // ==========================================
  const getNearbyWisata = (halteLatLng, radius = 500) => {
    if (!wisataGeoJson || !wisataGeoJson.features) return [];
    const nearby = [];
    wisataGeoJson.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const coords = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0] : feature.geometry.coordinates[0][0];
        let latSum = 0, lngSum = 0;
        coords.forEach(c => { lngSum += c[0]; latSum += c[1]; });
        const centroid = L.latLng(latSum / coords.length, lngSum / coords.length);
        const distance = halteLatLng.distanceTo(centroid);
        if (distance <= radius) {
          nearby.push({ ...feature, distance: Math.round(distance) });
        }
      }
    });
    return nearby.sort((a, b) => a.distance - b.distance);
  };

  // ==========================================
  // FILTERING LOGIC (RUTE & HALTE)
  // ==========================================
  const filterRouteFeatures = (feature) => {
    const namaRute = feature.properties?.nama_rute;
    if (!namaRute) return false; 
    return activeRoutes[namaRute.trim()] === true;
  };

  const filterHalteFeatures = (feature) => {
    const ruteTerkait = feature.properties?.rute_terkait || [];
    if (ruteTerkait.length === 0) return true; 
    return ruteTerkait.some(rute => activeRoutes[rute.trim()] === true);
  };

  // ==========================================
  // STYLING RUTE & PENETAPAN WARNA SESUAI DATABASE
  // ==========================================
  const getRouteStyle = (feature) => {
    const jenis = String(feature.properties?.jenis || "").toLowerCase();
    const nama = feature.properties?.nama_rute;
    
    // Sinkronisasi Warna Sesuai Aturan Legenda Database Anda
    let defaultColor = colorBus; 
    if (jenis.includes("brt") || jenis.includes("trans")) defaultColor = colorBrt; 
    if (jenis.includes("angkot")) defaultColor = colorAngkot; 

    let opacity = 0.8;
    let weight = 5;
    if (focusedRoute) {
      if (focusedRoute === nama) {
        opacity = 1;
        weight = 8; 
      } else {
        opacity = 0.15; 
        weight = 3;
      }
    }

    return { color: defaultColor, weight: weight, opacity: opacity };
  };

  // ==========================================
  // CUSTOM MARKER ICON CREATOR
  // ==========================================
  const createHalteIcon = (jenisStr, isFocused) => {
    let cls = "marker-halte";
    const lowerJenis = String(jenisStr || "").toLowerCase();
    
    // Perbaikan Kecocokan String untuk Warna Halte Berdasarkan Jenisnya
    if (lowerJenis.includes("brt") || lowerJenis.includes("trans")) cls += " brt";
    else if (lowerJenis.includes("bus") || lowerJenis.includes("bandros")) cls += " bus";
    else if (lowerJenis.includes("angkot")) cls += " angkot";
    else cls += " bus"; 

    if (isFocused) cls += " active";

    const iconHtml = renderToString(
      <div className={cls} style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bus size={12} color="white" />
      </div>
    );
    return L.divIcon({ html: iconHtml, className: '', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] });
  };

  const createWisataIcon = () => {
    const iconHtml = renderToString(
      <div className="marker-wisata" style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <MapPin size={18} color="var(--glow-cyan)" />
      </div>
    );
    return L.divIcon({ html: iconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
  };

  const haltePointToLayer = (feature, latlng) => {
    const jenis = feature.properties?.jenis ? String(feature.properties.jenis).toLowerCase() : "";
    const ruteTerkait = feature.properties?.rute_terkait || [];
    const isFocused = focusedRoute ? ruteTerkait.includes(focusedRoute) : false;

    const marker = L.marker(latlng, { icon: createHalteIcon(jenis, isFocused) });
    const nearby = getNearbyWisata(latlng, 500); 
    
    let radarHtml = '';
    if (nearby.length > 0) {
      radarHtml = `
        <div class="radar-section" style="margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
          <div class="radar-title" style="color: #06b6d4; font-size: 11px; font-weight: bold; text-transform: uppercase;">Smart Radar 500m</div>
          <ul class="radar-list" style="list-style: none; padding: 0; margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">
            ${nearby.slice(0, 3).map(w => `<li style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>🏛️ ${w.properties.nama_wisata}</span> <strong style="color: #06b6d4;">${w.distance}m</strong></li>`).join('')}
          </ul>
        </div>
      `;
    }

    const color = (jenis.includes('brt') || jenis.includes('trans')) ? colorBrt : jenis.includes('angkot') ? colorAngkot : colorBus;
    const ruteStr = ruteTerkait.length > 0 ? ruteTerkait.join(", ") : "Tidak diketahui";

    const popupContent = `
      <div class="smart-hud-popup animate-fade-up" style="font-family: sans-serif; color: white;">
        <div class="hud-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 6px;">
          <div class="hud-title" style="font-weight: 700; font-size: 14px; color: #f8fafc;">${feature.properties?.nama || 'Tanpa Nama'}</div>
          <div class="hud-badge" style="background: rgba(255,255,255,0.1); color: ${color}; border: 1px solid ${color}; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${jenis}</div>
        </div>
        <div class="hud-body" style="font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display:flex; justify-content:space-between;"><span>ID / Kode Halte:</span> <strong>${feature.properties?.kode || '-'}</strong></div>
          <div style="display:flex; justify-content:space-between; align-items: flex-start; gap: 10px;"><span>Koridor:</span> <span style="color: ${color}; text-align: right; font-size:11px;">${ruteStr}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>Fasilitas:</span> <span style="color:#94a3b8;">${feature.properties?.fasilitas || '-'}</span></div>
          <div style="margin-top: 4px; color: #94a3b8; font-size: 11px; line-height: 1.3; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;"><strong>Alamat:</strong> ${feature.properties?.alamat || '-'}</div>
          ${radarHtml}
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent, { minWidth: 260, maxWidth: 300 });
    return marker;
  };

  // ==========================================
  // POP-UP & EVENT KLIK RUTE (LINESTRING) WORKING FIXED
  // ==========================================
  const onEachRouteFeature = (feature, layer) => {
    const nama = feature.properties?.nama_rute || "Trayek Angkutan";
    const kode = feature.properties?.kode_rute || "-";
    const tarif = feature.properties?.tarif ? `Rp ${Number(feature.properties.tarif).toLocaleString('id-ID')}` : "Gratis / N/A";
    const panjang = feature.properties?.panjang_km ? `${feature.properties.panjang_km} Km` : "-";
    const estimasi = feature.properties?.estimasi_waktu ? `${feature.properties.estimasi_waktu} Menit` : "-";
    const ket = feature.properties?.keterangan || "Tidak ada keterangan tambahan.";

    const popupContent = `
      <div class="smart-hud-popup" style="font-family: sans-serif; color: white; min-width: 220px;">
        <h4 style="margin: 0 0 6px 0; color: #06b6d4; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; font-weight: bold;">
          🚌 ${nama}
        </h4>
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px; color: #cbd5e1;">
          <div style="display:flex; justify-content:space-between;"><span>Kode Trayek:</span> <strong>${kode}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span>Jarak Lintasan:</span> <span style="color:#06b6d4;">${panjang}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>Estimasi Waktu:</span> <span>${estimasi}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>Tarif Operasional:</span> <strong style="color: #10b981;">${tarif}</strong></div>
          <div style="margin-top: 4px; font-size: 11px; color: #94a3b8; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px; line-height: 1.3; text-align: justify;">
            <strong>Keterangan:</strong> ${ket}
          </div>
        </div>
      </div>
    `;
    
    layer.bindPopup(popupContent, { maxWidth: 280 });

    layer.on({
      mouseover: (e) => { 
        if (!focusedRoute) e.target.setStyle({ weight: 8, opacity: 1 }); 
      },
      mouseout: (e) => { 
        if (!focusedRoute) e.target.setStyle({ weight: 5, opacity: 0.8 }); 
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e); // Cegah konflik klik peta dasar
        setFocusedRoute(prev => prev === nama ? null : nama);
      }
    });
  };

  // ==========================================
  // POP-UP LENGKAP OBJEK WISATA (POLYGON)
  // ==========================================
  const onEachWisataFeature = (feature, layer) => {
    const nama = feature.properties?.nama_wisata || "Objek Wisata";
    const kode = feature.properties?.kode_wisata || "-";
    const deskripsi = feature.properties?.deskripsi || "Tidak ada deskripsi profil untuk objek wisata ini.";
    const luas = feature.properties?.luas_km2 ? `${feature.properties.luas_km2} km²` : "-";

    const popupContent = `
      <div class="smart-hud-popup" style="font-family: sans-serif; color: white; max-width: 260px;">
        <div class="hud-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 6px;">
          <div class="hud-title" style="font-weight: 700; font-size: 14px; color: #f43f5e;">🏛️ ${nama}</div>
          <div class="hud-badge" style="background: rgba(244,63,94,0.1); color: #f43f5e; border: 1px solid #f43f5e; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: bold;">POLYGON</div>
        </div>
        <div class="hud-body" style="font-size: 12px; display: flex; flex-direction: column; gap: 3px; color: #cbd5e1;">
          <div><strong>Kode Wilayah:</strong> ${kode}</div>
          <div><strong>Luas Kawasan:</strong> <span style="color:#f43f5e;">${luas}</span></div>
          <div style="margin-top: 6px; line-height: 1.4; color: #94a3b8; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px; text-align: justify;">
            <strong>Deskripsi:</strong><br/> ${deskripsi}
          </div>
        </div>
      </div>
    `;
    layer.bindPopup(popupContent, { maxWidth: 280 });

    layer.on({
      mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.8, weight: 2, color: "#f43f5e" }); },
      mouseout: (e) => { e.target.setStyle({ fillOpacity: 0.4, weight: 1, color: "rgba(255,255,255,0.2)" }); },
      click: (e) => {
        let latlng;
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          let latSum = 0, lngSum = 0;
          coords.forEach(c => { lngSum += c[0]; latSum += c[1]; });
          latlng = L.latLng(latSum / coords.length, lngSum / coords.length);
        }
        if (latlng) {
          setFlyTarget({ latlng, zoom: 16 });
        }
      }
    });
  };

  const toggleRoute = (namaRute) => {
    if (!namaRute) return;
    setActiveRoutes(prev => ({ ...prev, [namaRute.trim()]: !prev[namaRute.trim()] }));
  };

  const toggleAccordion = (type) => {
    setAccordionOpen(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleAllInType = (type, state) => {
    if (!routeGeoJson || !routeGeoJson.features) return;
    const newActive = { ...activeRoutes };
    routeGeoJson.features.forEach(f => {
      const routeJenis = String(f.properties?.jenis || "").toLowerCase();
      // Penyesuaian fleksibilitas kata kunci jenis
      if (routeJenis.includes(type) || (type === "brt" && routeJenis.includes("trans"))) {
        if (f.properties?.nama_rute) {
          newActive[f.properties.nama_rute.trim()] = state;
        }
      }
    });
    setActiveRoutes(newActive);
  };

  const groupedRoutes = { brt: [], bus: [], angkot: [] };
  if (routeGeoJson && routeGeoJson.features) {
    routeGeoJson.features.forEach(f => {
      const type = String(f.properties?.jenis || "").toLowerCase();
      if (type.includes("brt") || type.includes("trans")) groupedRoutes.brt.push(f);
      else if (type.includes("angkot")) groupedRoutes.angkot.push(f);
      else groupedRoutes.bus.push(f);
    });
  }

  const getTileUrl = () => {
    if (layerType === 'satellite') return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (layerType === 'dark') return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  };

  // Perbaikan Struktur CSS Ikon Legenda Kiri Bawah Agar Bulat Sempurna dan Tidak Berantakan
  const LegendIcon = ({ color }) => (
    <div style={{
      background: 'rgba(15, 23, 42, 0.8)',
      border: `2px solid ${color}`,
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      boxShadow: `0 0 10px ${color}`,
      color: color,
      flexRaw: '0 0 auto',
      flexShrink: 0
    }}>
      <Bus size={12} />
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#020617' }}>
      
      {/* FLOATING SMART HUD */}
      <div className="map-smart-hud animate-fade-up">
        <div className="hud-stat"><Activity size={16} color={colorBus} /> Rute Aktif <strong>{activeRoutesCount}</strong></div>
        <div style={{width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)'}}></div>
        <div className="hud-stat"><MapPin size={16} color={colorBrt} /> Halte Terlihat <strong>{visibleStopsCount}</strong></div>
        <div style={{width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)'}}></div>
        <div className="hud-stat"><Navigation size={16} color={colorAngkot} /> Mode <strong>{focusedRoute ? 'FOKUS' : 'GLOBAL'}</strong></div>
        {focusedRoute && (
          <button 
            onClick={() => setFocusedRoute(null)}
            style={{background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.5)', color: '#f43f5e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', marginLeft: '10px'}}
          >
            Reset Fokus
          </button>
        )}
      </div>

      {/* KIRI ATAS CONTROLS */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link to="/home" className="glass-panel" style={{ color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
          <ArrowLeft size={18} /> Beranda
        </Link>
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => setLayerType('default')} style={{ background: 'transparent', border: 'none', color: layerType === 'default' ? 'white' : '#64748b', cursor: 'pointer' }}><MapIcon size={22} /></button>
          <button onClick={() => setLayerType('dark')} style={{ background: 'transparent', border: 'none', color: layerType === 'dark' ? colorBus : '#64748b', cursor: 'pointer' }}><Moon size={22} /></button>
          <button onClick={() => setLayerType('satellite')} style={{ background: 'transparent', border: 'none', color: layerType === 'satellite' ? 'white' : '#64748b', cursor: 'pointer' }}><Layers size={22} /></button>
        </div>
      </div>

      {/* KIRI BAWAH LEGENDA WARNA FIXED */}
      <div className="glass-panel animate-fade-up" style={{ position: 'absolute', bottom: '30px', left: '24px', zIndex: 1000, padding: '20px', minWidth: '200px' }}>
        <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Legend</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><LegendIcon color={colorBrt} /><span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Trans Metro</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><LegendIcon color={colorBus} /><span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Bandros</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><LegendIcon color={colorAngkot} /><span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Angkot</span></div>
        </div>
      </div>

      {/* KANAN ATAS MANAGEMEN */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 1000 }}>
        <button className="glass-panel" style={{ padding: '14px 24px', color: 'white', border: `1px solid ${colorBus}`, fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 0 20px rgba(6, 182, 212, 0.3)` }} onClick={() => setOpenModal(true)}>
          <Filter size={18} color={colorBus} /> Manajemen Rute
        </button>
      </div>

      {/* MODAL FILTER DASHBOARD */}
      {openModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="animate-fade-up" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)', width: '90%', maxWidth: '500px', maxHeight: '80vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '700' }}>Dashboard Rute</h2>
                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '13px' }}>Atur visibilitas rute dan sinkronisasi halte otomatis</p>
              </div>
              <button onClick={() => setOpenModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor:'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                const renderBlock = (type, title, color) => (
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', borderRadius: '16px', border: `1px solid rgba(255,255,255,0.05)` }}>
                    <div onClick={() => toggleAccordion(type)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'white', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}`}}></div>{title}
                      </strong>
                      {accordionOpen[type] ? <ChevronUp size={20} color={color}/> : <ChevronDown size={20} color="#64748b"/>}
                    </div>
                    {accordionOpen[type] && (
                      <div style={{ padding: '0 20px 20px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                          <button onClick={() => toggleAllInType(type, true)} style={{flex: 1, padding: '8px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer'}}>Aktifkan</button>
                          <button onClick={() => toggleAllInType(type, false)} style={{flex: 1, padding: '8px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'}}>Sembunyikan</button>
                        </div>
                        {groupedRoutes[type].map((route, idx) => {
                          const name = route.properties?.nama_rute;
                          const isActive = activeRoutes[name?.trim()];
                          return (
                            <div key={idx} onClick={() => toggleRoute(name)} className="route-item-modern" style={{ display: 'flex', alignItems: 'center', padding: '12px 10px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                              {isActive ? <CheckSquare size={18} color={color}/> : <Square size={18} color="#475569"/>}
                              <span style={{ color: isActive ? 'white' : '#94a3b8', marginLeft: '12px', fontSize: '14px', flex: 1, fontWeight: isActive ? '500' : '400' }}>{name}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                );
                return (
                  <>
                    {renderBlock('brt', 'Trans Metro Bandung', colorBrt)}
                    {renderBlock('bus', 'Bus Wisata (Bandros)', colorBus)}
                    {renderBlock('angkot', 'Angkutan Kota', colorAngkot)}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* RENDER INTERNAL MAP CANVAS */}
      <MapContainer
        center={[-6.914744, 107.60981]} 
        zoom={13}
        className="leaflet-fullscreen"
        zoomControl={false} 
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
      >
        <MapController flyTarget={flyTarget} />
        <TileLayer url={getTileUrl()} attribution='&copy; WebGIS Kabandung Heula' />

        {/* LAYER 1: OBJEK WISATA AREA (POLYGON) */}
        {wisataGeoJson && (
          <GeoJSON 
            data={wisataGeoJson} 
            style={() => ({ color: "rgba(255,255,255,0.2)", weight: 1.5, fillColor: "#e11d48", fillOpacity: 0.45 })} 
            onEachFeature={onEachWisataFeature} 
          />
        )}

        {/* LAYER 2: LINTASAN OPERASIONAL (LINESTRING) FIXED KEY MAP */}
        {routeGeoJson && (
          <GeoJSON 
            // PERBAIKAN: Memanfaatkan string gabungan activeRoutes agar key memicu re-render ulang filter saat di-check
            key={`route-gis-layer-${JSON.stringify(activeRoutes)}-${focusedRoute}`} 
            data={routeGeoJson} 
            style={getRouteStyle} 
            filter={filterRouteFeatures}
            onEachFeature={onEachRouteFeature}
          />
        )}

        {/* LAYER 3: STASIUN PEMBERHENTIAN (POINT) FIXED SINKRONISASI FILTER */}
        {halteGeoJson && (
          <GeoJSON 
            key={`halte-gis-layer-${JSON.stringify(activeRoutes)}-${focusedRoute}`} 
            data={halteGeoJson} 
            pointToLayer={haltePointToLayer} 
            filter={filterHalteFeatures}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;