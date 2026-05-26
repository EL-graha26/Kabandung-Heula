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
  
  // State untuk Active Mode (Highlight)
  const [focusedRoute, setFocusedRoute] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  // Stats for Floating HUD
  const [visibleStopsCount, setVisibleStopsCount] = useState(0);
  const [activeRoutesCount, setActiveRoutesCount] = useState(0);

  const colorBrt = "#10b981"; // Emerald
  const colorBus = "#06b6d4"; // Cyan
  const colorAngkot = "#f59e0b"; // Amber

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

        // Inisialisasi Active Routes
        if (resRoute.data?.features) {
          const initialActive = {};
          resRoute.data.features.forEach(f => {
            const nama = f.properties?.nama_rute;
            if (nama) initialActive[nama] = true;
          });
          setActiveRoutes(initialActive);
        }
      } catch (error) {
        console.error("Gagal memuat data GIS", error);
      }
    };
    fetchData();
  }, []);

  // Hitung statistik dinamis
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
    if (!namaRute) return true; 
    // Sembunyikan sepenuhnya jika di-uncheck
    return activeRoutes[namaRute] === true;
  };

  const filterHalteFeatures = (feature) => {
    // Halte hanya muncul jika ada rute terkait yang aktif
    const ruteTerkait = feature.properties?.rute_terkait || [];
    if (ruteTerkait.length === 0) return true; // Tampilkan halte tanpa rute
    
    // Kembalikan true jika minimal 1 rute terkait berstatus 'true' di activeRoutes
    return ruteTerkait.some(rute => activeRoutes[rute] === true);
  };

  // ==========================================
  // STYLING RUTE (ACTIVE MODE)
  // ==========================================
  const getRouteStyle = (feature) => {
    const jenis = String(feature.properties?.jenis).toLowerCase();
    const nama = feature.properties?.nama_rute;
    
    let defaultColor = colorBus;
    if (jenis === "brt") defaultColor = colorBrt; 
    if (jenis === "angkot") defaultColor = colorAngkot; 

    // Jika ada route yang di-focus (Active Route Mode)
    let opacity = 0.8;
    let weight = 5;
    if (focusedRoute) {
      if (focusedRoute === nama) {
        opacity = 1;
        weight = 8; // Glow terang
      } else {
        opacity = 0.2; // Redupkan yang lain
        weight = 3;
      }
    }

    return { color: defaultColor, weight: weight, opacity: opacity, className: 'glowing-route' };
  };

  // ==========================================
  // CUSTOM MARKER & SMART HUD POPUP
  // ==========================================
  const createHalteIcon = (jenisStr, isFocused) => {
    let cls = "marker-halte";
    if (jenisStr === "brt") cls += " brt";
    else if (jenisStr === "bus") cls += " bus";
    else if (jenisStr === "angkot") cls += " angkot";
    else cls += " bus"; // default

    if (isFocused) cls += " active";

    const iconHtml = renderToString(
      <div className={cls} style={{ width: '24px', height: '24px' }}>
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
    
    // Cek apakah halte ini dilewati rute yang difokuskan
    const ruteTerkait = feature.properties?.rute_terkait || [];
    const isFocused = focusedRoute ? ruteTerkait.includes(focusedRoute) : false;

    const marker = L.marker(latlng, { icon: createHalteIcon(jenis, isFocused) });
    const nearby = getNearbyWisata(latlng, 500); 
    
    let radarHtml = '';
    if (nearby.length > 0) {
      radarHtml = `
        <div class="radar-section">
          <div class="radar-title">Smart Radar 500m</div>
          <ul class="radar-list">
            ${nearby.slice(0, 3).map(w => `<li><span>${w.properties.nama_wisata}</span> <span>${w.distance}m</span></li>`).join('')}
            ${nearby.length > 3 ? `<li style="justify-content: center; color: #64748b; font-size: 10px; margin-top: 5px;">+${nearby.length - 3} destinasi lainnya</li>` : ''}
          </ul>
        </div>
      `;
    }

    const color = jenis === 'brt' ? colorBrt : jenis === 'angkot' ? colorAngkot : colorBus;
    const ruteStr = ruteTerkait.length > 0 ? ruteTerkait.join(", ") : "Tidak diketahui";

    const popupContent = `
      <div class="smart-hud-popup animate-fade-up">
        <div class="hud-header">
          <div class="hud-title">${feature.properties?.nama || 'Tanpa Nama'}</div>
          <div class="hud-badge" style="background: rgba(255,255,255,0.1); color: ${color}; border: 1px solid ${color}">${jenis}</div>
        </div>
        <div class="hud-body">
          <div class="hud-item"><span class="hud-item-label">Koridor</span><span class="hud-item-value" style="font-size:11px; text-align:right;">${ruteStr}</span></div>
          <div class="hud-item"><span class="hud-item-label">Status</span><span class="hud-item-value" style="color: #10b981;">Online</span></div>
          ${radarHtml}
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent, { minWidth: 280, maxWidth: 300, autoPan: false });
    return marker;
  };

  const onEachRouteFeature = (feature, layer) => {
    const nama = feature.properties?.nama_rute;
    layer.on({
      mouseover: (e) => { 
        if(!focusedRoute) e.target.setStyle({ weight: 8, opacity: 1 }); 
      },
      mouseout: (e) => { 
        if(!focusedRoute) e.target.setStyle({ weight: 5, opacity: 0.8 }); 
      },
      click: (e) => {
        // Toggle Fokus
        if (focusedRoute === nama) {
          setFocusedRoute(null);
        } else {
          setFocusedRoute(nama);
          // Optional: Fly to route bounds, but simpler just to highlight
        }
      }
    });
  };

  const onEachWisataFeature = (feature, layer) => {
    const nama = feature.properties?.nama_wisata || "Objek Wisata";
    
    layer.bindPopup(`
      <div class="smart-hud-popup">
        <div class="hud-header">
          <div class="hud-title">${nama}</div>
          <div class="hud-badge" style="background: rgba(6,182,212,0.1); color: #06b6d4; border: 1px solid #06b6d4">WISATA</div>
        </div>
      </div>
    `, { autoPan: false });

    layer.on({
      mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.9, weight: 2, color: colorBus }); },
      mouseout: (e) => { e.target.setStyle({ fillOpacity: 0.4, weight: 1, color: "rgba(255,255,255,0.5)" }); },
      click: (e) => {
        // Terbang ke lokasi wisata
        let latlng;
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          let latSum = 0, lngSum = 0;
          coords.forEach(c => { lngSum += c[0]; latSum += c[1]; });
          latlng = L.latLng(latSum / coords.length, lngSum / coords.length);
        } else if (feature.geometry.type === 'Point') {
          latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
        }
        
        if (latlng) {
          setFlyTarget({ latlng, zoom: 16 });
        }
      }
    });
  };

  const toggleRoute = (namaRute) => {
    setActiveRoutes(prev => ({ ...prev, [namaRute]: !prev[namaRute] }));
  };

  const toggleAccordion = (type) => {
    setAccordionOpen(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleAllInType = (type, state) => {
    if (!routeGeoJson || !routeGeoJson.features) return;
    const newActive = { ...activeRoutes };
    routeGeoJson.features.forEach(f => {
      if (String(f.properties?.jenis).toLowerCase() === type) {
        if (f.properties?.nama_rute) {
          newActive[f.properties.nama_rute] = state;
        }
      }
    });
    setActiveRoutes(newActive);
  };

  const groupedRoutes = { brt: [], bus: [], angkot: [] };
  if (routeGeoJson && routeGeoJson.features) {
    routeGeoJson.features.forEach(f => {
      const type = String(f.properties?.jenis).toLowerCase();
      if (groupedRoutes[type]) groupedRoutes[type].push(f);
    });
  }

  const getTileUrl = () => {
    if (layerType === 'satellite') return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (layerType === 'dark') return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  };

  const LegendIcon = ({ color }) => (
    <div style={{
      background: 'rgba(15, 23, 42, 0.8)',
      border: `2px solid ${color}`,
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 0 10px ${color}`,
      color: color,
      flexShrink: 0
    }}>
      <Bus size={12} />
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#020617' }}>
      
      {/* FLOATING SMART HUD (TENGAH ATAS) */}
      <div className="map-smart-hud animate-fade-up">
        <div className="hud-stat">
          <Activity size={16} color={colorBus} /> Rute Aktif <strong>{activeRoutesCount}</strong>
        </div>
        <div style={{width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)'}}></div>
        <div className="hud-stat">
          <MapPin size={16} color={colorBrt} /> Halte Terlihat <strong>{visibleStopsCount}</strong>
        </div>
        <div style={{width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)'}}></div>
        <div className="hud-stat">
          <Navigation size={16} color={colorAngkot} /> Mode <strong>{focusedRoute ? 'FOKUS' : 'GLOBAL'}</strong>
        </div>
        {focusedRoute && (
          <button 
            onClick={() => setFocusedRoute(null)}
            style={{background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.5)', color: '#f43f5e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', marginLeft: '10px'}}
          >
            Reset Fokus
          </button>
        )}
      </div>

      {/* KIRI ATAS: BACK & LAYER CONTROLS */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link to="/home" className="glass-panel" style={{ color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', transition: '0.3s' }}>
          <ArrowLeft size={18} /> Beranda
        </Link>
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => setLayerType('default')} style={{ background: 'transparent', border: 'none', color: layerType === 'default' ? 'white' : '#64748b', cursor: 'pointer', transition: '0.3s' }}>
            <MapIcon size={22} />
          </button>
          <button onClick={() => setLayerType('dark')} style={{ background: 'transparent', border: 'none', color: layerType === 'dark' ? colorBus : '#64748b', cursor: 'pointer', transition: '0.3s' }}>
             <Moon size={22} />
          </button>
          <button onClick={() => setLayerType('satellite')} style={{ background: 'transparent', border: 'none', color: layerType === 'satellite' ? 'white' : '#64748b', cursor: 'pointer', transition: '0.3s' }}>
            <Layers size={22} />
          </button>
        </div>
      </div>

      {/* KIRI BAWAH: LEGEND */}
      <div className="glass-panel animate-fade-up" style={{
        position: 'absolute', bottom: '30px', left: '24px', zIndex: 1000,
        padding: '20px', minWidth: '200px'
      }}>
        <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Legend</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <LegendIcon color={colorBrt} />
             <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Trans Metro</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <LegendIcon color={colorBus} />
             <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Bandros</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <LegendIcon color={colorAngkot} />
             <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Angkot</span>
          </div>
        </div>
      </div>

      {/* KANAN ATAS: TOMBOL FILTER */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 1000 }}>
        <button 
          className="glass-panel"
          style={{ padding: '14px 24px', color: 'white', border: `1px solid ${colorBus}`, fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.3s', boxShadow: `0 0 20px rgba(6, 182, 212, 0.3)` }} 
          onClick={() => setOpenModal(true)}
        >
          <Filter size={18} color={colorBus} /> Manajemen Rute
        </button>
      </div>

      {/* MODAL FILTER HUD */}
      {openModal && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(20px)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="animate-fade-up" style={{
            background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)',
            width: '90%', maxWidth: '500px', maxHeight: '80vh', borderRadius: '24px',
            display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '700' }}>Dashboard Rute</h2>
                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '13px' }}>Atur visibilitas rute dan sinkronisasi halte otomatis</p>
              </div>
              <button onClick={() => setOpenModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                const renderBlock = (type, title, color) => (
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', borderRadius: '16px', border: `1px solid rgba(255,255,255,0.05)` }}>
                    <div onClick={() => toggleAccordion(type)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'white', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}`}}></div>
                        {title}
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
                          const isActive = activeRoutes[name];
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

      {/* RENDER PETA */}
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

        {wisataGeoJson && (
          <GeoJSON 
            data={wisataGeoJson} 
            style={() => ({ color: "rgba(255,255,255,0.2)", weight: 1, fillColor: "#0f172a", fillOpacity: 0.5 })} 
            onEachFeature={onEachWisataFeature} 
            pointToLayer={(f, latlng) => L.marker(latlng, { icon: createWisataIcon() })}
          />
        )}

        {routeGeoJson && (
          <GeoJSON 
            key={`route-${JSON.stringify(activeRoutes)}-${focusedRoute}`} 
            data={routeGeoJson} 
            style={getRouteStyle} 
            filter={filterRouteFeatures}
            onEachFeature={onEachRouteFeature}
          />
        )}

        {halteGeoJson && (
          <GeoJSON 
            key={`halte-${JSON.stringify(activeRoutes)}-${focusedRoute}`} 
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