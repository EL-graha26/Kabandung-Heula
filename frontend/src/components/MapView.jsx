import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import api from "../api";
import { Bus, ArrowLeft, Layers, Map as MapIcon, Moon, CheckSquare, Square, X, Filter, Activity, MapPin, Navigation, Info } from "lucide-react";
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
// 2. KOMPONEN PENDETEKSI KLIK PETA
// ==========================================
function MapEventHandler({ onMapClick }) {
  useMapEvents({
    click: () => {
      onMapClick();
    }
  });
  return null;
}

// ==========================================
// 3. KOMPONEN CUSTOM UI: TOGGLE SWITCH
// ==========================================
const CustomToggle = ({ checked, onChange, color }) => (
  <div 
    onClick={onChange}
    style={{
      width: '40px', height: '22px', borderRadius: '12px', 
      background: checked ? color : 'rgba(255,255,255,0.1)',
      border: `1px solid ${checked ? color : 'rgba(255,255,255,0.2)'}`,
      position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s ease',
      flexShrink: 0
    }}
  >
    <div style={{
      width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff',
      position: 'absolute', top: '2px', left: checked ? '20px' : '2px',
      transition: 'left 0.3s ease, transform 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }}></div>
  </div>
);

// ==========================================
// 4. KOMPONEN UTAMA MAP VIEW
// ==========================================
function MapView() {
  const BASE_RADIUS = 3500; 

  const [openModal, setOpenModal] = useState(false); 
  const [layerType, setLayerType] = useState('dark'); 
  
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [halteGeoJson, setHalteGeoJson] = useState(null);
  const [wisataGeoJson, setWisataGeoJson] = useState(null);
  const mapRef = useRef(null); 

  const [showWisata, setShowWisata] = useState(true);
  const [showNearbyWisataOnly, setShowNearbyWisataOnly] = useState(false);
  const [showHalte, setShowHalte] = useState({ brt: true, bus: true, angkot: true });
  const [activeRoutes, setActiveRoutes] = useState({});
  
  const [focusedRoute, setFocusedRoute] = useState(null);
  const [focusedHalteLatLng, setFocusedHalteLatLng] = useState(null); 
  const [dynamicRadius, setDynamicRadius] = useState(BASE_RADIUS); 
  const [flyTarget, setFlyTarget] = useState(null);

  const [visibleStopsCount, setVisibleStopsCount] = useState(0);
  const [activeRoutesCount, setActiveRoutesCount] = useState(0);

  const colorBrt = "#10b981";    
  const colorBus = "#06b6d4";    
  const colorAngkot = "#f59e0b"; 

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
  }, [activeRoutes, halteGeoJson, showHalte]);

  const handleMapClick = () => {
    setFocusedRoute(null);
    setFocusedHalteLatLng(null);
    setDynamicRadius(BASE_RADIUS);
  };

  const getNearbyWisata = (halteLatLng, initialRadius = BASE_RADIUS) => {
    if (!wisataGeoJson || !wisataGeoJson.features || !showWisata) return { nearby: [], radiusUsed: initialRadius };
    
    const allWisataWithDistance = wisataGeoJson.features.map(feature => {
      let centroid = halteLatLng;
      if (feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon') {
        const coords = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0] : feature.geometry.coordinates[0][0];
        let latSum = 0, lngSum = 0;
        coords.forEach(c => { lngSum += c[0]; latSum += c[1]; });
        centroid = L.latLng(latSum / coords.length, lngSum / coords.length);
      } else if (feature.geometry?.type === 'Point') {
        centroid = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
      }
      return { ...feature, distance: Math.round(halteLatLng.distanceTo(centroid)) };
    }).sort((a, b) => a.distance - b.distance);

    if (allWisataWithDistance.length === 0) return { nearby: [], radiusUsed: initialRadius };

    let nearby = allWisataWithDistance.filter(w => w.distance <= initialRadius);
    let radiusUsed = initialRadius;

    if (nearby.length === 0) {
      nearby = [allWisataWithDistance[0]];
      radiusUsed = allWisataWithDistance[0].distance; 
    }

    return { nearby, radiusUsed };
  };

  const filterRouteFeatures = (feature) => {
    const namaRute = feature.properties?.nama_rute;
    if (!namaRute) return false; 
    return activeRoutes[namaRute.trim()] === true;
  };

  const filterHalteFeatures = (feature) => {
    const jenis = String(feature.properties?.jenis || "").toLowerCase();
    let type = 'bus'; 
    if (jenis.includes('brt') || jenis.includes('trans')) type = 'brt';
    else if (jenis.includes('angkot')) type = 'angkot';

    return showHalte[type] === true;
  };

  const filterWisataFeatures = (feature) => {
    if (!showNearbyWisataOnly) return true;
    if (!focusedHalteLatLng) return false; 

    let centroid = focusedHalteLatLng;
    if (feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon') {
      const coords = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0] : feature.geometry.coordinates[0][0];
      let latSum = 0, lngSum = 0;
      coords.forEach(c => { lngSum += c[0]; latSum += c[1]; });
      centroid = L.latLng(latSum / coords.length, lngSum / coords.length);
    } else if (feature.geometry?.type === 'Point') {
      centroid = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
    }

    const distance = focusedHalteLatLng.distanceTo(centroid);
    return distance <= (dynamicRadius + 50); 
  };

  const getRouteStyle = (feature) => {
    const jenis = String(feature.properties?.jenis || "").toLowerCase();
    const nama = feature.properties?.nama_rute;
    
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

  const createHalteIcon = (jenisStr, isFocused) => {
    let cls = "marker-halte";
    const lowerJenis = String(jenisStr || "").toLowerCase();
    
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

  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  };

  const haltePointToLayer = (feature, latlng) => {
    // ATRIBUT TABEL HALTE
    const jenis = feature.properties?.jenis || "-";
    const nama = feature.properties?.nama || "Tanpa Nama";
    const kode = feature.properties?.kode || "-";
    const alamat = feature.properties?.alamat || "-";
    const fasilitas = feature.properties?.fasilitas || "-";
    const jamMulai = feature.properties?.jam_operasi_mulai || "-";
    const jamSelesai = feature.properties?.jam_operasi_selesai || "-";
    const aktif = feature.properties?.aktif !== false ? "Aktif" : "Tidak Aktif";

    // Data relasi / fungsional map
    const lowerJenis = String(jenis).toLowerCase();
    const ruteTerkait = feature.properties?.rute_terkait || [];
    const isFocused = (focusedRoute && ruteTerkait.includes(focusedRoute)) || (focusedHalteLatLng && focusedHalteLatLng.equals(latlng));

    const marker = L.marker(latlng, { icon: createHalteIcon(jenis, isFocused) });
    const { nearby, radiusUsed } = getNearbyWisata(latlng, BASE_RADIUS); 
    
    const isExpanded = radiusUsed > BASE_RADIUS;
    const radiusDisplay = isExpanded ? `${(radiusUsed / 1000).toFixed(1)} km (Diperluas)` : `${BASE_RADIUS / 1000} km`;
    
    let radarHtml = '';
    if (nearby.length > 0) {
      radarHtml = `
        <div class="radar-section" style="margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
          <div class="radar-title" style="color: ${isExpanded ? '#f59e0b' : '#06b6d4'}; font-size: 11px; font-weight: bold; text-transform: uppercase;">
            Radar Wisata ${radiusDisplay}
          </div>
          <ul class="radar-list" style="list-style: none; padding: 0; margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">
            ${nearby.slice(0, 3).map(w => `<li style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>🏛️ ${w.properties?.nama_wisata || 'Wisata'}</span> <strong style="color: #06b6d4;">${formatDistance(w.distance)}</strong></li>`).join('')}
          </ul>
        </div>
      `;
    }

    const color = (lowerJenis.includes('brt') || lowerJenis.includes('trans')) ? colorBrt : lowerJenis.includes('angkot') ? colorAngkot : colorBus;

    const popupContent = `
      <div class="smart-hud-popup animate-fade-up" style="font-family: sans-serif; color: white;">
        <div class="hud-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 6px;">
          <div class="hud-title" style="font-weight: 700; font-size: 14px; color: #f8fafc;">${nama}</div>
          <div class="hud-badge" style="background: rgba(255,255,255,0.1); color: ${color}; border: 1px solid ${color}; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${jenis}</div>
        </div>
        <div class="hud-body" style="font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display:flex; justify-content:space-between;"><span>Kode Halte:</span> <strong>${kode}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span>Jam Operasi:</span> <span style="color:#06b6d4;">${jamMulai} - ${jamSelesai}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>Status:</span> <strong style="color: ${aktif === 'Aktif' ? '#10b981' : '#f43f5e'};">${aktif}</strong></div>
          <div style="margin-top: 4px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">
            <strong>Fasilitas:</strong> ${fasilitas}
          </div>
          <div style="color: #94a3b8; line-height: 1.3;">
            <strong>Alamat:</strong> ${alamat}
          </div>
          ${radarHtml}
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent, { minWidth: 260, maxWidth: 300 });

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e); 
      setFocusedHalteLatLng(latlng);
      setDynamicRadius(radiusUsed); 
    });

    return marker;
  };

  const onEachRouteFeature = (feature, layer) => {
    // ATRIBUT TABEL RUTE
    const nama = feature.properties?.nama_rute || "Trayek Tanpa Nama";
    const kode = feature.properties?.kode_rute || "-";
    const jenis = feature.properties?.jenis || "-";

    const popupContent = `
      <div class="smart-hud-popup" style="font-family: sans-serif; color: white; min-width: 200px; padding: 12px;">
        <h4 style="margin: 0 0 10px 0; color: #06b6d4; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 8px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span>🚌 ${nama}</span>
          <span style="font-size: 10px; font-weight: normal; background: rgba(255,255,255,0.1); padding: 3px 6px; border-radius: 4px;">${jenis}</span>
        </h4>
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; color: #cbd5e1;">
          <div style="display:flex; justify-content:space-between;">
            <span>Kode Trayek:</span> 
            <strong style="color: #10b981;">${kode}</strong>
          </div>
        </div>
      </div>
    `;
    layer.bindPopup(popupContent, { maxWidth: 300 });

    layer.on({
      mouseover: (e) => { if (!focusedRoute) e.target.setStyle({ weight: 8, opacity: 1 }); },
      mouseout: (e) => { if (!focusedRoute) e.target.setStyle({ weight: 5, opacity: 0.8 }); },
      click: (e) => {
        L.DomEvent.stopPropagation(e); 
        setFocusedRoute(prev => prev === nama ? null : nama);
      }
    });

    if (focusedRoute === nama) {
      setTimeout(() => {
        if (layer && layer._map) {
          // Cari titik tengah rute untuk memunculkan pop-up
          if (layer.getBounds) {
            layer.openPopup(layer.getBounds().getCenter());
          } else {
            layer.openPopup();
          }
        }
      }, 250); 
    }
  };

  const onEachWisataFeature = (feature, layer) => {
    // ATRIBUT TABEL OBJEK WISATA
    const nama = feature.properties?.nama_wisata || "Objek Wisata";
    const kode = feature.properties?.kode_wisata || "-";
    const luas = feature.properties?.luas_km2 ? `${feature.properties.luas_km2} km²` : "-";
    const deskripsi = feature.properties?.deskripsi || "-";

    const popupContent = `
      <div class="smart-hud-popup" style="font-family: sans-serif; color: white; max-width: 260px;">
        <div class="hud-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 6px;">
          <div class="hud-title" style="font-weight: 700; font-size: 14px; color: #f43f5e;">🏛️ ${nama}</div>
          <div class="hud-badge" style="background: rgba(244,63,94,0.1); color: #f43f5e; border: 1px solid #f43f5e; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: bold;">WISATA</div>
        </div>
        <div class="hud-body" style="font-size: 11px; display: flex; flex-direction: column; gap: 4px; color: #cbd5e1;">
          <div style="display:flex; justify-content:space-between;"><span>Kode Wisata:</span> <strong>${kode}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span>Luas Wilayah:</span> <span style="color:#f43f5e;">${luas}</span></div>
          <div style="margin-top: 6px; line-height: 1.4; color: #94a3b8; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px; text-align: justify;">
            <strong>Deskripsi:</strong><br/> ${deskripsi}
          </div>
        </div>
      </div>
    `;
    layer.bindPopup(popupContent, { maxWidth: 300 });

    layer.on({
      mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.8, weight: 2, color: "#f43f5e" }); },
      mouseout: (e) => { e.target.setStyle({ fillOpacity: 0.4, weight: 1, color: "rgba(255,255,255,0.2)" }); },
      click: (e) => {
        L.DomEvent.stopPropagation(e); 
        let latlng;
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          let latSum = 0, lngSum = 0;
          coords.forEach(c => { lngSum += c[0]; latSum += c[1]; });
          latlng = L.latLng(latSum / coords.length, lngSum / coords.length);
        }
        if (latlng) setFlyTarget({ latlng, zoom: 16 });
      }
    });
  };

  // ==========================================
  // PENGELOMPOKAN DATA RUTE
  // ==========================================
  const groupedRoutes = { brt: [], angkot: [] }; 
  if (routeGeoJson && routeGeoJson.features) {
    routeGeoJson.features.forEach(f => {
      const type = String(f.properties?.jenis || "").toLowerCase();
      if (type.includes("brt") || type.includes("trans")) groupedRoutes.brt.push(f);
      else if (type.includes("angkot")) groupedRoutes.angkot.push(f);
    });
  }

  const toggleRoute = (namaRute) => {
    if (!namaRute) return;
    setActiveRoutes(prev => ({ ...prev, [namaRute.trim()]: !prev[namaRute.trim()] }));
  };

  const toggleAllRoutesInType = (type, state) => {
    if (!groupedRoutes[type]) return;
    const newActive = { ...activeRoutes };
    groupedRoutes[type].forEach(f => {
      if (f.properties?.nama_rute) {
        newActive[f.properties.nama_rute.trim()] = state;
      }
    });
    setActiveRoutes(newActive);
  };

  const getTileUrl = () => {
    if (layerType === 'satellite') return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (layerType === 'dark') return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  };

  const LegendIcon = ({ color }) => (
    <div style={{
      background: 'rgba(15, 23, 42, 0.8)', border: `2px solid ${color}`, borderRadius: '50%',
      width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 10px ${color}`, color: color, flexShrink: 0
    }}>
      <Bus size={12} />
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#020617' }}>
      
      {/* ================= HUD INTERAKTIF ================= */}
      <div className="map-smart-hud animate-fade-up">
        <div className="hud-stat" onClick={() => setOpenModal(true)} style={{ cursor: 'pointer' }}><Activity size={16} color={colorBus} /> Rute Aktif <strong style={{color: 'white'}}>{activeRoutesCount}</strong></div>
        <div style={{width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)'}}></div>
        <div className="hud-stat" onClick={() => setOpenModal(true)} style={{ cursor: 'pointer' }}><MapPin size={16} color={colorBrt} /> Halte Tampil <strong style={{color: 'white'}}>{visibleStopsCount}</strong></div>
        <div style={{width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)'}}></div>
        <div className="hud-stat" style={{ cursor: (focusedRoute || focusedHalteLatLng) ? 'pointer' : 'default' }} onClick={handleMapClick}><Navigation size={16} color={colorAngkot} /> Mode <strong style={{color: (focusedRoute || focusedHalteLatLng) ? '#f43f5e' : 'white'}}>{(focusedRoute || focusedHalteLatLng) ? 'FOKUS' : 'GLOBAL'}</strong></div>
        {(focusedRoute || focusedHalteLatLng) && (
          <button onClick={handleMapClick} style={{background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.5)', color: '#f43f5e', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', marginLeft: '10px', fontWeight: 'bold'}}>Reset Peta</button>
        )}
      </div>

      {/* KIRI ATAS: NAVIGASI */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link to="/home" className="glass-panel" style={{ color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}><ArrowLeft size={18} /> Beranda</Link>
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => setLayerType('default')} style={{ background: 'transparent', border: 'none', color: layerType === 'default' ? 'white' : '#64748b', cursor: 'pointer' }}><MapIcon size={22} /></button>
          <button onClick={() => setLayerType('dark')} style={{ background: 'transparent', border: 'none', color: layerType === 'dark' ? colorBus : '#64748b', cursor: 'pointer' }}><Moon size={22} /></button>
          <button onClick={() => setLayerType('satellite')} style={{ background: 'transparent', border: 'none', color: layerType === 'satellite' ? 'white' : '#64748b', cursor: 'pointer' }}><Layers size={22} /></button>
        </div>
      </div>

      {/* KIRI BAWAH: LEGENDA MAP */}
      <div className="glass-panel animate-fade-up" style={{ position: 'absolute', bottom: '30px', left: '24px', zIndex: 1000, padding: '20px', minWidth: '200px' }}>
        <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Legend</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><LegendIcon color={colorBrt} /><span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Trans Metro</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><LegendIcon color={colorBus} /><span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Bandros</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><LegendIcon color={colorAngkot} /><span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Angkot</span></div>
        </div>
      </div>

      {/* KANAN ATAS: TOMBOL BUKA FILTER */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 1000 }}>
        <button className="glass-panel" style={{ padding: '14px 24px', color: 'white', border: `1px solid ${colorBus}`, fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 0 20px rgba(6, 182, 212, 0.3)` }} onClick={() => setOpenModal(true)}><Filter size={18} color={colorBus} /> Filter Layer</button>
      </div>

      {/* ================= MODAL FILTER ================= */}
      {openModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="animate-fade-up" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.1)', width: '90%', maxWidth: '450px', maxHeight: '85vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '700' }}>Manajemen Layer</h2>
                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '13px' }}>Tampilkan atau sembunyikan objek di peta secara presisi.</p>
              </div>
              <button onClick={() => setOpenModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor:'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* SECTION: WISATA */}
              <div>
                <h3 style={{color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px'}}>Pariwisata</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{color: 'white', fontSize: '15px', fontWeight: '500'}}>Tampilkan Kawasan Wisata</span>
                    <CustomToggle checked={showWisata} onChange={() => { setShowWisata(!showWisata); if(showWisata) setShowNearbyWisataOnly(false); }} color="#f43f5e" />
                  </div>

                  {/* CHECKBOX FILTER WISATA TERDEKAT */}
                  {showWisata && (
                    <>
                      <div onClick={() => setShowNearbyWisataOnly(!showNearbyWisataOnly)} className="route-item-modern" style={{ display: 'flex', alignItems: 'center', padding: '12px 10px', marginTop: '16px', cursor: 'pointer', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.02)' }}>
                        {showNearbyWisataOnly ? <CheckSquare size={18} color="#f43f5e"/> : <Square size={18} color="#475569"/>}
                        <span style={{ color: showNearbyWisataOnly ? 'white' : '#94a3b8', marginLeft: '12px', fontSize: '13px', fontWeight: showNearbyWisataOnly ? '500' : '400', lineHeight: '1.4' }}>
                          Hanya tampilkan wisata terdekat ({BASE_RADIUS / 1000} km / Otomatis) dari halte yang diklik
                        </span>
                      </div>
                      
                      {showNearbyWisataOnly && !focusedHalteLatLng && (
                        <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', marginTop: '8px' }}>
                          <Info size={14} style={{display:'inline', verticalAlign:'middle', marginRight:'5px', position: 'relative', top: '-1px'}}/>
                          Klik salah satu ikon halte di peta untuk melacak wisata terdekat.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* SECTION: HALTE */}
              <div>
                <h3 style={{color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px'}}>Stasiun & Halte</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                  {['brt', 'bus', 'angkot'].map((type, idx) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{width: '10px', height: '10px', borderRadius: '50%', background: type === 'brt' ? colorBrt : type === 'bus' ? colorBus : colorAngkot }}></div>
                        <span style={{color: '#e2e8f0', fontSize: '14px', fontWeight: '500'}}>Halte {type === 'brt' ? 'Trans Metro' : type === 'bus' ? 'Bandros' : 'Angkutan Kota'}</span>
                      </div>
                      <CustomToggle checked={showHalte[type]} onChange={() => setShowHalte({...showHalte, [type]: !showHalte[type]})} color={type === 'brt' ? colorBrt : type === 'bus' ? colorBus : colorAngkot} />
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: LINTASAN RUTE */}
              <div>
                <h3 style={{color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px'}}>Lintasan Rute</h3>
                {['brt', 'angkot'].map(type => {
                  const title = type === 'brt' ? 'Trans Metro Bandung' : 'Angkutan Kota';
                  const color = type === 'brt' ? colorBrt : colorAngkot;
                  const isAllActive = groupedRoutes[type]?.length > 0 && groupedRoutes[type].every(r => activeRoutes[r.properties?.nama_rute?.trim()]);

                  return (
                    <div key={type} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <CustomToggle checked={isAllActive} onChange={() => toggleAllRoutesInType(type, !isAllActive)} color={color} />
                          <span style={{color: 'white', fontSize: '15px', fontWeight: '600'}}>{title}</span>
                        </div>
                      </div>

                      <div style={{ padding: '8px 16px' }}>
                        {groupedRoutes[type]?.map((route, idx) => {
                          const name = route.properties?.nama_rute?.trim();
                          const isActive = activeRoutes[name];
                          return (
                            <div key={idx} onClick={() => toggleRoute(name)} className="route-item-modern" style={{ display: 'flex', alignItems: 'center', padding: '12px 10px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>
                              {isActive ? <CheckSquare size={18} color={color}/> : <Square size={18} color="#475569"/>}
                              <span style={{ color: isActive ? 'white' : '#94a3b8', marginLeft: '12px', fontSize: '13px', fontWeight: isActive ? '500' : '400' }}>{name}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* RENDER PETA */}
      <MapContainer center={[-6.914744, 107.60981]} zoom={13} className="leaflet-fullscreen" zoomControl={false} ref={mapRef} style={{ width: '100%', height: '100%' }}>
        <MapController flyTarget={flyTarget} />
        
        <MapEventHandler onMapClick={handleMapClick} />

        <TileLayer url={getTileUrl()} attribution='&copy; WebGIS Transportasi Bandung' />

        {/* LAYER WISATA */}
        {showWisata && wisataGeoJson && (
          <GeoJSON 
            key={`wisata-gis-layer-${showWisata}-${showNearbyWisataOnly}-${focusedHalteLatLng?.lat || 'none'}-${dynamicRadius}`}
            data={wisataGeoJson} 
            style={() => ({ color: "rgba(255,255,255,0.2)", weight: 1.5, fillColor: "#e11d48", fillOpacity: 0.45 })} 
            filter={filterWisataFeatures}
            onEachFeature={onEachWisataFeature} 
          />
        )}

        {/* LAYER RUTE */}
        {routeGeoJson && (
          <GeoJSON 
            key={`route-gis-layer-${JSON.stringify(activeRoutes)}-${focusedRoute}`} 
            data={routeGeoJson} 
            style={getRouteStyle} 
            filter={filterRouteFeatures}
            onEachFeature={onEachRouteFeature}
          />
        )}

        {/* LAYER HALTE */}
        {halteGeoJson && (
          <GeoJSON 
            key={`halte-gis-layer-${JSON.stringify(showHalte)}-${focusedRoute}-${focusedHalteLatLng?.lat || 'none'}`} 
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