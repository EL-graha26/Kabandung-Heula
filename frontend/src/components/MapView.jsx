import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Plus,
  Train,
  Bike,
  Landmark,
  TreePine,
  Camera,
  Coffee,
  Waves,
  Mountain,
  Star,
} from "lucide-react";
import { renderToString } from "react-dom/server";

import bandrosImg from "../assets/asset_bandung/Transportasi/bandros.jpg";
import tmbImg from "../assets/asset_bandung/Transportasi/trans metro bandung.jpg";
import angkotImg from "../assets/asset_bandung/Transportasi/angkot.png";

// ─────────────────────────────────────────────────────────────────────────────
//  WARNA TRANSPORTASI — satu sumber kebenaran
// ─────────────────────────────────────────────────────────────────────────────
const COLOR = {
  brt:    "#3b82f6",   // biru   — Trans Metro Bandung
  bus:    "#f97316",   // oranye — Bandros
  angkot: "#10b981",   // hijau  — Angkutan Kota
  wisata: "#f43f5e",   // merah  — Kawasan Wisata
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: deteksi jenis transportasi dari string jenis
//  /* Ini fungsi buat nebak ini tuh angkot, bus, atau trans metro dari teks jenisnya */
// ─────────────────────────────────────────────────────────────────────────────
const getTransType = (jenis = "") => {
  const j = String(jenis).toLowerCase();
  if (j.includes("brt") || j.includes("trans")) return "brt";
  if (j.includes("angkot"))                      return "angkot";
  return "bus";
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: hitung centroid dari fitur GeoJSON
// ─────────────────────────────────────────────────────────────────────────────
const getCentroid = (feature) => {
  const geom = feature?.geometry;
  if (!geom) return null;
  if (geom.type === "Point") {
    return L.latLng(geom.coordinates[1], geom.coordinates[0]);
  }
  const ring =
    geom.type === "Polygon"
      ? geom.coordinates[0]
      : geom.type === "MultiPolygon"
      ? geom.coordinates[0][0]
      : null;
  if (!ring) return null;
  let latSum = 0, lngSum = 0;
  ring.forEach((c) => { lngSum += c[0]; latSum += c[1]; });
  return L.latLng(latSum / ring.length, lngSum / ring.length);
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: format jarak meter → teks
// ─────────────────────────────────────────────────────────────────────────────
const formatDist = (m) =>
  m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: ikon wisata berdasarkan nama/deskripsi
// ─────────────────────────────────────────────────────────────────────────────
const getWisataIcon = (nama = "", desc = "") => {
  const t = (nama + " " + desc).toLowerCase();
  if (t.includes("taman") || t.includes("park") || t.includes("kebun"))
    return "🌿";
  if (t.includes("air") || t.includes("kolam") || t.includes("situ") || t.includes("danau"))
    return "💧";
  if (t.includes("gunung") || t.includes("bukit") || t.includes("tebing"))
    return "⛰️";
  if (t.includes("museum") || t.includes("gedung") || t.includes("istana") || t.includes("palace"))
    return "🏛️";
  if (t.includes("masjid") || t.includes("gereja") || t.includes("vihara") || t.includes("pura"))
    return "🕌";
  if (t.includes("kuliner") || t.includes("cafe") || t.includes("resto") || t.includes("food"))
    return "🍽️";
  if (t.includes("pantai") || t.includes("laut") || t.includes("beach"))
    return "🏖️";
  return "📸";
};

// ─────────────────────────────────────────────────────────────────────────────
//  KOMPONEN: Pengendali fly-to peta
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
//  KOMPONEN: Pendeteksi klik peta
// ─────────────────────────────────────────────────────────────────────────────
function MapEventHandler({ onMapClick }) {
  useMapEvents({ click: () => onMapClick() });
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  KOMPONEN: Toggle switch kustom
// ─────────────────────────────────────────────────────────────────────────────
const CustomToggle = ({ checked, onChange, color }) => (
  <div
    onClick={onChange}
    role="switch"
    aria-checked={checked}
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
        transition: "left 0.3s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  IKON HALTE — berbeda per moda transportasi
//  /* Ini bagian icon angkot, bus, dan BRT yang tampil di peta. Pakai emoji biar enteng dan beda warna */
// ─────────────────────────────────────────────────────────────────────────────
const createHalteIcon = (jenisStr, isFocused) => {
  const type  = getTransType(jenisStr);
  const color = COLOR[type];
  const emoji = type === "brt" ? "🚌" : type === "angkot" ? "🚐" : "🚎";

  const size = isFocused ? 36 : 28;
  const ring = isFocused ? `box-shadow: 0 0 0 4px ${color}40, 0 4px 10px rgba(0,0,0,0.3);` : "box-shadow: 0 2px 6px rgba(0,0,0,0.3);";

  const html = `
    <div style="
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:${color};
      border:2.5px solid white;
      ${ring}
      display:flex; align-items:center; justify-content:center;
      font-size: ${isFocused ? 18 : 14}px;
      transition:all 0.2s ease;
    ">
      ${emoji}
    </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  IKON WISATA — marker pin berwarna dengan emoji kategori
// ─────────────────────────────────────────────────────────────────────────────
const createWisataIcon = (nama = "", deskripsi = "") => {
  const emoji = getWisataIcon(nama, deskripsi);
  const html = `
    <div class="wisata-marker-pin">
      <div class="wisata-marker-inner">${emoji}</div>
      <div class="wisata-marker-tail"></div>
    </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  HALAMAN PETA UTAMA
// ─────────────────────────────────────────────────────────────────────────────
function MapView() {
  const BASE_RADIUS = 3500;

  // ── State Peta & Data ──
  const [openModal,    setOpenModal]    = useState(false);
  const [layerType,    setLayerType]    = useState("default");
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [halteGeoJson, setHalteGeoJson] = useState(null);
  const [wisataGeoJson,setWisataGeoJson]= useState(null);
  const mapRef = useRef(null);

  // ── State Visibilitas Layer ──
  const [showWisata,          setShowWisata]          = useState(true);
  const [showNearbyWisataOnly,setShowNearbyWisataOnly]= useState(false);
  const [showHalte,           setShowHalte]           = useState({ brt: true, bus: true, angkot: true });
  const [activeRoutes,        setActiveRoutes]        = useState({});

  // ── State Fokus & Navigasi ──
  const [focusedRoute,       setFocusedRoute]       = useState(null);
  const [focusedHalteLatLng, setFocusedHalteLatLng] = useState(null);
  const [dynamicRadius,      setDynamicRadius]      = useState(BASE_RADIUS);
  const [flyTarget,          setFlyTarget]          = useState(null);

  // ── State Pencarian ──
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const searchRef = useRef(null);

  const location  = useLocation();
  const isPreview = new URLSearchParams(location.search).get("preview") === "true";

  // ── State Admin ──
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [showLogin,    setShowLogin]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError,   setLoginError]   = useState("");

  // ── State CRUD ──
  const [crudModal, setCrudModal] = useState({
    open: false, action: "", type: "", id: null, formData: {},
  });

  // ── State Accordion ──
  const [accords, setAccords] = useState({ basemap: false, wisata: true, halte: true, rute: false });
  const toggleAccordion = (key) => setAccords((p) => ({ ...p, [key]: !p[key] }));

  // ─────────────────────────────────────────────────────────────────────────
  //  FETCH DATA
  //  /* Ini buat narik data JSON peta (halte, rute, wisata) dari backend pas halaman baru dibuka */
  // ─────────────────────────────────────────────────────────────────────────
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
        const initial = {};
        resRoute.data.features.forEach((f) => {
          const nm = f.properties?.nama_rute;
          if (nm) initial[nm.trim()] = true;
        });
        setActiveRoutes((prev) => (Object.keys(prev).length === 0 ? initial : prev));
      }
    } catch (err) {
      console.error("Gagal memuat data GIS:", err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAdmin(true);
    fetchData();
  }, [fetchData]);

  // ─────────────────────────────────────────────────────────────────────────
  //  SEARCH — dibangun dari data GeoJSON yang sudah ada
  //  /* Ini fitur search: nyatuin data halte, rute, wisata ke satu index biar cepat dicarinya */
  // ─────────────────────────────────────────────────────────────────────────
  // Bangun indeks pencarian (flat list) dari semua fitur
  const searchIndex = useMemo(() => {
    const items = [];
    halteGeoJson?.features?.forEach((f) => {
      const nama = f.properties?.nama;
      if (!nama) return;
      const latlng = getCentroid(f);
      if (latlng) items.push({ type: "halte", label: nama, sublabel: f.properties?.jenis || "Halte", latlng, feature: f });
    });
    wisataGeoJson?.features?.forEach((f) => {
      const nama = f.properties?.nama_wisata;
      if (!nama) return;
      const latlng = getCentroid(f);
      if (latlng) items.push({ type: "wisata", label: nama, sublabel: "Kawasan Wisata", latlng, feature: f });
    });
    routeGeoJson?.features?.forEach((f) => {
      const nama = f.properties?.nama_rute;
      if (!nama) return;
      // Ambil titik tengah dari array koordinat rute
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length === 0) return;
      const mid = coords[Math.floor(coords.length / 2)];
      if (!mid) return;
      const latlng = L.latLng(mid[1], mid[0]);
      items.push({ type: "rute", label: nama, sublabel: f.properties?.jenis || "Rute", latlng, feature: f });
    });
    return items;
  }, [halteGeoJson, wisataGeoJson, routeGeoJson]);

  // Filter hasil pencarian
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const filtered = searchIndex.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sublabel.toLowerCase().includes(q)
    );
    setSearchResults(filtered.slice(0, 8));
    setShowDropdown(filtered.length > 0);
  }, [searchQuery, searchIndex]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSelect = (item) => {
    setFlyTarget({ latlng: item.latlng, zoom: item.type === "rute" ? 14 : 16 });
    setSearchQuery(item.label);
    setShowDropdown(false);

    // Fokuskan rute jika item adalah rute
    if (item.type === "rute") {
      setFocusedRoute(item.feature.properties?.nama_rute?.trim() || null);
    }
    // Fokuskan halte jika item adalah halte
    if (item.type === "halte") {
      setFocusedHalteLatLng(item.latlng);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  ADMIN — hook popup
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    window.handleAdminAction = (action, type, id) => {
      setCrudModal({ open: true, action, type, id, formData: {} });
    };
    return () => { delete window.handleAdminAction; };
  }, []);

  // Isi form edit
  useEffect(() => {
    if (!crudModal.open || crudModal.action !== "edit" || !crudModal.id) return;
    let feature = null;
    if (crudModal.type === "halte" && halteGeoJson) {
      feature = halteGeoJson.features.find(
        (f) => String(f.properties?.id_halte) === String(crudModal.id) ||
               String(f.properties?.kode)     === String(crudModal.id)
      );
    } else if (crudModal.type === "rute" && routeGeoJson) {
      feature = routeGeoJson.features.find(
        (f) => String(f.properties?.id_rute)   === String(crudModal.id) ||
               String(f.properties?.kode_rute) === String(crudModal.id)
      );
    } else if (crudModal.type === "wisata" && wisataGeoJson) {
      feature = wisataGeoJson.features.find(
        (f) => String(f.properties?.id_wisata)    === String(crudModal.id) ||
               String(f.properties?.kode_wisata)  === String(crudModal.id)
      );
    }
    if (feature?.properties) {
      const data = { ...feature.properties };
      if (feature.geometry?.type === "Point") {
        data.longitude = feature.geometry.coordinates[0];
        data.latitude  = feature.geometry.coordinates[1];
      }
      setCrudModal((p) => ({ ...p, formData: data }));
    }
  }, [crudModal.open, crudModal.action, crudModal.id, crudModal.type, halteGeoJson, routeGeoJson, wisataGeoJson]);

  const handleCrudChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCrudModal((p) => ({
      ...p,
      formData: { ...p.formData, [name]: type === "checkbox" ? checked : value },
    }));
  };

  const handleCrudSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      const { action, type, id, formData } = crudModal;
      const endpointMap = { halte: "/halte", rute: "/rute", wisata: "/objek-wisata" };
      const endpoint = endpointMap[type] || "";
      const token  = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (action === "edit")    await api.put(`${endpoint}/${id}`, formData, config);
      else if (action === "tambah") await api.post(endpoint, formData, config);
      else if (action === "delete") await api.delete(`${endpoint}/${id}`, config);

      alert(`Sukses! Data ${type} berhasil ${action === "delete" ? "dihapus" : action === "edit" ? "diperbarui" : "ditambahkan"}.`);
      setCrudModal((p) => ({ ...p, open: false }));
      fetchData();
    } catch (err) {
      console.error(err);
      alert(`Gagal: ${err.response?.data?.detail || "Terjadi kesalahan server"}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RUTE — grouping & toggle
  // ─────────────────────────────────────────────────────────────────────────
  const groupedRoutes = useMemo(() => {
    const groups = { brt: [], angkot: [] };
    routeGeoJson?.features?.forEach((f) => {
      const t = getTransType(f.properties?.jenis);
      if (t === "brt" || t === "angkot") groups[t].push(f);
    });
    return groups;
  }, [routeGeoJson]);

  const toggleRoute = (namaRute) => {
    if (!namaRute) return;
    setActiveRoutes((p) => ({ ...p, [namaRute.trim()]: !p[namaRute.trim()] }));
  };

  const toggleAllRoutesInType = (type, state) => {
    if (!groupedRoutes[type]) return;
    const next = { ...activeRoutes };
    groupedRoutes[type].forEach((f) => {
      if (f.properties?.nama_rute) next[f.properties.nama_rute.trim()] = state;
    });
    setActiveRoutes(next);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  FILTER & STYLE LAYER
  // ─────────────────────────────────────────────────────────────────────────
  const filterRouteFeatures = (feature) => {
    const nm = feature.properties?.nama_rute;
    return nm ? activeRoutes[nm.trim()] === true : false;
  };

  const filterHalteFeatures = (feature) => {
    const type = getTransType(feature.properties?.jenis);
    return showHalte[type] === true;
  };

  const filterWisataFeatures = (feature) => {
    if (!showNearbyWisataOnly) return true;
    if (!focusedHalteLatLng)  return false;
    const centroid = getCentroid(feature);
    if (!centroid) return false;
    return focusedHalteLatLng.distanceTo(centroid) <= dynamicRadius + 50;
  };

  const getRouteStyle = (feature) => {
    const type  = getTransType(feature.properties?.jenis);
    const color = COLOR[type];
    const nama  = feature.properties?.nama_rute;

    let opacity = 0.8, weight = 5;
    if (focusedRoute) {
      if (focusedRoute === nama) { opacity = 1; weight = 8; }
      else                       { opacity = 0.15; weight = 3; }
    }
    // Rute angkot pakai garis putus-putus agar mudah dibedakan
    const dashArray = type === "angkot" ? "8, 5" : null;
    return { color, weight, opacity, dashArray };
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  WISATA — kalkulasi terdekat dari halte
  //  /* Ini fungsi buat nyari tempat wisata terdekat dari titik halte yang lagi di-klik (radius default 3.5km) */
  // ─────────────────────────────────────────────────────────────────────────
  const getNearbyWisata = (halteLatLng, initialRadius = BASE_RADIUS) => {
    if (!wisataGeoJson?.features || !showWisata)
      return { nearby: [], radiusUsed: initialRadius };

    const withDist = wisataGeoJson.features
      .map((f) => {
        const c = getCentroid(f);
        return c ? { ...f, distance: Math.round(halteLatLng.distanceTo(c)) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    if (!withDist.length) return { nearby: [], radiusUsed: initialRadius };

    let nearby = withDist.filter((w) => w.distance <= initialRadius);
    let radiusUsed = initialRadius;
    if (!nearby.length) {
      nearby    = [withDist[0]];
      radiusUsed = withDist[0].distance;
    }
    return { nearby, radiusUsed };
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  POPUP & LAYER: HALTE
  // ─────────────────────────────────────────────────────────────────────────
  const haltePointToLayer = (feature, latlng) => {
    const { jenis = "-", nama = "Tanpa Nama", jam_operasi_mulai: jamMulai = "-",
            jam_operasi_selesai: jamSelesai = "-" } = feature.properties || {};
    const aktif   = feature.properties?.aktif !== false;
    const type    = getTransType(jenis);
    const color   = COLOR[type];
    const imgUrl  = feature.properties?.gambar_url ||
                    (type === "brt" ? tmbImg : type === "angkot" ? angkotImg : bandrosImg);
    const ruteTerkait = feature.properties?.rute_terkait || [];

    const isFocused =
      (focusedRoute && ruteTerkait.includes(focusedRoute)) ||
      (focusedHalteLatLng && focusedHalteLatLng.equals(latlng));

    const marker = L.marker(latlng, { icon: createHalteIcon(jenis, isFocused) });
    const { nearby, radiusUsed } = getNearbyWisata(latlng, BASE_RADIUS);

    const modaLabel = type === "brt" ? "Trans Metro" : type === "angkot" ? "Angkutan Kota" : "Bandros";

    const radarHtml = nearby.length
      ? `<div class="radar-tourism-section">
           <div class="radar-tourism-title">
             <span>📍 Wisata Terdekat</span>
             <span style="font-weight:500;font-size:9px;color:#94a3b8">Max ${(radiusUsed/1000).toFixed(1)} km</span>
           </div>
           <div class="radar-tourism-list">
             ${nearby.slice(0, 3).map((w) =>
               `<div class="radar-tourism-item">
                 <span class="radar-tourism-name">${getWisataIcon(w.properties?.nama_wisata||"")} ${w.properties?.nama_wisata || "Wisata"}</span>
                 <span class="radar-tourism-dist">${formatDist(w.distance)}</span>
               </div>`
             ).join("")}
           </div>
         </div>`
      : "";

    const adminHtml = isAdmin
      ? (() => {
          const id = feature.properties?.id_halte || feature.properties?.id || "unknown";
          return `<div style="display:flex;gap:8px;margin-top:12px;border-top:1px dashed #cbd5e1;padding-top:12px;">
            <button onclick="window.handleAdminAction('edit','halte','${id}')" style="flex:1;padding:6px;background:#f59e0b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">✏️ Edit</button>
            <button onclick="window.handleAdminAction('delete','halte','${id}')" style="flex:1;padding:6px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">🗑️ Hapus</button>
          </div>`;
        })()
      : "";

    const typeIcon = type === "brt" ? "🚌" : type === "angkot" ? "🚐" : "🚎";
    const popupContent = `
      <div class="premium-halte-popup">
        <div class="premium-popup-header">
          <img src="${imgUrl}" alt="${nama}" class="premium-popup-img"/>
          <div class="premium-popup-gradient"></div>
          <div class="halte-type-badge" style="background:${color};">${typeIcon} ${modaLabel}</div>
        </div>
        <div class="premium-popup-body">
          <div class="premium-popup-title-row">
            <h3 class="premium-popup-name">${nama}</h3>
            <span class="premium-popup-status ${aktif ? "status-aktif" : "status-nonaktif"}">${aktif ? "Aktif" : "Tidak Aktif"}</span>
          </div>
          <div class="premium-popup-meta">
            <div class="meta-row">
              <span class="meta-label">🕒 Jam Operasi</span>
              <strong style="color:#334155">${jamMulai} – ${jamSelesai}</strong>
            </div>
          </div>
          ${radarHtml}
          ${adminHtml}
        </div>
      </div>`;

    marker.bindPopup(popupContent, { minWidth: 280, maxWidth: 320, offset: [0, -12] });
    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      setFocusedHalteLatLng(latlng);
      setDynamicRadius(radiusUsed);
    });
    return marker;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  POPUP & LAYER: RUTE
  // ─────────────────────────────────────────────────────────────────────────
  const onEachRouteFeature = (feature, layer) => {
    const nama  = feature.properties?.nama_rute || "Trayek Tanpa Nama";
    const kode  = feature.properties?.kode_rute || "-";
    const jenis = feature.properties?.jenis || "-";
    const type  = getTransType(jenis);
    const color = COLOR[type];

    const adminHtml = isAdmin
      ? (() => {
          const id = feature.properties?.id_rute || feature.properties?.id || "unknown";
          return `<div style="display:flex;gap:8px;margin-top:12px;border-top:1px dashed #cbd5e1;padding-top:12px;">
            <button onclick="window.handleAdminAction('edit','rute','${id}')" style="flex:1;padding:6px;background:#f59e0b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">✏️ Edit</button>
            <button onclick="window.handleAdminAction('delete','rute','${id}')" style="flex:1;padding:6px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">🗑️ Hapus</button>
          </div>`;
        })()
      : "";

    const typeIcon = type === "brt" ? "🚌" : type === "angkot" ? "🚐" : "🚎";
    const popupContent = `
      <div style="font-family:'Inter',sans-serif;color:#334155;min-width:220px;padding:14px;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);border:1px solid rgba(0,0,0,0.05);">
        <h4 style="margin:0 0 10px 0;color:${color};font-size:14px;border-bottom:1px solid rgba(0,0,0,0.05);padding-bottom:8px;font-weight:700;display:flex;justify-content:space-between;align-items:center;">
          <span>${typeIcon} ${nama}</span>
          <span style="font-size:10px;font-weight:600;background:${color}20;color:${color};padding:3px 6px;border-radius:4px;">${jenis}</span>
        </h4>
        <div style="font-size:12px;display:flex;flex-direction:column;gap:6px;color:#64748b;">
          <div style="display:flex;justify-content:space-between;">
            <span>Kode Trayek:</span>
            <strong style="color:#1e293b;">${kode}</strong>
          </div>
          ${adminHtml}
        </div>
      </div>`;

    layer.bindPopup(popupContent, { maxWidth: 300 });
    layer.on({
      mouseover: (e) => { if (!focusedRoute) e.target.setStyle({ weight: 8, opacity: 1 }); },
      mouseout:  (e) => { if (!focusedRoute) e.target.setStyle({ weight: 5, opacity: 0.8 }); },
      click:     (e) => {
        L.DomEvent.stopPropagation(e);
        setFocusedRoute((prev) => (prev === nama ? null : nama));
      },
    });

    if (focusedRoute === nama) {
      setTimeout(() => {
        if (layer?._map) {
          layer.getBounds ? layer.openPopup(layer.getBounds().getCenter()) : layer.openPopup();
        }
      }, 250);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  POPUP & LAYER: WISATA
  //  /* Ini yang ngatur pop up kalo pin wisata di klik, nampilin info nama, deskripsi dan tombol edit kalo admin */
  // ─────────────────────────────────────────────────────────────────────────
  const onEachWisataFeature = (feature, layer) => {
    const nama      = feature.properties?.nama_wisata || "Objek Wisata";
    const kode      = feature.properties?.kode_wisata || "-";
    const deskripsi = feature.properties?.deskripsi || "-";
    const emoji     = getWisataIcon(nama, deskripsi);

    const adminHtml = isAdmin
      ? (() => {
          const id = feature.properties?.id_wisata || feature.properties?.id || "unknown";
          return `<div style="display:flex;gap:8px;margin-top:12px;border-top:1px dashed #cbd5e1;padding-top:12px;">
            <button onclick="window.handleAdminAction('edit','wisata','${id}')" style="flex:1;padding:6px;background:#f59e0b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">✏️ Edit</button>
            <button onclick="window.handleAdminAction('delete','wisata','${id}')" style="flex:1;padding:6px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">🗑️ Hapus</button>
          </div>`;
        })()
      : "";

    const popupContent = `
      <div style="font-family:'Inter',sans-serif;color:#334155;width:280px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);border:1px solid rgba(0,0,0,0.05);">
        <div style="background:linear-gradient(135deg,#f43f5e,#e11d48);padding:16px;color:white;display:flex;align-items:center;gap:12px;">
          <div style="font-size:32px;background:rgba(255,255,255,0.2);width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${emoji}</div>
          <div>
            <div style="font-weight:700;font-size:15px;line-height:1.3;margin-bottom:4px;">${nama}</div>
            <div style="font-size:11px;opacity:0.9;display:flex;align-items:center;gap:4px;">
              <span style="background:rgba(0,0,0,0.2);padding:2px 6px;border-radius:4px;">📍 ${kode}</span>
            </div>
          </div>
        </div>
        <div style="padding:14px;font-size:12px;color:#475569;line-height:1.6;border-bottom:1px solid #f1f5f9;text-align:justify;">
          ${deskripsi !== "-"
            ? deskripsi.slice(0, 180) + (deskripsi.length > 180 ? "..." : "")
            : "<em>Deskripsi belum tersedia.</em>"}
        </div>
        ${adminHtml
          ? `<div style="padding:0 12px 12px;">${adminHtml}</div>`
          : ""}
      </div>`;

    layer.bindPopup(popupContent, { minWidth: 280, maxWidth: 320 });
    layer.on({
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.75, weight: 2, color: COLOR.wisata }),
      mouseout:  (e) => e.target.setStyle({ fillOpacity: 0.3,  weight: 1.5, color: `${COLOR.wisata}88` }),
      click:     (e) => {
        L.DomEvent.stopPropagation(e);
        const centroid = getCentroid(feature);
        if (centroid) setFlyTarget({ latlng: centroid, zoom: 16 });
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  LOGIKA AUTH
  // ─────────────────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("Loading...");

    const userVal = document.getElementById("admin-email").value;
    const passVal = document.getElementById("admin-password").value;

    try {
      const res = await api.post("/auth/login", {
        email: userVal,
        password: passVal
      });
      
      localStorage.setItem("token", res.data.access_token);
      setIsAdmin(true);
      closeLogin();
    } catch (error) {
      if (error.response && error.response.status === 422) {
        setLoginError("Format masih salah, cek console.");
        console.error(error.response.data.detail);
      } else if (error.response && error.response.status === 401) {
        setLoginError("Email atau password salah.");
      } else {
        setLoginError("Error API: " + error.message);
      }
    }
  };

  const closeLogin = () => { setShowLogin(false); setLoginError(""); };
  const handleLogout = () => { localStorage.removeItem("token"); setIsAdmin(false); };

  const handleMapClick = () => {
    setFocusedRoute(null);
    setFocusedHalteLatLng(null);
    setDynamicRadius(BASE_RADIUS);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  TILE URL
  // ─────────────────────────────────────────────────────────────────────────
  const getTileUrl = () => {
    if (layerType === "satellite")
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (layerType === "dark")
      return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`map-page-wrapper ${isPreview ? "is-preview-mode" : ""}`}>

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR KIRI
      ══════════════════════════════════════════════════════════ */}
      {!isPreview && (
        <aside className={`map-sidebar-premium ${openModal ? "open" : ""}`}>
          <div className="sidebar-header-top">
            <Link to="/home" className="sidebar-back-link">
              <ArrowLeft size={15} /> Kembali
            </Link>
            <div className="sidebar-brand">
              <div className="sidebar-brand-name">Kabandung Heula</div>
              <div className="sidebar-brand-sub">Peta Interaktif</div>
            </div>
            <button className="sidebar-close-mobile" onClick={() => setOpenModal(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="sidebar-scrollable">

            {/* ── ACCORDION: BASEMAP ── */}
            <div>
              <div className="accordion-header" onClick={() => toggleAccordion("basemap")}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapIcon size={16} color="var(--color-primary)" /> Pilihan Peta
                </div>
                {accords.basemap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <div className={`accordion-body ${accords.basemap ? "open" : ""}`}>
                <div className="basemap-toggle-group">
                  {[
                    { key: "default",   label: "Standard",  icon: <MapIcon size={16} /> },
                    { key: "dark",      label: "Dark",      icon: <Moon size={16} /> },
                    { key: "satellite", label: "Satellite", icon: <Layers size={16} /> },
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => setLayerType(key)}
                      className={`basemap-btn ${layerType === key ? "active" : ""}`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── ACCORDION: TRANSPORTASI ── */}
            <div>
              <div className="accordion-header" onClick={() => toggleAccordion("halte")}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Bus size={16} color={COLOR.brt} /> Filter Transportasi
                </div>
                {accords.halte ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <div className={`accordion-body ${accords.halte ? "open" : ""}`}>
                <h3 className="sidebar-section-title" style={{ marginTop: "8px" }}>
                  Stasiun & Halte
                </h3>
                <div className="sidebar-card halte-card-group">
                  {[
                    { type: "brt",    label: "Trans Metro",   emoji: "🚌" },
                    { type: "bus",    label: "Bandros",       emoji: "🚎" },
                    { type: "angkot",label: "Angkutan Kota",  emoji: "🚐" },
                  ].map(({ type, label, emoji }, idx) => (
                    <div
                      key={type}
                      className="halte-card-item"
                      style={{ borderBottom: idx < 2 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          className="halte-dot-icon"
                          style={{ background: COLOR[type] }}
                        >
                          {emoji}
                        </div>
                        <span style={{ color: "#334155", fontSize: "13px", fontWeight: "600" }}>
                          {label}
                        </span>
                      </div>
                      <CustomToggle
                        checked={showHalte[type]}
                        onChange={() => setShowHalte({ ...showHalte, [type]: !showHalte[type] })}
                        color={COLOR[type]}
                      />
                    </div>
                  ))}
                </div>

                <h3 className="sidebar-section-title" style={{ marginTop: "16px" }}>
                  Lintasan Rute
                </h3>
                {["brt", "angkot"].map((type) => {
                  const title      = type === "brt" ? "Trans Metro Bandung" : "Angkutan Kota";
                  const color      = COLOR[type];
                  const isAllActive =
                    groupedRoutes[type]?.length > 0 &&
                    groupedRoutes[type].every((r) => activeRoutes[r.properties?.nama_rute?.trim()]);

                  return (
                    <div key={type} className="sidebar-card rute-card-group">
                      <div className="rute-card-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <CustomToggle
                            checked={isAllActive}
                            onChange={() => toggleAllRoutesInType(type, !isAllActive)}
                            color={color}
                          />
                          <span style={{ color: "#334155", fontSize: "13px", fontWeight: "600" }}>{title}</span>
                        </div>
                        {/* Indikator gaya garis rute */}
                        <div className="route-line-preview" style={{
                          borderTop: type === "angkot" ? `3px dashed ${color}` : `3px solid ${color}`,
                          width: "32px",
                        }} />
                      </div>
                      <div className="rute-card-body">
                        {groupedRoutes[type]?.map((route, idx) => {
                          const name     = route.properties?.nama_rute?.trim();
                          const isActive = activeRoutes[name];
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleRoute(name)}
                              className="route-item-modern"
                            >
                              <div style={{ marginTop: "2px" }}>
                                {isActive
                                  ? <CheckSquare size={16} color={color} />
                                  : <Square size={16} color="#94a3b8" />}
                              </div>
                              <span style={{
                                color: isActive ? "#334155" : "#64748b",
                                marginLeft: "10px",
                                fontSize: "12px",
                                fontWeight: isActive ? "600" : "400",
                              }}>
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

            {/* ── ACCORDION: PARIWISATA ── */}
            <div>
              <div className="accordion-header" onClick={() => toggleAccordion("wisata")}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={16} color={COLOR.wisata} /> Filter Wisata
                </div>
                {accords.wisata ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <div className={`accordion-body ${accords.wisata ? "open" : ""}`}>
                <div className="sidebar-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#334155", fontSize: "13px", fontWeight: "600" }}>
                      Kawasan Wisata
                    </span>
                    <CustomToggle
                      checked={showWisata}
                      onChange={() => { setShowWisata(!showWisata); if (showWisata) setShowNearbyWisataOnly(false); }}
                      color={COLOR.wisata}
                    />
                  </div>

                  {showWisata && (
                    <div style={{ marginTop: "16px", padding: "12px 10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                        <span>Radius Jangkauan</span>
                        <span>{(dynamicRadius / 1000).toFixed(1)} km</span>
                      </div>
                      <input
                        type="range" min="1000" max="5000" step="500" value={dynamicRadius}
                        onChange={(e) => setDynamicRadius(Number(e.target.value))}
                        style={{ width: "100%", accentColor: COLOR.wisata }}
                      />
                      <div
                        onClick={() => setShowNearbyWisataOnly(!showNearbyWisataOnly)}
                        className="route-item-modern"
                        style={{ padding: "8px 0", marginTop: "8px", cursor: "pointer" }}
                      >
                        <div style={{ marginTop: "2px" }}>
                          {showNearbyWisataOnly
                            ? <CheckSquare size={16} color={COLOR.wisata} />
                            : <Square size={16} color="#94a3b8" />}
                        </div>
                        <span style={{
                          color: showNearbyWisataOnly ? "#334155" : "#64748b",
                          marginLeft: "10px", fontSize: "11px",
                          fontWeight: showNearbyWisataOnly ? "600" : "400",
                          lineHeight: "1.4",
                        }}>
                          Hanya wisata di dalam radius
                        </span>
                      </div>

                      {showNearbyWisataOnly && !focusedHalteLatLng && (
                        <div style={{ padding: "8px 10px", background: "rgba(244,63,94,0.05)", color: "#e11d48", fontSize: "11px", borderRadius: "6px", border: "1px solid rgba(244,63,94,0.2)", marginTop: "8px", lineHeight: "1.4" }}>
                          <Info size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                          Klik halte di peta untuk melihat wisata terdekat.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ height: "40px" }} />
          </div>
        </aside>
      )}

      {/* ══════════════════════════════════════════════════════════
          AREA PETA KANAN
      ══════════════════════════════════════════════════════════ */}
      <main className="map-container-main">

        {/* TOP BAR */}
        {!isPreview && (
          <div className="map-top-bar">
            <button className="sidebar-toggle-btn" onClick={() => setOpenModal(true)}>
              <Filter size={16} /> Layer Filter
            </button>

            <div className="map-smart-hud">
              <div className="hud-stat">
                <MapPin size={14} color={COLOR.brt} /> <strong>Halte</strong>
              </div>
              <div className="hud-divider" />
              <div className="hud-stat">
                <Bus size={14} color={COLOR.bus} /> <strong>Rute</strong>
              </div>
              <div className="hud-divider" />
              <div className="hud-stat">
                <Activity size={14} color={COLOR.wisata} /> <strong>Wisata</strong>
              </div>
              {(focusedRoute || focusedHalteLatLng) && (
                <>
                  <div className="hud-divider" />
                  <button className="hud-reset-btn" onClick={handleMapClick}>
                    ✕ Reset Fokus
                  </button>
                </>
              )}
              <div className="hud-divider" />
              {isAdmin ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" }}>
                  <span style={{ background: "#10b981", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                    ✓ Admin
                  </span>
                  <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600" }}>
                    <LogOut size={14} /> Keluar
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowLogin(true)} style={{ background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", margin: "0 4px" }}>
                  <Lock size={14} /> Login Admin
                </button>
              )}
            </div>
          </div>
        )}

        {/* FLOATING UI: SEARCH + LEGEND */}
        {!isPreview && (
          <div className="floating-ui-container">

            {/* ── SEARCH BAR ── */}
            <div className="floating-search-wrapper" ref={searchRef}>
              <div className="floating-search-bar">
                <Search size={18} color="#9ca3af" />
                <input
                  type="text"
                  className="floating-search-input"
                  placeholder="Cari halte, rute, atau wisata..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                />
                {searchQuery && (
                  <button
                    className="search-clear-btn"
                    onClick={() => { setSearchQuery(""); setShowDropdown(false); }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Dropdown hasil pencarian */}
              {showDropdown && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((item, i) => {
                    const typeColor =
                      item.type === "rute"   ? COLOR[getTransType(item.sublabel)]
                      : item.type === "halte" ? COLOR[getTransType(item.sublabel)]
                      : COLOR.wisata;
                    const typeIcon =
                      item.type === "wisata" ? "🏛️"
                      : item.type === "rute"  ? "🛣️"
                      : "🚏";
                    return (
                      <div
                        key={i}
                        className="search-result-item"
                        onClick={() => handleSearchSelect(item)}
                      >
                        <div className="search-result-icon" style={{ background: `${typeColor}20`, color: typeColor }}>
                          {typeIcon}
                        </div>
                        <div className="search-result-text">
                          <div className="search-result-label">{item.label}</div>
                          <div className="search-result-sub">{item.sublabel}</div>
                        </div>
                        <ChevronRight size={14} color="#94a3b8" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── LEGENDA (Horizontal di Tengah Bawah) ── */}
            <div className="floating-legend-horizontal">
              <div className="legend-item-pill">
                <div className="legend-icon-wrap" style={{ borderColor: COLOR.brt }}><div className="legend-dot" style={{ background: COLOR.brt }}>🚌</div></div>
                <span>Halte Trans</span>
              </div>
              <div className="legend-item-pill">
                <div className="legend-icon-wrap" style={{ borderColor: COLOR.bus }}><div className="legend-dot" style={{ background: COLOR.bus }}>🚎</div></div>
                <span>Bandros</span>
              </div>
              <div className="legend-item-pill">
                <div className="legend-icon-wrap" style={{ borderColor: COLOR.angkot }}><div className="legend-dot" style={{ background: COLOR.angkot }}>🚐</div></div>
                <span>Halte Angkot</span>
              </div>

              <div className="legend-divider" />

              <div className="legend-item-pill">
                <div className="legend-line" style={{ borderColor: COLOR.brt, borderStyle: "solid" }} />
                <span>Rute Trans</span>
              </div>
              <div className="legend-item-pill">
                <div className="legend-line" style={{ borderColor: COLOR.angkot, borderStyle: "dashed" }} />
                <span>Rute Angkot</span>
              </div>

              <div className="legend-divider" />

              <div className="legend-item-pill">
                <div className="wisata-legend-icon"><div className="wisata-legend-inner">📸</div></div>
                <span>Wisata</span>
              </div>
            </div>
          </div>
        )}

        {/* TOMBOL TAMBAH DATA (ADMIN) */}
        {isAdmin && !isPreview && (
          <div style={{ position: "absolute", bottom: "30px", right: "30px", zIndex: 1000 }}>
            <button
              onClick={() => setCrudModal({ open: true, action: "tambah", type: "halte", id: null, formData: {} })}
              style={{ background: "#10b981", color: "white", border: "none", padding: "12px 20px", borderRadius: "30px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", boxShadow: "0 4px 12px rgba(16,185,129,0.4)" }}
            >
              <Plus size={18} /> Tambah Data Baru
            </button>
          </div>
        )}

        {/* LEAFLET MAP */}
        <MapContainer
          center={[-6.914744, 107.60981]}
          zoom={13}
          className="leaflet-fullscreen"
          zoomControl={false}
          ref={mapRef}
          style={{ width: "100%", height: "100%", zIndex: 10 }}
        >
          <MapController flyTarget={flyTarget} />
          <MapEventHandler onMapClick={handleMapClick} />
          <TileLayer url={getTileUrl()} attribution="&copy; WebGIS Transportasi Bandung" />

          {/* Lingkaran radius halte yang difokuskan */}
          {focusedHalteLatLng && (
            <Circle
              center={focusedHalteLatLng}
              radius={dynamicRadius}
              pathOptions={{
                color: COLOR.wisata, weight: 2, dashArray: "10, 10",
                fillColor: COLOR.wisata, fillOpacity: 0.05,
              }}
            />
          )}

          {/* Layer Wisata */}
          {showWisata && wisataGeoJson && (
            <GeoJSON
              key={`wisata-${showWisata}-${showNearbyWisataOnly}-${focusedHalteLatLng?.lat ?? "none"}-${dynamicRadius}`}
              data={wisataGeoJson}
              style={(feature) => {
                let isInside = false;
                if (focusedHalteLatLng) {
                  const c = getCentroid(feature);
                  isInside = c ? focusedHalteLatLng.distanceTo(c) <= dynamicRadius + 50 : false;
                }
                if (focusedHalteLatLng && isInside)
                  return { color: COLOR.wisata, weight: 2, fillColor: COLOR.wisata, fillOpacity: 0.65 };
                return {
                  color: `${COLOR.wisata}88`,
                  weight: 1.5,
                  fillColor: "#e11d48",
                  fillOpacity: focusedHalteLatLng ? 0.1 : 0.25,
                };
              }}
              filter={filterWisataFeatures}
              onEachFeature={onEachWisataFeature}
              pointToLayer={(feature, latlng) =>
                L.marker(latlng, { icon: createWisataIcon(feature.properties?.nama_wisata, feature.properties?.deskripsi) })
              }
            />
          )}

          {/* Layer Rute */}
          {routeGeoJson && (
            <GeoJSON
              key={`route-${JSON.stringify(activeRoutes)}-${focusedRoute}`}
              data={routeGeoJson}
              style={getRouteStyle}
              filter={filterRouteFeatures}
              onEachFeature={onEachRouteFeature}
            />
          )}

          {/* Layer Halte */}
          {halteGeoJson && (
            <GeoJSON
              key={`halte-${JSON.stringify(showHalte)}-${focusedRoute}-${focusedHalteLatLng?.lat ?? "none"}`}
              data={halteGeoJson}
              pointToLayer={haltePointToLayer}
              filter={filterHalteFeatures}
            />
          )}
        </MapContainer>
      </main>

      {/* ══════════════════════════════════════════════════════════
          MODAL LOGIN ADMIN
      ══════════════════════════════════════════════════════════ */}
      {showLogin && (
        <div className="modal-overlay" onClick={closeLogin} role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
          <div className="login-glass-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={closeLogin}><X size={15} /></button>
            <div className="modal-header">
              <div className="modal-icon"><Lock size={22} color="#10b981" /></div>
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
              {loginError && <p style={{ color: "#ef4444", fontSize: "13px", margin: "10px 0" }}>{loginError}</p>}
              <button type="submit" className="btn-login-submit" style={{ width: "100%", padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                Masuk <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL CRUD ADMIN
      ══════════════════════════════════════════════════════════ */}
      {crudModal.open && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div
            className="login-glass-card animate-scale-in"
            style={{ maxWidth: "500px", width: "90%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-x" onClick={() => setCrudModal((p) => ({ ...p, open: false }))}>
              <X size={15} />
            </button>
            <div className="modal-header" style={{ marginBottom: "20px" }}>
              <h2>
                {crudModal.action === "edit" ? "✏️ Edit" : crudModal.action === "tambah" ? "➕ Tambah" : "🗑️ Hapus"} Data
                {crudModal.action !== "tambah" && ` ${crudModal.type.toUpperCase()}`}
              </h2>
            </div>

            {crudModal.action === "delete" ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#334155", marginBottom: "20px" }}>Apakah Anda yakin ingin menghapus permanen data ini dari Database?</p>
                <button onClick={handleCrudSubmit} style={{ width: "100%", padding: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  Ya, Hapus Permanen
                </button>
              </div>
            ) : (
              <form onSubmit={handleCrudSubmit} className="modal-form">

                {/* Pilih tipe (mode tambah) */}
                {crudModal.action === "tambah" && (
                  <div className="form-group">
                    <label>Tipe Data</label>
                    <select className="input" value={crudModal.type} onChange={(e) => setCrudModal({ ...crudModal, type: e.target.value, formData: {} })} required>
                      <option value="halte">Titik Halte Transportasi</option>
                      <option value="rute">Lintasan Rute Transportasi</option>
                      <option value="wisata">Objek Wisata</option>
                    </select>
                  </div>
                )}

                {/* FORM HALTE */}
                {crudModal.type === "halte" && (
                  <>
                    <div className="form-group"><label>Nama Halte</label><input className="input" name="nama" value={crudModal.formData.nama||""} onChange={handleCrudChange} required /></div>
                    <div className="form-group"><label>Kode Halte</label><input className="input" name="kode" value={crudModal.formData.kode||""} onChange={handleCrudChange} required /></div>
                    <div className="form-group"><label>Jenis</label>
                      <select className="input" name="jenis" value={crudModal.formData.jenis||""} onChange={handleCrudChange} required>
                        <option value="">Pilih Jenis...</option>
                        <option value="Bus Trans">Bus Trans</option>
                        <option value="Angkot">Angkot</option>
                        <option value="Bandros">Bandros</option>
                      </select>
                    </div>
                    <div style={{ display:"flex", gap:"10px" }}>
                      <div className="form-group" style={{ flex:1 }}><label>Longitude (X)</label><input type="number" step="any" className="input" name="longitude" value={crudModal.formData.longitude||""} onChange={handleCrudChange} required /></div>
                      <div className="form-group" style={{ flex:1 }}><label>Latitude (Y)</label><input type="number" step="any" className="input" name="latitude" value={crudModal.formData.latitude||""} onChange={handleCrudChange} required /></div>
                    </div>
                    <div className="form-group"><label>Alamat</label><input className="input" name="alamat" value={crudModal.formData.alamat||""} onChange={handleCrudChange} /></div>
                    <div className="form-group"><label>Fasilitas</label><textarea className="input" name="fasilitas" value={crudModal.formData.fasilitas||""} onChange={handleCrudChange} style={{ minHeight:"60px" }} /></div>
                    <div style={{ display:"flex", gap:"10px" }}>
                      <div className="form-group" style={{ flex:1 }}><label>Jam Mulai</label><input type="time" className="input" name="jam_operasi_mulai" value={crudModal.formData.jam_operasi_mulai||""} onChange={handleCrudChange} /></div>
                      <div className="form-group" style={{ flex:1 }}><label>Jam Selesai</label><input type="time" className="input" name="jam_operasi_selesai" value={crudModal.formData.jam_operasi_selesai||""} onChange={handleCrudChange} /></div>
                    </div>
                    <label style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", color:"#334155", fontWeight:"600" }}>
                      <input type="checkbox" name="aktif" checked={crudModal.formData.aktif !== false} onChange={handleCrudChange} style={{ width:"18px", height:"18px", accentColor:"#10b981" }} /> Halte Aktif Beroperasi
                    </label>
                  </>
                )}

                {/* FORM RUTE */}
                {crudModal.type === "rute" && (
                  <>
                    <div className="form-group"><label>Nama Rute / Trayek</label><input className="input" name="nama_rute" value={crudModal.formData.nama_rute||""} onChange={handleCrudChange} required /></div>
                    <div style={{ display:"flex", gap:"10px" }}>
                      <div className="form-group" style={{ flex:1 }}><label>Kode Rute</label><input className="input" name="kode_rute" value={crudModal.formData.kode_rute||""} onChange={handleCrudChange} required /></div>
                      <div className="form-group" style={{ flex:1 }}><label>Warna Jalur</label><input type="color" className="input" name="warna_jalur" value={crudModal.formData.warna_jalur||"#3b82f6"} onChange={handleCrudChange} style={{ padding:"0", height:"42px" }} /></div>
                    </div>
                    <div className="form-group"><label>Jenis</label>
                      <select className="input" name="jenis" value={crudModal.formData.jenis||""} onChange={handleCrudChange} required>
                        <option value="">Pilih Jenis...</option>
                        <option value="Bus">Bus</option>
                        <option value="Angkot">Angkot</option>
                        <option value="Kereta">Kereta</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Keterangan Jalur</label><textarea className="input" name="keterangan" value={crudModal.formData.keterangan||""} onChange={handleCrudChange} style={{ minHeight:"60px" }} /></div>
                    <div style={{ display:"flex", gap:"10px" }}>
                      <div className="form-group" style={{ flex:1 }}><label>Panjang (KM)</label><input type="number" step="0.01" className="input" name="panjang_km" value={crudModal.formData.panjang_km||""} onChange={handleCrudChange} /></div>
                      <div className="form-group" style={{ flex:1 }}><label>Waktu (Menit)</label><input type="number" className="input" name="estimasi_waktu" value={crudModal.formData.estimasi_waktu||""} onChange={handleCrudChange} /></div>
                      <div className="form-group" style={{ flex:1 }}><label>Tarif (Rp)</label><input type="number" className="input" name="tarif" value={crudModal.formData.tarif||""} onChange={handleCrudChange} /></div>
                    </div>
                    <label style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", color:"#334155", fontWeight:"600" }}>
                      <input type="checkbox" name="aktif" checked={crudModal.formData.aktif !== false} onChange={handleCrudChange} style={{ width:"18px", height:"18px", accentColor:"#10b981" }} /> Rute Aktif Beroperasi
                    </label>
                  </>
                )}

                {/* FORM WISATA */}
                {crudModal.type === "wisata" && (
                  <>
                    <div className="form-group"><label>Nama Objek Wisata</label><input className="input" name="nama_wisata" value={crudModal.formData.nama_wisata||""} onChange={handleCrudChange} required /></div>
                    <div style={{ display:"flex", gap:"10px" }}>
                      <div className="form-group" style={{ flex:1 }}><label>Kode Wisata</label><input className="input" name="kode_wisata" value={crudModal.formData.kode_wisata||""} onChange={handleCrudChange} required /></div>
                      <div className="form-group" style={{ flex:1 }}><label>Luas Area (KM²)</label><input type="number" step="0.01" className="input" name="luas_km2" value={crudModal.formData.luas_km2||""} onChange={handleCrudChange} /></div>
                    </div>
                    <div style={{ display:"flex", gap:"10px" }}>
                      <div className="form-group" style={{ flex:1 }}><label>Longitude (X)</label><input type="number" step="any" className="input" name="longitude" value={crudModal.formData.longitude||""} onChange={handleCrudChange} /></div>
                      <div className="form-group" style={{ flex:1 }}><label>Latitude (Y)</label><input type="number" step="any" className="input" name="latitude" value={crudModal.formData.latitude||""} onChange={handleCrudChange} /></div>
                    </div>
                    <div className="form-group"><label>Deskripsi Tempat</label><textarea className="input" name="deskripsi" value={crudModal.formData.deskripsi||""} onChange={handleCrudChange} style={{ minHeight:"100px" }} /></div>
                  </>
                )}

                <button type="submit" className="btn-login-submit" style={{ width:"100%", padding:"12px", background:"#10b981", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold", marginTop:"20px" }}>
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