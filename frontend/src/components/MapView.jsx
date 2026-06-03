import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import api from "../api";
import {
  Bus,
  ArrowLeft,
  Layers,
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

// KOMPONEN UTAMA MAP VIEW
function MapView() {
  const BASE_RADIUS = 3500;

  const [openModal, setOpenModal] = useState(false);
  const [layerType, setLayerType] = useState("default");

  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [halteGeoJson, setHalteGeoJson] = useState(null);
  const [wisataGeoJson, setWisataGeoJson] = useState(null);
  const mapRef = useRef(null);

  const [showWisata, setShowWisata] = useState(true);
  const [showNearbyWisataOnly, setShowNearbyWisataOnly] = useState(false);
  const [showHalte, setShowHalte] = useState({
    brt: true,
    bus: true,
    angkot: true,
  });
  const [activeRoutes, setActiveRoutes] = useState({});

  const [focusedRoute, setFocusedRoute] = useState(null);
  const [focusedHalteLatLng, setFocusedHalteLatLng] = useState(null);
  const [dynamicRadius, setDynamicRadius] = useState(BASE_RADIUS);
  const [flyTarget, setFlyTarget] = useState(null);

  // Accordion state
  const [accords, setAccords] = useState({
    basemap: false,
    wisata: true,
    halte: true,
    rute: false,
  });

  const toggleAccordion = (key) =>
    setAccords((prev) => ({ ...prev, [key]: !prev[key] }));

  // SPRINT 6: Moda Color System
  const colorBrt = "#10b981"; // TMB = Green
  const colorBus = "#D8B15C"; // Bandros = Gold
  const colorAngkot = "#2F6B52"; // Angkot = Secondary Green

  useEffect(() => {
    const fetchData = async () => {
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
          setActiveRoutes(initialActive);
        }
      } catch (error) {
        console.error("Gagal memuat data GIS", error);
      }
    };
    fetchData();
  }, []);

  const handleMapClick = () => {
    setFocusedRoute(null);
    setFocusedHalteLatLng(null);
    setDynamicRadius(BASE_RADIUS);
  };

  const getNearbyWisata = (halteLatLng, initialRadius = BASE_RADIUS) => {
    if (!wisataGeoJson || !wisataGeoJson.features || !showWisata)
      return { nearby: [], radiusUsed: initialRadius };

    const allWisataWithDistance = wisataGeoJson.features
      .map((feature) => {
        let centroid = halteLatLng;
        if (
          feature.geometry?.type === "Polygon" ||
          feature.geometry?.type === "MultiPolygon"
        ) {
          const coords =
            feature.geometry.type === "Polygon"
              ? feature.geometry.coordinates[0]
              : feature.geometry.coordinates[0][0];
          let latSum = 0,
            lngSum = 0;
          coords.forEach((c) => {
            lngSum += c[0];
            latSum += c[1];
          });
          centroid = L.latLng(latSum / coords.length, lngSum / coords.length);
        } else if (feature.geometry?.type === "Point") {
          centroid = L.latLng(
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0],
          );
        }
        return {
          ...feature,
          distance: Math.round(halteLatLng.distanceTo(centroid)),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    if (allWisataWithDistance.length === 0)
      return { nearby: [], radiusUsed: initialRadius };

    let nearby = allWisataWithDistance.filter(
      (w) => w.distance <= initialRadius,
    );
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
    if (
      feature.geometry?.type === "Polygon" ||
      feature.geometry?.type === "MultiPolygon"
    ) {
      const coords =
        feature.geometry.type === "Polygon"
          ? feature.geometry.coordinates[0]
          : feature.geometry.coordinates[0][0];
      let latSum = 0,
        lngSum = 0;
      coords.forEach((c) => {
        lngSum += c[0];
        latSum += c[1];
      });
      centroid = L.latLng(latSum / coords.length, lngSum / coords.length);
    } else if (feature.geometry?.type === "Point") {
      centroid = L.latLng(
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
      );
    }

    const distance = focusedHalteLatLng.distanceTo(centroid);
    return distance <= dynamicRadius + 50;
  };

  const getRouteStyle = (feature) => {
    const jenis = String(feature.properties?.jenis || "").toLowerCase();
    const nama = feature.properties?.nama_rute;

    let defaultColor = colorBus;
    if (jenis.includes("brt") || jenis.includes("trans"))
      defaultColor = colorBrt;
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
    let defaultColor = colorBus;

    if (lowerJenis.includes("brt") || lowerJenis.includes("trans")) {
      cls += " brt";
      defaultColor = colorBrt;
    } else if (lowerJenis.includes("bus") || lowerJenis.includes("bandros")) {
      cls += " bus";
      defaultColor = colorBus;
    } else if (lowerJenis.includes("angkot")) {
      cls += " angkot";
      defaultColor = colorAngkot;
    } else cls += " bus";

    if (isFocused) cls += " active";

    const iconHtml = renderToString(
      <div
        className={cls}
        style={{
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: defaultColor,
          borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
        }}
      >
        <Bus size={12} color="white" />
      </div>,
    );
    return L.divIcon({
      html: iconHtml,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  const createWisataIcon = () => {
    const iconHtml = renderToString(
      <div
        className="marker-wisata"
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MapPin size={18} color="#f43f5e" />
      </div>,
    );
    return L.divIcon({
      html: iconHtml,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} KM`;
    return `${(meters / 1000).toFixed(2)} KM`; // Force KM display as requested
  };

  // SPRINT 6: HALTE POINT TO LAYER & POPUP

  const haltePointToLayer = (feature, latlng) => {
    // ATRIBUT TABEL HALTE
    const jenis = feature.properties?.jenis || "-";
    const nama = feature.properties?.nama || "Tanpa Nama";
    const jamMulai = feature.properties?.jam_operasi_mulai || "-";
    const jamSelesai = feature.properties?.jam_operasi_selesai || "-";
    const aktif = feature.properties?.aktif !== false ? "Aktif" : "Tidak Aktif";

    // Header image logic
    const lowerJenis = String(jenis).toLowerCase();
    const fallbackImg =
      lowerJenis.includes("brt") || lowerJenis.includes("trans")
        ? tmbImg
        : lowerJenis.includes("angkot")
          ? angkotImg
          : bandrosImg;
    const imgUrl = feature.properties?.gambar_url || fallbackImg;

    // Data relasi / fungsional map
    const ruteTerkait = feature.properties?.rute_terkait || [];
    const isFocused =
      (focusedRoute && ruteTerkait.includes(focusedRoute)) ||
      (focusedHalteLatLng && focusedHalteLatLng.equals(latlng));

    const marker = L.marker(latlng, {
      icon: createHalteIcon(jenis, isFocused),
    });
    const { nearby, radiusUsed } = getNearbyWisata(latlng, BASE_RADIUS);

    const color =
      lowerJenis.includes("brt") || lowerJenis.includes("trans")
        ? colorBrt
        : lowerJenis.includes("angkot")
          ? colorAngkot
          : colorBus;

    let radarHtml = "";
    if (nearby.length > 0) {
      radarHtml = `
        <div class="radar-tourism-section">
          <div class="radar-tourism-title">
            <span>📍 Wisata Terdekat</span>
            <span style="font-weight: 500; font-size: 9px; color: #94a3b8;">Max ${(radiusUsed / 1000).toFixed(1)} KM</span>
          </div>
          <div class="radar-tourism-list">
            ${nearby
              .slice(0, 3)
              .map(
                (w) => `
              <div class="radar-tourism-item">
                <span class="radar-tourism-name">${w.properties?.nama_wisata || "Wisata"}</span>
                <span class="radar-tourism-dist">${formatDistance(w.distance)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
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
              <span class="meta-label">🚍 Moda Transportasi</span>
              <span class="badge-moda" style="background: ${color};">${jenis}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">🕒 Jam Operasional</span>
              <strong style="color: #334155;">${jamMulai} - ${jamSelesai}</strong>
            </div>
          </div>
          
          ${radarHtml}
          
          <button class="premium-popup-cta" style="background: ${color};">
            Eksplor Sekitar Halte 
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    `;

    // offset untuk kompensasi icon agar popup pas di atas marker
    marker.bindPopup(popupContent, {
      minWidth: 280,
      maxWidth: 320,
      offset: [0, -12],
    });

    marker.on("click", (e) => {
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
    const lowerJenis = String(jenis).toLowerCase();
    const color =
      lowerJenis.includes("brt") || lowerJenis.includes("trans")
        ? colorBrt
        : lowerJenis.includes("angkot")
          ? colorAngkot
          : colorBus;

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
        </div>
      </div>
    `;
    layer.bindPopup(popupContent, { maxWidth: 300 });

    layer.on({
      mouseover: (e) => {
        if (!focusedRoute) e.target.setStyle({ weight: 8, opacity: 1 });
      },
      mouseout: (e) => {
        if (!focusedRoute) e.target.setStyle({ weight: 5, opacity: 0.8 });
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        setFocusedRoute((prev) => (prev === nama ? null : nama));
      },
    });

    if (focusedRoute === nama) {
      setTimeout(() => {
        if (layer && layer._map) {
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
    const nama = feature.properties?.nama_wisata || "Objek Wisata";
    const kode = feature.properties?.kode_wisata || "-";
    const deskripsi = feature.properties?.deskripsi || "-";

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
        </div>
      </div>
    `;
    layer.bindPopup(popupContent, { maxWidth: 300 });

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ fillOpacity: 0.8, weight: 2, color: "#f43f5e" });
      },
      mouseout: (e) => {
        e.target.setStyle({
          fillOpacity: 0.4,
          weight: 1,
          color: "transparent",
        });
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        let latlng;
        if (feature.geometry.type === "Polygon") {
          const coords = feature.geometry.coordinates[0];
          let latSum = 0,
            lngSum = 0;
          coords.forEach((c) => {
            lngSum += c[0];
            latSum += c[1];
          });
          latlng = L.latLng(latSum / coords.length, lngSum / coords.length);
        }
        if (latlng) setFlyTarget({ latlng, zoom: 16 });
      },
    });
  };

  // PENGELOMPOKAN DATA RUTE

  const groupedRoutes = { brt: [], angkot: [] };
  if (routeGeoJson && routeGeoJson.features) {
    routeGeoJson.features.forEach((f) => {
      const type = String(f.properties?.jenis || "").toLowerCase();
      if (type.includes("brt") || type.includes("trans"))
        groupedRoutes.brt.push(f);
      else if (type.includes("angkot")) groupedRoutes.angkot.push(f);
    });
  }

  const toggleRoute = (namaRute) => {
    if (!namaRute) return;
    setActiveRoutes((prev) => ({
      ...prev,
      [namaRute.trim()]: !prev[namaRute.trim()],
    }));
  };

  const toggleAllRoutesInType = (type, state) => {
    if (!groupedRoutes[type]) return;
    const newActive = { ...activeRoutes };
    groupedRoutes[type].forEach((f) => {
      if (f.properties?.nama_rute) {
        newActive[f.properties.nama_rute.trim()] = state;
      }
    });
    setActiveRoutes(newActive);
  };

  const getTileUrl = () => {
    if (layerType === "satellite")
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (layerType === "dark")
      return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  };

  const LegendIcon = ({ color }) => (
    <div
      style={{
        background: "white",
        border: `2px solid ${color}`,
        borderRadius: "50%",
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 2px 5px rgba(0,0,0,0.1)`,
        color: color,
        flexShrink: 0,
      }}
    >
      <Bus size={12} />
    </div>
  );

  return (
    <div className="map-page-wrapper">
      {}
      <aside className={`map-sidebar-premium ${openModal ? "open" : ""}`}>
        {/* HEADER SIDEBAR */}
        <div className="sidebar-header-top">
          <Link to="/home" className="sidebar-back-link">
            <ArrowLeft size={16} /> Beranda
          </Link>
          <button
            className="sidebar-close-mobile"
            onClick={() => setOpenModal(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-scrollable">
          {/* ACCORDION: BASEMAP */}
          <div>
            <div
              className="accordion-header"
              onClick={() => toggleAccordion("basemap")}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <MapIcon size={16} color="var(--color-primary)" /> Peta Dasar
              </div>
              {accords.basemap ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            <div className={`accordion-body ${accords.basemap ? "open" : ""}`}>
              <div className="basemap-toggle-group">
                <button
                  onClick={() => setLayerType("default")}
                  className={`basemap-btn ${layerType === "default" ? "active" : ""}`}
                >
                  <MapIcon size={16} /> Standard
                </button>
                <button
                  onClick={() => setLayerType("dark")}
                  className={`basemap-btn ${layerType === "dark" ? "active" : ""}`}
                >
                  <Moon size={16} /> Dark
                </button>
                <button
                  onClick={() => setLayerType("satellite")}
                  className={`basemap-btn ${layerType === "satellite" ? "active" : ""}`}
                >
                  <Layers size={16} /> Satellite
                </button>
              </div>
            </div>
          </div>

          {/* ACCORDION: TRANSPORTASI */}
          <div>
            <div
              className="accordion-header"
              onClick={() => toggleAccordion("halte")}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Bus size={16} color={colorBrt} /> Transportasi
              </div>
              {accords.halte ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            <div className={`accordion-body ${accords.halte ? "open" : ""}`}>
              <h3
                className="sidebar-section-title"
                style={{ marginTop: "8px" }}
              >
                Stasiun & Halte
              </h3>
              <div className="sidebar-card halte-card-group">
                {["brt", "bus", "angkot"].map((type, idx) => (
                  <div
                    key={type}
                    className="halte-card-item"
                    style={{
                      borderBottom:
                        idx < 2 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background:
                            type === "brt"
                              ? colorBrt
                              : type === "bus"
                                ? colorBus
                                : colorAngkot,
                        }}
                      ></div>
                      <span
                        style={{
                          color: "#334155",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        {type === "brt"
                          ? "Trans Metro"
                          : type === "bus"
                            ? "Bandros"
                            : "Angkutan Kota"}
                      </span>
                    </div>
                    <CustomToggle
                      checked={showHalte[type]}
                      onChange={() =>
                        setShowHalte({ ...showHalte, [type]: !showHalte[type] })
                      }
                      color={
                        type === "brt"
                          ? colorBrt
                          : type === "bus"
                            ? colorBus
                            : colorAngkot
                      }
                    />
                  </div>
                ))}
              </div>

              <h3
                className="sidebar-section-title"
                style={{ marginTop: "16px" }}
              >
                Lintasan Rute
              </h3>
              {["brt", "angkot"].map((type) => {
                const title =
                  type === "brt" ? "Trans Metro Bandung" : "Angkutan Kota";
                const color = type === "brt" ? colorBrt : colorAngkot;
                const isAllActive =
                  groupedRoutes[type]?.length > 0 &&
                  groupedRoutes[type].every(
                    (r) => activeRoutes[r.properties?.nama_rute?.trim()],
                  );

                return (
                  <div key={type} className="sidebar-card rute-card-group">
                    <div className="rute-card-header">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <CustomToggle
                          checked={isAllActive}
                          onChange={() =>
                            toggleAllRoutesInType(type, !isAllActive)
                          }
                          color={color}
                        />
                        <span
                          style={{
                            color: "#334155",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          {title}
                        </span>
                      </div>
                    </div>
                    <div className="rute-card-body">
                      {groupedRoutes[type]?.map((route, idx) => {
                        const name = route.properties?.nama_rute?.trim();
                        const isActive = activeRoutes[name];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleRoute(name)}
                            className="route-item-modern"
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              padding: "8px 0",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ marginTop: "2px" }}>
                              {isActive ? (
                                <CheckSquare size={16} color={color} />
                              ) : (
                                <Square size={16} color="#94a3b8" />
                              )}
                            </div>
                            <span
                              style={{
                                color: isActive ? "#334155" : "#64748b",
                                marginLeft: "10px",
                                fontSize: "12px",
                                fontWeight: isActive ? "600" : "400",
                              }}
                            >
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
            <div
              className="accordion-header"
              onClick={() => toggleAccordion("wisata")}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <MapPin size={16} color="#f43f5e" /> Wisata
              </div>
              {accords.wisata ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            <div className={`accordion-body ${accords.wisata ? "open" : ""}`}>
              <div className="sidebar-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    Kawasan Wisata
                  </span>
                  <CustomToggle
                    checked={showWisata}
                    onChange={() => {
                      setShowWisata(!showWisata);
                      if (showWisata) setShowNearbyWisataOnly(false);
                    }}
                    color="#f43f5e"
                  />
                </div>

                {/* CHECKBOX FILTER WISATA TERDEKAT */}
                {showWisata && (
                  <>
                    <div
                      onClick={() =>
                        setShowNearbyWisataOnly(!showNearbyWisataOnly)
                      }
                      className="route-item-modern"
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        padding: "12px 10px",
                        marginTop: "16px",
                        cursor: "pointer",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ marginTop: "2px" }}>
                        {showNearbyWisataOnly ? (
                          <CheckSquare size={16} color="#f43f5e" />
                        ) : (
                          <Square size={16} color="#94a3b8" />
                        )}
                      </div>
                      <span
                        style={{
                          color: showNearbyWisataOnly ? "#334155" : "#64748b",
                          marginLeft: "10px",
                          fontSize: "11px",
                          fontWeight: showNearbyWisataOnly ? "600" : "400",
                          lineHeight: "1.4",
                        }}
                      >
                        Hanya wisata terdekat ({(BASE_RADIUS / 1000).toFixed(1)}{" "}
                        KM) dari halte yang diklik
                      </span>
                    </div>

                    {showNearbyWisataOnly && !focusedHalteLatLng && (
                      <div
                        style={{
                          padding: "8px 10px",
                          background: "rgba(244, 63, 94, 0.05)",
                          color: "#e11d48",
                          fontSize: "11px",
                          borderRadius: "6px",
                          border: "1px solid rgba(244, 63, 94, 0.2)",
                          marginTop: "8px",
                          lineHeight: "1.4",
                        }}
                      >
                        <Info
                          size={12}
                          style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: "4px",
                            position: "relative",
                            top: "-1px",
                          }}
                        />
                        Klik halte di peta untuk melihat objek wisata terdekat.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ height: "40px" }}></div>
        </div>
      </aside>

      {}
      <main className="map-container-main">
        {/* TOP BAR / HUD */}
        <div className="map-top-bar">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setOpenModal(true)}
          >
            <Filter size={16} /> Layer Filter
          </button>

          <div className="map-smart-hud">
            <div className="hud-stat">
              <MapPin size={14} color={colorBrt} /> <strong>59 Halte</strong>
            </div>
            <div className="hud-divider"></div>
            <div className="hud-stat">
              <Bus size={14} color={colorBus} /> <strong>20 Rute</strong>
            </div>
            <div className="hud-divider"></div>
            <div className="hud-stat">
              <Activity size={14} color="#f43f5e" /> <strong>50+ Wisata</strong>
            </div>
            {(focusedRoute || focusedHalteLatLng) && (
              <>
                <div className="hud-divider"></div>
                <button className="hud-reset-btn" onClick={handleMapClick}>
                  Reset Fokus
                </button>
              </>
            )}
          </div>
        </div>

        {/* LEAFLET MAP */}
        <MapContainer
          center={[-6.914744, 107.60981]}
          zoom={13}
          className="leaflet-fullscreen"
          zoomControl={false}
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
        >
          <MapController flyTarget={flyTarget} />

          <MapEventHandler onMapClick={handleMapClick} />

          <TileLayer
            url={getTileUrl()}
            attribution="&copy; WebGIS Transportasi Bandung"
          />

          {/* LAYER WISATA */}
          {showWisata && wisataGeoJson && (
            <GeoJSON
              key={`wisata-gis-layer-${showWisata}-${showNearbyWisataOnly}-${focusedHalteLatLng?.lat || "none"}-${dynamicRadius}`}
              data={wisataGeoJson}
              style={() => ({
                color: "rgba(244,63,94,0.5)",
                weight: 1.5,
                fillColor: "#e11d48",
                fillOpacity: 0.25,
              })}
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
              key={`halte-gis-layer-${JSON.stringify(showHalte)}-${focusedRoute}-${focusedHalteLatLng?.lat || "none"}`}
              data={halteGeoJson}
              pointToLayer={haltePointToLayer}
              filter={filterHalteFeatures}
            />
          )}
        </MapContainer>
      </main>
    </div>
  );
}

export default MapView;
