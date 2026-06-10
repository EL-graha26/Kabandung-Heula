import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Link, useLocation } from "react-router-dom";
import L from "leaflet";
import api from "../api";
import "./MapView.css";
import {
  Bus,
  ArrowLeft,
  Layers,
  ArrowRight,
  Map as MapIcon,
  Moon,
  CheckSquare,
  Square,
  X,
  Filter,
  Activity,
  MapPin,
  Navigation,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  Lock,
  Eye,
  EyeOff,
  Users,
  LogOut,
  Plus
} from "lucide-react";
import { renderToString } from "react-dom/server";

import bandrosImg from "../assets/asset_bandung/Transportasi/bandros.jpg";
import tmbImg from "../assets/asset_bandung/Transportasi/trans metro bandung.jpg";
import angkotImg from "../assets/asset_bandung/Transportasi/angkot.png";

// KOMPONEN PENGENDALI FLY-TO PETA
function MapController({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget) {
      map.flyTo(flyTarget.latlng, flyTarget.zoom, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [flyTarget, map]);
  return null;
}

// KOMPONEN PENDETEKSI KLIK PETA
function MapEventHandler({ onMapClick }) {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });
  return null;
}

// KOMPONEN CUSTOM UI: TOGGLE SWITCH
const CustomToggle = ({ checked, onChange, color }) => (
  <div
    onClick={onChange}
    style={{
      width: "40px",
      height: "22px",
      borderRadius: "12px",
      background: checked ? color : "rgba(0,0,0,0.1)",
      border: `1px solid ${checked ? color : "rgba(0,0,0,0.1)"}`,
      position: "relative",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        background: "#ffffff",
        position: "absolute",
        top: "2px",
        left: checked ? "20px" : "2px",
        transition: "left 0.3s ease, transform 0.3s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    ></div>
  </div>
);

// page peta
function MapView() {
  const BASE_RADIUS = 3500;

  // State Map & UI
  const [openModal, setOpenModal] = useState(false);
  const [layerType, setLayerType] = useState("default");
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

  const location = useLocation();
  const isPreview = new URLSearchParams(location.search).get("preview") === "true";

  // State Autentikasi (Admin)
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // --- STATE CRUD ADMIN ---
  const [crudModal, setCrudModal] = useState({
    open: false,
    action: "", // 'edit', 'tambah', 'delete'
    type: "",   // 'halte', 'rute', 'wisata'
    id: null,
    formData: {}
  });

  // Fungsi Tarik Data Peta
  const fetchData = useCallback(async () => {
    try {
      const [resRoute, resHalte, resWisata] = await Promise.all([
        api.get("/rute/data/geojson"),
        api.get("/halte/data/geojson"),
        api.get("/objek-wisata/data/geojson"),
      ]);

      setRouteGeoJson(resRoute.data);
      setHalteGeoJson(resHalte.data);
      setWisataGeoJson(resWisata.data);

      if (resRoute.data?.features) {
        const initialActive = {};
        resRoute.data.features.forEach((f) => {
          const nama = f.properties?.nama_rute;
          if (nama) initialActive[nama.trim()] = true;
        });
        setActiveRoutes((prev) => Object.keys(prev).length === 0 ? initialActive : prev);
      }
    } catch (error) {
      console.error("Gagal memuat data GIS", error);
    }
  }, []);

  // Ambil data pertama kali & set status Admin
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAdmin(true);
    fetchData();
  }, [fetchData]);

  // Hooking tombol di pop-up Leaflet ke state React
  useEffect(() => {
    window.handleAdminAction = (action, type, id) => {
      setCrudModal({ 
        open: true, 
        action: action, 
        type: type, 
        id: id, 
        formData: {} 
      });
    };
    return () => {
      delete window.handleAdminAction;
    };
  }, []);

  // Efek untuk menarik data lama ke dalam form
  useEffect(() => {
    if (crudModal.open && crudModal.action === "edit" && crudModal.id) {
      let feature = null;
      if (crudModal.type === "halte" && halteGeoJson) {
        feature = halteGeoJson.features.find((f) => String(f.properties?.id_halte) === String(crudModal.id) || String(f.properties?.kode) === String(crudModal.id));
      } else if (crudModal.type === "rute" && routeGeoJson) {
        feature = routeGeoJson.features.find((f) => String(f.properties?.id_rute) === String(crudModal.id) || String(f.properties?.kode_rute) === String(crudModal.id));
      } else if (crudModal.type === "wisata" && wisataGeoJson) {
        feature = wisataGeoJson.features.find((f) => String(f.properties?.id_wisata) === String(crudModal.id) || String(f.properties?.kode_wisata) === String(crudModal.id));
      }

      if (feature && feature.properties) {
        const data = { ...feature.properties };
        // Ekstrak koordinat untuk diedit jika point
        if (feature.geometry?.type === "Point") {
          data.longitude = feature.geometry.coordinates[0];
          data.latitude = feature.geometry.coordinates[1];
        }
        setCrudModal((prev) => ({ ...prev, formData: data }));
      }
    }
  }, [crudModal.open, crudModal.action, crudModal.id, crudModal.type, halteGeoJson, routeGeoJson, wisataGeoJson]);

  // Fungsi untuk menangani ketikan user di form
  const handleCrudChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCrudModal((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  // -------------------------------------------------------------
  // FUNGSI SUBMIT CRUD (TERHUBUNG KE BACKEND)
  // -------------------------------------------------------------
  const handleCrudSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      const { action, type, id, formData } = crudModal;
      
      // Penentuan endpoint sesuai dengan tipe data
      let endpoint = "";
      if (type === "halte") endpoint = "/halte";
      else if (type === "rute") endpoint = "/rute";
      else if (type === "wisata") endpoint = "/objek-wisata";

      // Konfigurasi Header Otorisasi JWT
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (action === "edit") {
        await api.put(`${endpoint}/${id}`, formData, config);
        alert(`Sukses! Data ${type} berhasil diperbarui.`);
      } else if (action === "tambah") {
        await api.post(endpoint, formData, config);
        alert(`Sukses! Data ${type} berhasil ditambahkan.`);
      } else if (action === "delete") {
        await api.delete(`${endpoint}/${id}`, config);
        alert(`Sukses! Data ${type} berhasil dihapus.`);
      }

      setCrudModal({ ...crudModal, open: false });
      fetchData(); 
      
    } catch (error) {
      console.error(error);
      const detailError = error.response?.data?.detail || "Terjadi kesalahan server";
      alert(`Gagal memproses data: ${detailError}`);
    }
  };

  const [accords, setAccords] = useState({ basemap: false, wisata: true, halte: true, rute: false });
  const toggleAccordion = (key) => setAccords((prev) => ({ ...prev, [key]: !prev[key] }));

  const colorBrt = "#3b82f6";
  const colorBus = "#f97316";
  const colorAngkot = "#10b981";

  // Fungsi Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    
    const formData = new FormData();
    formData.append('username', e.target["admin-email"].value);
    formData.append('password', e.target["admin-password"].value);

    try {
      const response = await api.post("/auth/login", formData);
      localStorage.setItem("token", response.data.access_token);
      setIsAdmin(true);
      closeLogin();
    } catch (error) {
      setLoginError("Kredensial tidak valid atau server bermasalah.");
    }
  };

  const closeLogin = () => {
    setShowLogin(false);
    setLoginError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAdmin(false);
  };

  const handleMapClick = () => {
    setFocusedRoute(null);
    setFocusedHalteLatLng(null);
    setDynamicRadius(BASE_RADIUS);
  };

  const getNearbyWisata = (halteLatLng, initialRadius = BASE_RADIUS) => {
    if (!wisataGeoJson?.features || !showWisata) return { nearby: [], radiusUsed: initialRadius };

    const allWisataWithDistance = wisataGeoJson.features
      .map((feature) => {
        let centroid = halteLatLng;
        if (feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon") {
          const coords = feature.geometry.type === "Polygon"
              ? feature.geometry.coordinates[0]
              : feature.geometry.coordinates[0][0];
          let latSum = 0, lngSum = 0;
          coords.forEach((c) => { lngSum += c[0]; latSum += c[1]; });
          centroid = L.latLng(latSum / coords.length, lngSum / coords.length);
        } else if (feature.geometry?.type === "Point") {
          centroid = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
        }
        return {
          ...feature,
          distance: Math.round(halteLatLng.distanceTo(centroid)),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    if (allWisataWithDistance.length === 0) return { nearby: [], radiusUsed: initialRadius };

    let nearby = allWisataWithDistance.filter((w) => w.distance <= initialRadius);
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
    let type = "bus";
    if (jenis.includes("brt") || jenis.includes("trans")) type = "brt";
    else if (jenis.includes("angkot")) type = "angkot";
    return showHalte[type] === true;
  };

  const filterWisataFeatures = (feature) => {
    if (!showNearbyWisataOnly) return true;
    if (!focusedHalteLatLng) return false;
    let centroid = focusedHalteLatLng;
    if (feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon") {
      const coords = feature.geometry.type === "Polygon"
          ? feature.geometry.coordinates[0]
          : feature.geometry.coordinates[0][0];
      let latSum = 0, lngSum = 0;
      coords.forEach((c) => { lngSum += c[0]; latSum += c[1]; });
      centroid = L.latLng(latSum / coords.length, lngSum / coords.length);
    } else if (feature.geometry?.type === "Point") {
      centroid = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
    }
    const distance = focusedHalteLatLng.distanceTo(centroid);
    return distance <= dynamicRadius + 50;
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
      if (focusedRoute === nama) { opacity = 1; weight = 8; } 
      else { opacity = 0.15; weight = 3; }
    }
    return { color: defaultColor, weight: weight, opacity: opacity };
  };

  const createHalteIcon = (jenisStr, isFocused) => {
    let cls = "marker-halte";
    const lowerJenis = String(jenisStr || "").toLowerCase();
    let defaultColor = colorBus;

    if (lowerJenis.includes("brt") || lowerJenis.includes("trans")) { cls += " brt"; defaultColor = colorBrt; } 
    else if (lowerJenis.includes("bus") || lowerJenis.includes("bandros")) { cls += " bus"; defaultColor = colorBus; } 
    else if (lowerJenis.includes("angkot")) { cls += " angkot"; defaultColor = colorAngkot; } 
    else cls += " bus";

    if (isFocused) cls += " active";
    const iconHtml = renderToString(
      <div className={cls} style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: defaultColor, borderRadius: "50%", border: "2px solid white", boxShadow: "0 2px 5px rgba(0,0,0,0.3)" }}>
        <Bus size={12} color="white" />
      </div>
    );
    return L.divIcon({ html: iconHtml, className: "", iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] });
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} KM`;
    return `${(meters / 1000).toFixed(2)} KM`; 
  };

  const haltePointToLayer = (feature, latlng) => {
    const jenis = feature.properties?.jenis || "-";
    const nama = feature.properties?.nama || "Tanpa Nama";
    const jamMulai = feature.properties?.jam_operasi_mulai || "-";
    const jamSelesai = feature.properties?.jam_operasi_selesai || "-";
    const aktif = feature.properties?.aktif !== false ? "Aktif" : "Tidak Aktif";
    
    const lowerJenis = String(jenis).toLowerCase();
    const fallbackImg = lowerJenis.includes("brt") || lowerJenis.includes("trans") ? tmbImg : lowerJenis.includes("angkot") ? angkotImg : bandrosImg;
    const imgUrl = feature.properties?.gambar_url || fallbackImg;
    const ruteTerkait = feature.properties?.rute_terkait || [];
    
    const isFocused = (focusedRoute && ruteTerkait.includes(focusedRoute)) || (focusedHalteLatLng && focusedHalteLatLng.equals(latlng));
    const marker = L.marker(latlng, { icon: createHalteIcon(jenis, isFocused) });
    const { nearby, radiusUsed } = getNearbyWisata(latlng, BASE_RADIUS);
    const color = lowerJenis.includes("brt") || lowerJenis.includes("trans") ? colorBrt : lowerJenis.includes("angkot") ? colorAngkot : colorBus;

    let radarHtml = "";
    if (nearby.length > 0) {
      radarHtml = `
        <div class="radar-tourism-section">
          <div class="radar-tourism-title">
            <span>📍 Wisata Terdekat</span>
            <span style="font-weight: 500; font-size: 9px; color: #94a3b8;">Max ${(radiusUsed / 1000).toFixed(1)} KM</span>
          </div>
          <div class="radar-tourism-list">
            ${nearby.slice(0, 3).map((w) => `
              <div class="radar-tourism-item">
                <span class="radar-tourism-name">${w.properties?.nama_wisata || "Wisata"}</span>
                <span class="radar-tourism-dist">${formatDistance(w.distance)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    let adminHtml = "";
    if (isAdmin) {
      const id = feature.properties?.id_halte || feature.properties?.id || "unknown";
      adminHtml = `
        <div style="display:flex; gap:8px; margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:12px;">
          <button onclick="window.handleAdminAction('edit', 'halte', '${id}')" style="flex:1; padding:6px; background:#f59e0b; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">✏️ Edit</button>
          <button onclick="window.handleAdminAction('delete', 'halte', '${id}')" style="flex:1; padding:6px; background:#ef4444; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">🗑️ Hapus</button>
        </div>
      `;
    }

    const popupContent = `
      <div class="premium-halte-popup">
        <div class="premium-popup-header">
          <img src="${imgUrl}" alt="${nama}" class="premium-popup-img" />
          <div class="premium-popup-gradient"></div>
        </div>
        <div class="premium-popup-body">
          <div class="premium-popup-title-row">
            <h3 class="premium-popup-name">${nama}</h3>
            <span class="premium-popup-status ${aktif === "Aktif" ? "status-aktif" : "status-nonaktif"}">${aktif}</span>
          </div>
          <div class="premium-popup-meta">
            <div class="meta-row">
              <span class="meta-label">🚍 Moda</span>
              <span class="badge-moda" style="background: ${color};">${jenis}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">🕒 Operasi</span>
              <strong style="color: #334155;">${jamMulai} - ${jamSelesai}</strong>
            </div>
          </div>
          ${radarHtml}
          ${adminHtml}
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, { minWidth: 280, maxWidth: 320, offset: [0, -12] });
    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      setFocusedHalteLatLng(latlng);
      setDynamicRadius(radiusUsed);
    });
    return marker;
  };

  const onEachRouteFeature = (feature, layer) => {
    const nama = feature.properties?.nama_rute || "Trayek Tanpa Nama";
    const kode = feature.properties?.kode_rute || "-";
    const jenis = feature.properties?.jenis || "-";
    const lowerJenis = String(jenis).toLowerCase();
    const color = lowerJenis.includes("brt") || lowerJenis.includes("trans") ? colorBrt : lowerJenis.includes("angkot") ? colorAngkot : colorBus;

    let adminHtml = "";
    if (isAdmin) {
      const id = feature.properties?.id_rute || feature.properties?.id || "unknown";
      adminHtml = `
        <div style="display:flex; gap:8px; margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:12px;">
          <button onclick="window.handleAdminAction('edit', 'rute', '${id}')" style="flex:1; padding:6px; background:#f59e0b; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">✏️ Edit</button>
          <button onclick="window.handleAdminAction('delete', 'rute', '${id}')" style="flex:1; padding:6px; background:#ef4444; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">🗑️ Hapus</button>
        </div>
      `;
    }

    const popupContent = `
      <div class="smart-hud-popup" style="font-family: 'Inter', sans-serif; color: #334155; min-width: 200px; padding: 12px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 10px 0; color: ${color}; font-size: 14px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 8px; font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
          <span>🚌 ${nama}</span>
          <span style="font-size: 10px; font-weight: 600; background: ${color}20; color: ${color}; padding: 3px 6px; border-radius: 4px;">${jenis}</span>
        </h4>
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; color: #64748b;">
          <div style="display:flex; justify-content:space-between;">
            <span>Kode Trayek:</span> 
            <strong style="color: #1e293b;">${kode}</strong>
          </div>
          ${adminHtml}
        </div>
      </div>
    `;

    layer.bindPopup(popupContent, { maxWidth: 300 });
    layer.on({
      mouseover: (e) => { if (!focusedRoute) e.target.setStyle({ weight: 8, opacity: 1 }); },
      mouseout: (e) => { if (!focusedRoute) e.target.setStyle({ weight: 5, opacity: 0.8 }); },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        setFocusedRoute((prev) => (prev === nama ? null : nama));
      },
    });

    if (focusedRoute === nama) {
      setTimeout(() => {
        if (layer && layer._map) {
          if (layer.getBounds) layer.openPopup(layer.getBounds().getCenter());
          else layer.openPopup();
        }
      }, 250);
    }
  };

  const onEachWisataFeature = (feature, layer) => {
    const nama = feature.properties?.nama_wisata || "Objek Wisata";
    const kode = feature.properties?.kode_wisata || "-";
    const deskripsi = feature.properties?.deskripsi || "-";

    let adminHtml = "";
    if (isAdmin) {
      const id = feature.properties?.id_wisata || feature.properties?.id || "unknown";
      adminHtml = `
        <div style="display:flex; gap:8px; margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:12px;">
          <button onclick="window.handleAdminAction('edit', 'wisata', '${id}')" style="flex:1; padding:6px; background:#f59e0b; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">✏️ Edit</button>
          <button onclick="window.handleAdminAction('delete', 'wisata', '${id}')" style="flex:1; padding:6px; background:#ef4444; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">🗑️ Hapus</button>
        </div>
      `;
    }

    const popupContent = `
      <div class="smart-hud-popup" style="font-family: 'Inter', sans-serif; color: #334155; max-width: 260px; background: white; border-radius: 12px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05);">
        <div class="hud-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 6px; margin-bottom: 6px;">
          <div class="hud-title" style="font-weight: 700; font-size: 14px; color: #f43f5e;">🏛️ ${nama}</div>
          <div class="hud-badge" style="background: rgba(244,63,94,0.1); color: #f43f5e; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">WISATA</div>
        </div>
        <div class="hud-body" style="font-size: 11px; display: flex; flex-direction: column; gap: 4px; color: #64748b;">
          <div style="display:flex; justify-content:space-between;"><span>Kode Wisata:</span> <strong style="color: #1e293b;">${kode}</strong></div>
          <div style="margin-top: 6px; line-height: 1.4; color: #64748b; border-top: 1px dashed rgba(0,0,0,0.05); padding-top: 6px; text-align: justify;">
            <strong>Deskripsi:</strong><br/> ${deskripsi}
          </div>
          ${adminHtml}
        </div>
      </div>
    `;
    layer.bindPopup(popupContent, { maxWidth: 300 });
    layer.on({
      mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.8, weight: 2, color: "#f43f5e" }); },
      mouseout: (e) => { e.target.setStyle({ fillOpacity: 0.4, weight: 1, color: "transparent" }); },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        let latlng;
        if (feature.geometry.type === "Polygon") {
          const coords = feature.geometry.coordinates[0];
          let latSum = 0, lngSum = 0;
          coords.forEach((c) => { lngSum += c[0]; latSum += c[1]; });
          latlng = L.latLng(latSum / coords.length, lngSum / coords.length);
        }
        if (latlng) setFlyTarget({ latlng, zoom: 16 });
      },
    });
  };

  const groupedRoutes = { brt: [], angkot: [] };
  if (routeGeoJson && routeGeoJson.features) {
    routeGeoJson.features.forEach((f) => {
      const type = String(f.properties?.jenis || "").toLowerCase();
      if (type.includes("brt") || type.includes("trans")) groupedRoutes.brt.push(f);
      else if (type.includes("angkot")) groupedRoutes.angkot.push(f);
    });
  }

  const toggleRoute = (namaRute) => {
    if (!namaRute) return;
    setActiveRoutes((prev) => ({ ...prev, [namaRute.trim()]: !prev[namaRute.trim()] }));
  };

  const toggleAllRoutesInType = (type, state) => {
    if (!groupedRoutes[type]) return;
    const newActive = { ...activeRoutes };
    groupedRoutes[type].forEach((f) => {
      if (f.properties?.nama_rute) newActive[f.properties.nama_rute.trim()] = state;
    });
    setActiveRoutes(newActive);
  };

  const getTileUrl = () => {
    if (layerType === "satellite") return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (layerType === "dark") return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  };

  return (
    <div className={`map-page-wrapper ${isPreview ? "is-preview-mode" : ""}`}>
      {!isPreview && (
        <aside className={`map-sidebar-premium ${openModal ? "open" : ""}`}>
        <div className="sidebar-header-top">
          <Link to="/home" className="sidebar-back-link">
            <ArrowLeft size={15} /> Kembali
          </Link>
          <div className="sidebar-brand">
            <div>
              <div className="sidebar-brand-name">Kabandung Heula</div>
              <div className="sidebar-brand-sub">Peta Interaktif</div>
            </div>
          </div>
          <button className="sidebar-close-mobile" onClick={() => setOpenModal(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-scrollable">
          {/* ACCORDION: BASEMAP */}
          <div>
            <div className="accordion-header" onClick={() => toggleAccordion("basemap")}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapIcon size={16} color="var(--color-primary)" /> Pilihan Peta
              </div>
              {accords.basemap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <div className={`accordion-body ${accords.basemap ? "open" : ""}`}>
              <div className="basemap-toggle-group">
                <button onClick={() => setLayerType("default")} className={`basemap-btn ${layerType === "default" ? "active" : ""}`}>
                  <MapIcon size={16} /> Standard
                </button>
                <button onClick={() => setLayerType("dark")} className={`basemap-btn ${layerType === "dark" ? "active" : ""}`}>
                  <Moon size={16} /> Dark
                </button>
                <button onClick={() => setLayerType("satellite")} className={`basemap-btn ${layerType === "satellite" ? "active" : ""}`}>
                  <Layers size={16} /> Satellite
                </button>
              </div>
            </div>
          </div>

          {/* ACCORDION: TRANSPORTASI */}
          <div>
            <div className="accordion-header" onClick={() => toggleAccordion("halte")}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bus size={16} color={colorBrt} /> Filter Transportasi
              </div>
              {accords.halte ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <div className={`accordion-body ${accords.halte ? "open" : ""}`}>
              <h3 className="sidebar-section-title" style={{ marginTop: "8px" }}>
                Stasiun & Halte
              </h3>
              <div className="sidebar-card halte-card-group">
                {["brt", "bus", "angkot"].map((type, idx) => (
                  <div key={type} className="halte-card-item" style={{ borderBottom: idx < 2 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: type === "brt" ? colorBrt : type === "bus" ? colorBus : colorAngkot }}></div>
                      <span style={{ color: "#334155", fontSize: "13px", fontWeight: "600" }}>
                        {type === "brt" ? "Trans Metro" : type === "bus" ? "Bandros" : "Angkutan Kota"}
                      </span>
                    </div>
                    <CustomToggle
                      checked={showHalte[type]}
                      onChange={() => setShowHalte({ ...showHalte, [type]: !showHalte[type] })}
                      color={type === "brt" ? colorBrt : type === "bus" ? colorBus : colorAngkot}
                    />
                  </div>
                ))}
              </div>

              <h3 className="sidebar-section-title" style={{ marginTop: "16px" }}>
                Lintasan Rute
              </h3>
              {["brt", "angkot"].map((type) => {
                const title = type === "brt" ? "Trans Metro Bandung" : "Angkutan Kota";
                const color = type === "brt" ? colorBrt : colorAngkot;
                const isAllActive = groupedRoutes[type]?.length > 0 && groupedRoutes[type].every((r) => activeRoutes[r.properties?.nama_rute?.trim()]);

                return (
                  <div key={type} className="sidebar-card rute-card-group">
                    <div className="rute-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <CustomToggle checked={isAllActive} onChange={() => toggleAllRoutesInType(type, !isAllActive)} color={color} />
                        <span style={{ color: "#334155", fontSize: "13px", fontWeight: "600" }}>{title}</span>
                      </div>
                    </div>
                    <div className="rute-card-body">
                      {groupedRoutes[type]?.map((route, idx) => {
                        const name = route.properties?.nama_rute?.trim();
                        const isActive = activeRoutes[name];
                        return (
                          <div key={idx} onClick={() => toggleRoute(name)} className="route-item-modern" style={{ display: "flex", alignItems: "flex-start", padding: "8px 0", cursor: "pointer" }}>
                            <div style={{ marginTop: "2px" }}>
                              {isActive ? <CheckSquare size={16} color={color} /> : <Square size={16} color="#94a3b8" />}
                            </div>
                            <span style={{ color: isActive ? "#334155" : "#64748b", marginLeft: "10px", fontSize: "12px", fontWeight: isActive ? "600" : "400" }}>
                              {name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACCORDION: PARIWISATA */}
          <div>
            <div className="accordion-header" onClick={() => toggleAccordion("wisata")}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={16} color="#f43f5e" /> Filter Wisata
              </div>
              {accords.wisata ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <div className={`accordion-body ${accords.wisata ? "open" : ""}`}>
              <div className="sidebar-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontSize: "13px", fontWeight: "600" }}>Kawasan Wisata</span>
                  <CustomToggle
                    checked={showWisata}
                    onChange={() => {
                      setShowWisata(!showWisata);
                      if (showWisata) setShowNearbyWisataOnly(false);
                    }}
                    color="#f43f5e"
                  />
                </div>

                {showWisata && (
                  <div style={{ marginTop: "16px", padding: "12px 10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                      <span>Radius Jangkauan</span>
                      <span>{(dynamicRadius / 1000).toFixed(1)} KM</span>
                    </div>
                    <input 
                      type="range" min="1000" max="5000" step="500" value={dynamicRadius}
                      onChange={(e) => setDynamicRadius(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#f43f5e" }}
                    />
                    
                    <div onClick={() => setShowNearbyWisataOnly(!showNearbyWisataOnly)} className="route-item-modern" style={{ display: "flex", alignItems: "flex-start", padding: "8px 0", marginTop: "8px", cursor: "pointer" }}>
                      <div style={{ marginTop: "2px" }}>
                        {showNearbyWisataOnly ? <CheckSquare size={16} color="#f43f5e" /> : <Square size={16} color="#94a3b8" />}
                      </div>
                      <span style={{ color: showNearbyWisataOnly ? "#334155" : "#64748b", marginLeft: "10px", fontSize: "11px", fontWeight: showNearbyWisataOnly ? "600" : "400", lineHeight: "1.4" }}>
                        Hanya wisata di dalam radius
                      </span>
                    </div>

                    {showNearbyWisataOnly && !focusedHalteLatLng && (
                      <div style={{ padding: "8px 10px", background: "rgba(244, 63, 94, 0.05)", color: "#e11d48", fontSize: "11px", borderRadius: "6px", border: "1px solid rgba(244, 63, 94, 0.2)", marginTop: "8px", lineHeight: "1.4" }}>
                        <Info size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px", position: "relative", top: "-1px" }} />
                        Klik halte di peta untuk melihat objek wisata terdekat.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ height: "40px" }}></div>
        </div>
      </aside>
      )}

      <main className="map-container-main">
        {/* HUD/TOP BAR untuk Mobile & Admin Status */}
        {!isPreview && (
          <div className="map-top-bar">
            <button className="sidebar-toggle-btn" onClick={() => setOpenModal(true)}>
              <Filter size={16} /> Layer Filter
            </button>

            <div className="map-smart-hud">
              <div className="hud-stat">
                <MapPin size={14} color={colorBrt} /> <strong>Halte</strong>
              </div>
              <div className="hud-divider"></div>
              <div className="hud-stat">
                <Bus size={14} color={colorBus} /> <strong>Rute</strong>
              </div>
              <div className="hud-divider"></div>
              <div className="hud-stat">
                <Activity size={14} color="#f43f5e" /> <strong>Wisata</strong>
              </div>
              {(focusedRoute || focusedHalteLatLng) && (
                <>
                  <div className="hud-divider"></div>
                  <button className="hud-reset-btn" onClick={handleMapClick}>
                    Reset Fokus
                  </button>
                </>
              )}

              {/* INDIKATOR ADMIN / TOMBOL LOGIN */}
              <div className="hud-divider"></div>
              {isAdmin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                    ✓ Mode Admin
                  </span>
                  <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                    <LogOut size={14} /> Keluar
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowLogin(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
                  <Lock size={14} /> Login Admin
                </button>
              )}

            </div>
          </div>
        )}

        {/* FLOATING UI OVERLAY */}
        {!isPreview && (
          <div className="floating-ui-container">
            <div className="floating-search-bar">
              <Search size={18} color="#9ca3af" />
              <input type="text" className="floating-search-input" placeholder="Cari halte, rute, atau wisata..." />
            </div>

            <div className="floating-legend">
              <span style={{ color: "#1f2937" }}>Legenda</span>
              <div className="legend-item"><div className="legend-color" style={{ background: colorBrt }}></div> Trans Metro</div>
              <div className="legend-item"><div className="legend-color" style={{ background: colorBus }}></div> Bandros</div>
              <div className="legend-item"><div className="legend-color" style={{ background: colorAngkot }}></div> Angkot</div>
              <div className="legend-item"><div className="legend-color" style={{ background: "#64748b" }}></div> Halte</div>
              <div className="legend-item"><MapPin size={14} color="#f43f5e" /> Wisata</div>
            </div>
          </div>
        )}

        {/* TOMBOL TAMBAH DATA (HANYA ADMIN) */}
        {isAdmin && !isPreview && (
          <div style={{ position: 'absolute', bottom: '30px', right: '30px', zIndex: 1000 }}>
            <button 
              onClick={() => setCrudModal({ open: true, action: 'tambah', type: 'halte', id: null, formData: {} })}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
            >
              <Plus size={18} /> Tambah Data Baru
            </button>
          </div>
        )}

        {/* LEAFLET MAP */}
        <MapContainer center={[-6.914744, 107.60981]} zoom={13} className="leaflet-fullscreen" zoomControl={false} ref={mapRef} style={{ width: "100%", height: "100%", zIndex: 10 }}>
          <MapController flyTarget={flyTarget} />
          <MapEventHandler onMapClick={handleMapClick} />
          <TileLayer url={getTileUrl()} attribution="&copy; WebGIS Transportasi Bandung" />
          
          {focusedHalteLatLng && (
            <Circle center={focusedHalteLatLng} radius={dynamicRadius} pathOptions={{ color: "#f43f5e", weight: 2, dashArray: "10, 10", fillColor: "#f43f5e", fillOpacity: 0.05 }} />
          )}

          {showWisata && wisataGeoJson && (
            <GeoJSON
              key={`wisata-gis-layer-${showWisata}-${showNearbyWisataOnly}-${focusedHalteLatLng?.lat || "none"}-${dynamicRadius}`}
              data={wisataGeoJson}
              style={(feature) => {
                let isInside = false;
                if (focusedHalteLatLng) {
                  let centroid = focusedHalteLatLng;
                  if (feature.geometry?.type === "Point") {
                    centroid = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                  } else {
                    const coords = feature.geometry.type === "Polygon" ? feature.geometry.coordinates[0] : feature.geometry.coordinates[0][0];
                    let latSum = 0, lngSum = 0;
                    coords.forEach(c => { lngSum += c[0]; latSum += c[1]; });
                    centroid = L.latLng(latSum / coords.length, lngSum / coords.length);
                  }
                  isInside = focusedHalteLatLng.distanceTo(centroid) <= dynamicRadius + 50;
                }
                
                if (focusedHalteLatLng && isInside) return { color: "#f43f5e", weight: 2, fillColor: "#f43f5e", fillOpacity: 0.7 };
                return { color: "rgba(244,63,94,0.5)", weight: 1.5, fillColor: "#e11d48", fillOpacity: focusedHalteLatLng ? 0.1 : 0.25 };
              }}
              filter={filterWisataFeatures}
              onEachFeature={onEachWisataFeature}
            />
          )}

          {routeGeoJson && (
            <GeoJSON key={`route-gis-layer-${JSON.stringify(activeRoutes)}-${focusedRoute}`} data={routeGeoJson} style={getRouteStyle} filter={filterRouteFeatures} onEachFeature={onEachRouteFeature} />
          )}

          {halteGeoJson && (
            <GeoJSON key={`halte-gis-layer-${JSON.stringify(showHalte)}-${focusedRoute}-${focusedHalteLatLng?.lat || "none"}`} data={halteGeoJson} pointToLayer={haltePointToLayer} filter={filterHalteFeatures} />
          )}
        </MapContainer>
      </main>

      {/* modal form login */}
      {showLogin && (
        <div className="modal-overlay" onClick={closeLogin} role="dialog" aria-modal="true" aria-label="Modal masuk admin" style={{ zIndex: 9999 }}>
          <div className="login-glass-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={closeLogin} aria-label="Tutup modal"><X size={15} /></button>
            <div className="modal-header">
              <div className="modal-icon" aria-hidden="true"><Lock size={22} color="#10b981" /></div>
              <h2>Masuk ke Dashboard</h2>
              <p>Gunakan akun admin untuk mengelola sistem</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="modal-form" noValidate>
              <div className="form-group">
                <label htmlFor="admin-email">Email / Username</label>
                <input id="admin-email" type="text" placeholder="admin@example.com" className="input" required />
              </div>
              <div className="form-group">
                <label htmlFor="admin-password">Password</label>
                <div className="input-password-wrap">
                  <input id="admin-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="input" required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {loginError && <p className="login-error-msg" style={{color: '#ef4444', fontSize: '13px', margin: '10px 0'}}>{loginError}</p>}
              <button type="submit" className="btn-login-submit" style={{width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px'}}>
                Masuk <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CRUD ADMIN ================= */}
      {crudModal.open && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="login-glass-card animate-scale-in" style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setCrudModal({ ...crudModal, open: false })}>
              <X size={15} />
            </button>
            
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <h2>
                {crudModal.action === 'edit' ? '✏️ Edit' : crudModal.action === 'tambah' ? '➕ Tambah' : '🗑️ Hapus'} Data
                {crudModal.action !== 'tambah' && ` ${crudModal.type.toUpperCase()}`}
              </h2>
            </div>

            {crudModal.action === "delete" ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#334155", marginBottom: "20px" }}>Apakah Anda yakin ingin menghapus permanen data ini dari Database?</p>
                <button onClick={handleCrudSubmit} style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Ya, Hapus Permanen
                </button>
              </div>
            ) : (
              <form onSubmit={handleCrudSubmit} className="modal-form">
                
                {/* PEMILIHAN TIPE JIKA MODE TAMBAH */}
                {crudModal.action === 'tambah' && (
                  <div className="form-group">
                    <label>Tipe Data yang ingin ditambahkan</label>
                    <select className="input" value={crudModal.type} onChange={(e) => setCrudModal({...crudModal, type: e.target.value, formData: {}})} required>
                      <option value="halte">Titik Halte Transportasi</option>
                      <option value="rute">Lintasan Rute Transportasi</option>
                      <option value="wisata">Objek Wisata</option>
                    </select>
                  </div>
                )}

                {/* ---------- FORM HALTE ---------- */}
                {crudModal.type === "halte" && (
                  <>
                    <div className="form-group"><label>Nama Halte</label><input className="input" name="nama" value={crudModal.formData.nama || ""} onChange={handleCrudChange} required /></div>
                    <div className="form-group"><label>Kode Halte</label><input className="input" name="kode" value={crudModal.formData.kode || ""} onChange={handleCrudChange} required /></div>
                    <div className="form-group"><label>Jenis</label>
                      <select className="input" name="jenis" value={crudModal.formData.jenis || ""} onChange={handleCrudChange} required>
                        <option value="">Pilih Jenis...</option>
                        <option value="Bus Trans">Bus Trans</option>
                        <option value="Angkot">Angkot</option>
                        <option value="Bandros">Bandros</option>
                      </select>
                    </div>
                    
                    {/* Input Koordinat Wajib Ditambah untuk Pydantic/PostGIS */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="form-group" style={{ flex: 1 }}><label>Longitude (X)</label><input type="number" step="any" className="input" name="longitude" value={crudModal.formData.longitude || ""} onChange={handleCrudChange} required /></div>
                      <div className="form-group" style={{ flex: 1 }}><label>Latitude (Y)</label><input type="number" step="any" className="input" name="latitude" value={crudModal.formData.latitude || ""} onChange={handleCrudChange} required /></div>
                    </div>

                    <div className="form-group"><label>Alamat</label><input className="input" name="alamat" value={crudModal.formData.alamat || ""} onChange={handleCrudChange} /></div>
                    <div className="form-group"><label>Fasilitas</label><textarea className="input" name="fasilitas" value={crudModal.formData.fasilitas || ""} onChange={handleCrudChange} style={{ minHeight: "60px" }} /></div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="form-group" style={{ flex: 1 }}><label>Jam Mulai</label><input type="time" className="input" name="jam_operasi_mulai" value={crudModal.formData.jam_operasi_mulai || ""} onChange={handleCrudChange} /></div>
                      <div className="form-group" style={{ flex: 1 }}><label>Jam Selesai</label><input type="time" className="input" name="jam_operasi_selesai" value={crudModal.formData.jam_operasi_selesai || ""} onChange={handleCrudChange} /></div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#334155', fontWeight: '600' }}>
                      <input type="checkbox" name="aktif" checked={crudModal.formData.aktif !== false} onChange={handleCrudChange} style={{ width: '18px', height: '18px', accentColor: '#10b981' }} /> Halte Aktif Beroperasi
                    </label>
                  </>
                )}

                {/* ---------- FORM RUTE ---------- */}
                {crudModal.type === "rute" && (
                  <>
                    <div className="form-group"><label>Nama Rute / Trayek</label><input className="input" name="nama_rute" value={crudModal.formData.nama_rute || ""} onChange={handleCrudChange} required /></div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="form-group" style={{ flex: 1 }}><label>Kode Rute</label><input className="input" name="kode_rute" value={crudModal.formData.kode_rute || ""} onChange={handleCrudChange} required /></div>
                      <div className="form-group" style={{ flex: 1 }}><label>Warna Jalur</label><input type="color" className="input" name="warna_jalur" value={crudModal.formData.warna_jalur || "#3b82f6"} onChange={handleCrudChange} style={{ padding: "0", height: "42px" }} /></div>
                    </div>
                    <div className="form-group"><label>Jenis</label>
                      <select className="input" name="jenis" value={crudModal.formData.jenis || ""} onChange={handleCrudChange} required>
                        <option value="">Pilih Jenis Kendaraan...</option>
                        <option value="Bus">Bus</option>
                        <option value="Angkot">Angkot</option>
                        <option value="Kereta">Kereta</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Keterangan Jalur</label><textarea className="input" name="keterangan" value={crudModal.formData.keterangan || ""} onChange={handleCrudChange} style={{ minHeight: "60px" }} /></div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="form-group" style={{ flex: 1 }}><label>Panjang (KM)</label><input type="number" step="0.01" className="input" name="panjang_km" value={crudModal.formData.panjang_km || ""} onChange={handleCrudChange} /></div>
                      <div className="form-group" style={{ flex: 1 }}><label>Waktu (Menit)</label><input type="number" className="input" name="estimasi_waktu" value={crudModal.formData.estimasi_waktu || ""} onChange={handleCrudChange} /></div>
                      <div className="form-group" style={{ flex: 1 }}><label>Tarif (Rp)</label><input type="number" className="input" name="tarif" value={crudModal.formData.tarif || ""} onChange={handleCrudChange} /></div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#334155', fontWeight: '600' }}>
                      <input type="checkbox" name="aktif" checked={crudModal.formData.aktif !== false} onChange={handleCrudChange} style={{ width: '18px', height: '18px', accentColor: '#10b981' }} /> Rute Aktif Beroperasi
                    </label>
                  </>
                )}

                {/* ---------- FORM OBJEK WISATA ---------- */}
                {crudModal.type === "wisata" && (
                  <>
                    <div className="form-group"><label>Nama Objek Wisata</label><input className="input" name="nama_wisata" value={crudModal.formData.nama_wisata || ""} onChange={handleCrudChange} required /></div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="form-group" style={{ flex: 1 }}><label>Kode Wisata</label><input className="input" name="kode_wisata" value={crudModal.formData.kode_wisata || ""} onChange={handleCrudChange} required /></div>
                      <div className="form-group" style={{ flex: 1 }}><label>Luas Area (KM²)</label><input type="number" step="0.01" className="input" name="luas_km2" value={crudModal.formData.luas_km2 || ""} onChange={handleCrudChange} /></div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="form-group" style={{ flex: 1 }}><label>Longitude (X)</label><input type="number" step="any" className="input" name="longitude" value={crudModal.formData.longitude || ""} onChange={handleCrudChange} /></div>
                      <div className="form-group" style={{ flex: 1 }}><label>Latitude (Y)</label><input type="number" step="any" className="input" name="latitude" value={crudModal.formData.latitude || ""} onChange={handleCrudChange} /></div>
                    </div>

                    <div className="form-group"><label>Deskripsi Tempat</label><textarea className="input" name="deskripsi" value={crudModal.formData.deskripsi || ""} onChange={handleCrudChange} style={{ minHeight: "100px" }} /></div>
                  </>
                )}

                <button type="submit" className="btn-login-submit" style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' }}>
                  💾 Simpan Ke Database
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;