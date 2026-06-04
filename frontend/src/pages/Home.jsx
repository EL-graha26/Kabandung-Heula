import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  MapPin,
  Bus,
  Navigation,
  Clock,
  Ticket,
  Camera,
  Map as MapIcon,
  Layers,
  CheckCircle,
  ArrowRight,
  ToggleRight,
  Circle,
  Sliders,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar";

// Aset gambar latar dan transportasi
import gedungSateBg from "../assets/asset_bandung/hero/gedung sate_2.png";
import backgroundGunung from "../assets/asset_bandung/ornamen/BACKGROUND GUNUNG.png";
import kabut from "../assets/asset_bandung/ornamen/Kabut.png";
import footerGunung from "../assets/asset_bandung/ornamen/FOOTER GUNUNG.png";
import textureBackground from "../assets/asset_bandung/ornamen/TEXTURE BACKGROUND.png";

import bandrosImg from "../assets/asset_bandung/Transportasi/bandros.jpg";
import tmbImg from "../assets/asset_bandung/Transportasi/trans metro bandung.jpg";
import angkotImg from "../assets/asset_bandung/Transportasi/angkot.png";

import bragaImg from "../assets/asset_bandung/wisata/braga.jpg";
import asiaAfrikaImg from "../assets/asset_bandung/wisata/Asia Afrika, Bandung.jpg";
import masjidAlJabarImg from "../assets/asset_bandung/wisata/masjid al jabar.jpg";
import museumGeologiImg from "../assets/asset_bandung/wisata/museum geologi.jpg";
import transStudioImg from "../assets/asset_bandung/wisata/transt studio bandung.webp";
import alunAlunImg from "../assets/asset_bandung/wisata/Alun alun bandung.jpg";

// Komponen animasi muncul saat scroll
function useScrollAnimation() {
  useEffect(() => {
    const targets = document.querySelectorAll(
      "[data-animate], [data-animate-group]",
    );
    if (!targets.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// Komponen pratinjau peta — menampilkan UI WebGIS tiruan
function MapPreviewMockup({ onNavigate }) {
  // Posisi beberapa titik marker di atas gambar peta
  const markers = [
    { top: "30%", left: "35%", type: "tmb", label: "H1" },
    { top: "48%", left: "55%", type: "tmb", label: "H2" },
    { top: "60%", left: "42%", type: "bandros", label: "B1" },
    { top: "25%", left: "65%", type: "wisata", label: "W1" },
    { top: "70%", left: "68%", type: "wisata", label: "W2" },
  ];

  return (
    <div className="map-mockup-root">
      {/* Area peta (latar OSM statis menggunakan gambar tile) */}
      <div className="map-mockup-canvas">
        {/* Latar belakang peta — menggunakan warna dan garis untuk meniru tampilan peta */}
        <div className="map-mockup-bg">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 600 400"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Latar wilayah kota */}
            <rect width="600" height="400" fill="#e8f0e5" />
            {/* Jalan-jalan utama */}
            <line
              x1="0"
              y1="200"
              x2="600"
              y2="200"
              stroke="#c8d8c0"
              strokeWidth="8"
            />
            <line
              x1="0"
              y1="150"
              x2="600"
              y2="130"
              stroke="#c8d8c0"
              strokeWidth="5"
            />
            <line
              x1="200"
              y1="0"
              x2="180"
              y2="400"
              stroke="#c8d8c0"
              strokeWidth="6"
            />
            <line
              x1="400"
              y1="0"
              x2="420"
              y2="400"
              stroke="#c8d8c0"
              strokeWidth="5"
            />
            {/* Rute TMB — hijau */}
            <path
              d="M 50 200 Q 150 195 220 200 Q 290 205 350 200 Q 420 195 550 198"
              stroke="#2f6b52"
              strokeWidth="4"
              fill="none"
              strokeDasharray="0"
              opacity="0.85"
            />
            {/* Rute Bandros — biru */}
            <path
              d="M 80 150 Q 180 165 260 190 Q 340 215 450 250 Q 500 265 560 280"
              stroke="#2980b9"
              strokeWidth="3"
              fill="none"
              opacity="0.75"
            />
            {/* Rute Angkot — oranye */}
            <path
              d="M 0 280 Q 100 270 200 265 Q 300 258 400 270 Q 480 280 600 260"
              stroke="#d97706"
              strokeWidth="3"
              fill="none"
              strokeDasharray="6,3"
              opacity="0.65"
            />
            {/* Blok bangunan */}
            <rect
              x="100"
              y="60"
              width="60"
              height="50"
              fill="#d0dcc8"
              rx="4"
            />
            <rect
              x="280"
              y="80"
              width="80"
              height="40"
              fill="#d0dcc8"
              rx="4"
            />
            <rect
              x="450"
              y="100"
              width="70"
              height="60"
              fill="#d0dcc8"
              rx="4"
            />
            <rect
              x="90"
              y="260"
              width="55"
              height="50"
              fill="#d0dcc8"
              rx="4"
            />
            <rect
              x="350"
              y="280"
              width="75"
              height="55"
              fill="#d0dcc8"
              rx="4"
            />
            {/* Area hijau / taman */}
            <ellipse
              cx="310"
              cy="160"
              rx="40"
              ry="25"
              fill="#b8d4a8"
              opacity="0.6"
            />
            <ellipse
              cx="490"
              cy="340"
              rx="35"
              ry="20"
              fill="#b8d4a8"
              opacity="0.6"
            />
          </svg>

          {/* Titik marker halte dan wisata */}
          {markers.map((m, i) => (
            <div
              key={i}
              className={`map-marker map-marker--${m.type}`}
              style={{ top: m.top, left: m.left }}
              title={m.label}
            >
              {m.type === "wisata" ? (
                <MapPin size={10} />
              ) : (
                <Bus size={10} />
              )}
            </div>
          ))}

          {/* Radius lingkaran analisis */}
          <div
            className="map-radius-circle"
            style={{ top: "48%", left: "55%" }}
          />
        </div>

        {/* Kontrol zoom peta (hias) */}
        <div className="map-zoom-ctrl">
          <button aria-label="Perbesar peta">+</button>
          <button aria-label="Perkecil peta">−</button>
        </div>

        {/* Panel filter layer — mengambang di atas peta */}
        <div className="map-layer-panel">
          <div className="map-layer-title">
            <Layers size={13} />
            Layer Peta
          </div>
          {[
            { color: "#2f6b52", label: "Trans Metro Bandung", on: true },
            { color: "#2980b9", label: "Bandros", on: true },
            { color: "#d97706", label: "Angkot", on: false },
            { color: "#10b981", label: "Halte", on: true },
            { color: "#8b5cf6", label: "Wisata", on: true },
          ].map((layer) => (
            <div className="map-layer-row" key={layer.label}>
              <span
                className="map-layer-dot"
                style={{ background: layer.color }}
              />
              <span className="map-layer-name">{layer.label}</span>
              <span
                className={`map-layer-toggle ${layer.on ? "on" : "off"}`}
              />
            </div>
          ))}
          <div className="map-layer-radius">
            <Sliders size={12} />
            <span>Radius Wisata</span>
            <span className="map-layer-radius-val">3.5 KM</span>
          </div>
          <div className="map-radius-bar">
            <div className="map-radius-fill" />
          </div>
        </div>

        {/* Popup halte — mengambang di atas peta */}
        <div className="map-halte-popup">
          <div className="map-halte-popup-header">
            <span className="map-halte-popup-name">Haite Alun-Alun</span>
            <button className="map-halte-popup-close" aria-label="Tutup popup">
              <X size={12} />
            </button>
          </div>
          <div className="map-halte-popup-meta">
            <Circle
              size={8}
              fill="#2f6b52"
              color="#2f6b52"
            />
            <span>Trans Metro Bandung</span>
          </div>
          <div className="map-halte-popup-wisata-label">
            Wisata Terdekat (3.5 KM)
          </div>
          <div className="map-halte-popup-wisata-imgs">
            <img src={bragaImg} alt="Braga" />
            <img src={asiaAfrikaImg} alt="Asia Afrika" />
            <img src={alunAlunImg} alt="Alun-Alun" />
            <div className="map-halte-popup-wisata-more">+12</div>
          </div>
          <button
            className="map-halte-popup-btn"
            onClick={onNavigate}
          >
            Lihat Detail
          </button>
        </div>
      </div>
    </div>
  );
}

// Halaman Utama
export default function Home() {
  const navigate = useNavigate();
  useScrollAnimation();

  // Animasi counter untuk section statistik
  const statsRef = useRef(null);
  const [counts, setCounts] = useState([0, 0, 0, 0, 0]);
  const counterTargets = [59, 20, 3, 50, 3.5];

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const duration = 1600;
        const steps = 60;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          const t = 1 - Math.pow(1 - step / steps, 3);
          setCounts([
            Math.round(t * counterTargets[0]),
            Math.round(t * counterTargets[1]),
            Math.round(t * counterTargets[2]),
            Math.round(t * counterTargets[3]),
            parseFloat((t * counterTargets[4]).toFixed(1)),
          ]);
          if (step >= steps) clearInterval(timer);
        }, duration / steps);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Menentukan warna badge berdasarkan jarak wisata
  const distBadgeClass = (km) => {
    const v = parseFloat(km);
    if (v < 1.0) return "badge-dist-near";
    if (v < 2.0) return "badge-dist-mid";
    return "badge-dist-far";
  };

  // Data transportasi yang ditampilkan
  const transportData = [
    {
      id: "bandros",
      badge: "BUS WISATA",
      name: "Bandros",
      fullName: "Bandung Tour on Bus",
      desc: "Nikmati keliling Bandung dengan bus wisata bertingkat yang nyaman dan informatif.",
      img: bandrosImg,
      stats: [
        { icon: <MapPin size={13} />, label: "15 Halte" },
        { icon: <Navigation size={13} />, label: "2 Rute" },
      ],
      meta: [
        { icon: <Clock size={13} />, label: "08:00 – 16:00" },
        { icon: <Ticket size={13} />, label: "Rp 20.000" },
      ],
    },
    {
      id: "tmb",
      badge: "BRT",
      name: "Trans Metro",
      fullName: "Trans Metro Bandung",
      desc: "Transportasi massal modern dengan koridor khusus yang cepat, aman, dan nyaman.",
      img: tmbImg,
      stats: [
        { icon: <MapPin size={13} />, label: "59 Halte" },
        { icon: <Navigation size={13} />, label: "20 Rute" },
      ],
      meta: [
        { icon: <Clock size={13} />, label: "05:00 – 22:00" },
        { icon: <Ticket size={13} />, label: "Rp 4.000" },
      ],
    },
    {
      id: "angkot",
      badge: "ANGKOT",
      name: "Angkot Kota",
      fullName: "Angkutan Kota Bandung",
      desc: "Transportasi tradisional yang fleksibel dan menjangkau seluruh penjuru Kota Bandung.",
      img: angkotImg,
      stats: [
        { icon: <MapPin size={13} />, label: "Banyak Halte" },
        { icon: <Navigation size={13} />, label: "Banyak Rute" },
      ],
      meta: [
        { icon: <Clock size={13} />, label: "24 Jam" },
        { icon: <Ticket size={13} />, label: "Rp 3.000 – 5.000" },
      ],
    },
  ];

  // Data destinasi wisata
  const wisataData = [
    { name: "Braga City Walk", dist: "0.9 KM", km: 0.9, img: bragaImg },
    { name: "Museum Asia Afrika", dist: "0.5 KM", km: 0.5, img: asiaAfrikaImg },
    { name: "Alun-Alun Bandung", dist: "0.2 KM", km: 0.2, img: alunAlunImg },
    { name: "Masjid Al-Jabar", dist: "2.5 KM", km: 2.5, img: masjidAlJabarImg },
    { name: "Museum Geologi", dist: "1.2 KM", km: 1.2, img: museumGeologiImg },
    { name: "Trans Studio Bandung", dist: "2.8 KM", km: 2.8, img: transStudioImg },
  ];

  // Data kartu fitur utama (Section 2 - Overview)
  const featureCards = [
    {
      icon: <Bus size={28} />,
      title: "Transportasi Lengkap",
      desc: "Bandros, Trans Metro, dan Angkot dalam satu platform.",
      link: "#transportasi",
      color: "#2f6b52",
      iconBg: "rgba(47, 107, 82, 0.12)",
    },
    {
      icon: <MapPin size={28} />,
      title: "Halte Terintegrasi",
      desc: "Informasi halte lengkap dan real-time.",
      link: "#peta",
      color: "#2980b9",
      iconBg: "rgba(41, 128, 185, 0.12)",
    },
    {
      icon: <Camera size={28} />,
      title: "Wisata Terdekat",
      desc: "Temukan destinasi dalam radius 3.5 KM dari halte.",
      link: "#wisata",
      color: "#d8b15c",
      iconBg: "rgba(216, 177, 92, 0.12)",
    },
    {
      icon: <Layers size={28} />,
      title: "Peta Interaktif & Cerdas",
      desc: "Visualisasi spasial dengan teknologi WebGIS.",
      link: "/map",
      color: "#8b5cf6",
      iconBg: "rgba(139, 92, 246, 0.12)",
    },
  ];

  // Data statistik platform
  const statsData = [
    { value: counts[0], suffix: "+", label: "Halte", icon: <Bus size={28} /> },
    { value: counts[1], suffix: "+", label: "Rute Aktif", icon: <Navigation size={28} /> },
    { value: counts[2], suffix: "", label: "Moda Transportasi", icon: <Layers size={28} /> },
    { value: counts[3], suffix: "+", label: "Destinasi Wisata", icon: <Camera size={28} /> },
    { value: counts[4], suffix: " KM", label: "Radius Analisis", icon: <MapPin size={28} /> },
  ];

  return (
    <div className="home-page">
      {/* Navbar yang selalu tampil di atas */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────
          SECTION 1 — HERO FULLSCREEN
          ───────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="hero-section"
        aria-label="Hero Kabandung Heula"
      >
        {/* Lapisan gambar latar belakang */}
        <div className="hero-bg-layers" aria-hidden="true">
          <img src={gedungSateBg} alt="" className="hero-bg-photo" />
          {/* Gradasi gelap dari kiri agar teks terbaca */}
          <div className="hero-gradient-left" />
          {/* Gradasi bawah — menyatu ke halaman */}
          <div className="hero-gradient-bottom" />
          {/* Efek kabut hanya di bagian paling bawah */}
          <img src={kabut} alt="" className="hero-fog-bottom" aria-hidden="true" />
        </div>

        {/* Konten hero di atas latar belakang */}
        <div className="hero-container">
          {/* Kolom kiri — teks dan tombol */}
          <div className="hero-left">
            <h1 className="hero-heading animate-fade-up">
              Kabandung
              <span className="hero-heading-accent">Heula</span>
            </h1>

            <p className="hero-subtitle animate-fade-up delay-100">
              Smart Mobility &amp; Tourism Platform for Bandung
            </p>

            <p className="hero-desc animate-fade-up delay-200">
              Jelajahi rute transportasi publik, halte, dan destinasi wisata
              menarik di Kota Bandung melalui WebGIS interaktif yang cerdas dan
              mudah digunakan.
            </p>

            {/* Dua tombol aksi utama */}
            <div className="hero-cta-row animate-fade-up delay-300">
              <button
                id="hero-cta-map"
                className="hero-btn-primary"
                onClick={() => navigate("/map")}
              >
                <MapIcon size={18} />
                Buka Peta Interaktif
                <ArrowRight size={16} />
              </button>
              <button
                className="hero-btn-secondary"
                onClick={() => {
                  document
                    .getElementById("wisata")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Lihat Wisata
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Kolom kanan — floating transport card glassmorphism */}
          <div className="hero-right animate-fade-right delay-300">
            <div className="hero-transport-card">
              {/* Baris transportasi #1 */}
              <div className="hero-transport-row">
                <div
                  className="hero-transport-icon"
                  style={{ background: "rgba(47,107,82,0.15)", color: "#2f6b52" }}
                >
                  <Bus size={22} />
                </div>
                <div className="hero-transport-info">
                  <span className="hero-transport-name">Trans Metro Bandung</span>
                  <span className="hero-transport-meta">20 Rute Aktif</span>
                </div>
              </div>

              {/* Pemisah */}
              <div className="hero-transport-divider" />

              {/* Baris transportasi #2 */}
              <div className="hero-transport-row">
                <div
                  className="hero-transport-icon"
                  style={{ background: "rgba(41,128,185,0.15)", color: "#2980b9" }}
                >
                  <Bus size={22} />
                </div>
                <div className="hero-transport-info">
                  <span className="hero-transport-name">Bandros (Bus Wisata)</span>
                  <span className="hero-transport-meta">15 Halte</span>
                </div>
              </div>

              {/* Pemisah */}
              <div className="hero-transport-divider" />

              {/* Baris wisata */}
              <div className="hero-transport-row">
                <div
                  className="hero-transport-icon"
                  style={{ background: "rgba(216,177,92,0.15)", color: "#c4902a" }}
                >
                  <MapPin size={22} />
                </div>
                <div className="hero-transport-info">
                  <span className="hero-transport-name">Wisata Terdekat</span>
                  <span className="hero-transport-meta">59 Lokasi</span>
                </div>
              </div>

              {/* Tombol lihat semua */}
              <button
                className="hero-transport-see-all"
                onClick={() => navigate("/map")}
              >
                <Navigation size={14} />
                Lihat Semua
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Wave divider putih — transisi ke section berikutnya */}
        <div className="hero-wave-divider" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
              fill="var(--color-bg)"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 2 — SMART CITY OVERVIEW (Feature Cards)
          ───────────────────────────────────────────────────── */}
      <section id="overview" className="overview-section">
        <div className="overview-container">
          <div className="section-header-center" data-animate>
            <span className="section-label">Fitur Platform</span>
            <div className="divider-accent-center" />
            <h2 className="section-title" style={{ textAlign: "center" }}>
              Smart City Overview
            </h2>
            <p className="section-subtitle" style={{ textAlign: "center", margin: "0 auto" }}>
              Semua yang Anda butuhkan untuk menjelajahi Bandung secara cerdas
            </p>
          </div>

          {/* Grid 4 card fitur */}
          <div className="overview-grid-v2" data-animate-group>
            {featureCards.map((card) => (
              <button
                key={card.title}
                className="overview-card-v2"
                onClick={() => {
                  if (card.link.startsWith("/")) navigate(card.link);
                  else {
                    const el = document.querySelector(card.link);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                aria-label={`Lihat detail: ${card.title}`}
              >
                {/* Icon berwarna */}
                <div
                  className="overview-card-v2-icon"
                  style={{ background: card.iconBg, color: card.color }}
                >
                  {card.icon}
                </div>
                <h3 className="overview-card-v2-title">{card.title}</h3>
                <p className="overview-card-v2-desc">{card.desc}</p>
                {/* Tombol panah */}
                <div
                  className="overview-card-v2-arrow"
                  style={{ background: card.iconBg, color: card.color }}
                >
                  <ArrowRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 3 — TRANSPORTASI
          ───────────────────────────────────────────────────── */}
      <section id="transportasi" className="transport-section">
        <div className="transport-texture" aria-hidden="true">
          <img src={textureBackground} alt="" />
        </div>
        <div className="transport-mountain" aria-hidden="true">
          <img src={backgroundGunung} alt="" />
        </div>

        <div className="transport-container">
          <div className="section-header-split" data-animate>
            <div>
              <span className="section-label">Moda Transportasi</span>
              <div className="divider-accent" />
              <h2 className="section-title">Moda Transportasi Bandung</h2>
            </div>
            <button
              className="btn-secondary"
              onClick={() => navigate("/map")}
            >
              Lihat di Peta <ChevronRight size={14} />
            </button>
          </div>

          <div className="transport-grid" data-animate-group>
            {transportData.map((t) => (
              <article key={t.id} className="transport-card-premium">
                <div className="transport-img-wrap">
                  <img
                    src={t.img}
                    alt={t.fullName}
                    className="transport-img"
                  />
                  <div className="transport-static-overlay">
                    <span className={`transport-badge-top badge-moda-${t.id}`}>
                      {t.badge}
                    </span>
                    <h3 className="transport-static-name">{t.fullName}</h3>
                  </div>
                </div>
                <div className="transport-glass-overlay">
                  <p className="transport-overlay-desc">{t.desc}</p>
                  <div className="transport-overlay-stats">
                    {t.stats.map((s, i) => (
                      <span key={i} className="transport-overlay-stat">
                        {s.icon}
                        {s.label}
                      </span>
                    ))}
                  </div>
                  <div className="transport-overlay-meta">
                    {t.meta.map((m, i) => (
                      <span key={i} className="transport-overlay-meta-item">
                        {m.icon}
                        {m.label}
                      </span>
                    ))}
                  </div>
                  <button
                    className="transport-overlay-cta"
                    onClick={() => navigate("/map")}
                  >
                    Lihat Detail <ChevronRight size={13} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 4 — WISATA TERDEKAT
          ───────────────────────────────────────────────────── */}
      <section id="wisata" className="wisata-section">
        <div className="wisata-container">
          <div className="section-header-split" data-animate>
            <div>
              <span className="section-label">Radius 3.5 KM dari Halte</span>
              <div className="divider-accent" />
              <h2 className="section-title">Wisata Terdekat dari Halte</h2>
            </div>
            <button
              className="btn-secondary"
              onClick={() => navigate("/map")}
            >
              Lihat Semua <ChevronRight size={14} />
            </button>
          </div>

          <div className="wisata-grid-scroll" role="list" data-animate>
            {wisataData.map((w) => (
              <article
                key={w.name}
                className="wisata-card-large"
                role="listitem"
                onClick={() => navigate("/map")}
                aria-label={`${w.name} — ${w.dist} dari halte terdekat`}
              >
                <div className="wisata-large-img-wrap">
                  <img src={w.img} alt={w.name} className="wisata-large-img" />
                  <div className="wisata-static-overlay">
                    <span className={`wisata-dist-pill ${distBadgeClass(w.km)}`}>
                      <MapPin size={10} />
                      {w.dist}
                    </span>
                    <h4 className="wisata-static-name">{w.name}</h4>
                  </div>
                  <div className="wisata-large-gradient" aria-hidden="true" />
                  <div className="wisata-large-overlay">
                    <span className="wisata-large-sub">
                      Dalam radius halte &bull; Klik untuk detail
                    </span>
                    <button className="wisata-large-cta">
                      Mulai Eksplorasi <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 5 — PETA INTERAKTIF PREVIEW (WebGIS Feel)
          ───────────────────────────────────────────────────── */}
      <section id="map-preview" className="map-preview-section">
        <div className="map-preview-container" data-animate>
          {/* Kolom kiri — teks fitur */}
          <div className="map-preview-content">
            <span className="section-label">Interactive Platform</span>
            <h2 className="section-title">
              Peta Interaktif
              <br />
              Kota Bandung
            </h2>
            <p className="section-subtitle">
              Jelajahi rute, halte, dan destinasi wisata dengan visualisasi peta
              interaktif.
            </p>

            {/* Daftar fitur peta */}
            <ul className="map-preview-features">
              {[
                "Layer transportasi lengkap",
                "Pencarian halte terdekat",
                "Wisata dalam radius 3.5 KM",
                "Informasi detail &amp; akurat",
              ].map((f, i) => (
                <li key={i}>
                  <CheckCircle
                    size={16}
                    color="var(--color-primary)"
                    aria-hidden="true"
                  />
                  <span dangerouslySetInnerHTML={{ __html: f }} />
                </li>
              ))}
            </ul>

            <button
              className="btn-primary map-preview-btn"
              onClick={() => navigate("/map")}
            >
              Mulai Eksplorasi Peta <ArrowRight size={18} />
            </button>
          </div>

          {/* Kolom kanan — pratinjau peta tiruan WebGIS */}
          <div className="map-preview-mockup">
            <MapPreviewMockup onNavigate={() => navigate("/map")} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 6 — STATISTIK PLATFORM (Dark Green)
          ───────────────────────────────────────────────────── */}
      <section id="statistik" className="stats-dark-section" ref={statsRef}>
        {/* Dekorasi latar gunung */}
        <div className="stats-mountain" aria-hidden="true">
          <img src={backgroundGunung} alt="" />
        </div>
        {/* Efek glow hijau */}
        <div className="stats-glow-left" aria-hidden="true" />
        <div className="stats-glow-right" aria-hidden="true" />

        <div className="stats-container">
          <div data-animate style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label" style={{ color: "var(--color-accent)" }}>
              Data Platform
            </span>
            <div
              className="divider-accent-center"
              style={{
                background:
                  "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))",
              }}
            />
            <h2
              className="section-title"
              style={{ color: "white", textAlign: "center" }}
            >
              Smart Tourism Insights
            </h2>
          </div>

          {/* Grid 5 kotak statistik dengan counter animasi */}
          <div className="stats-grid-v2" data-animate-group>
            {statsData.map((s, i) => (
              <div key={i} className="stats-item-v2">
                <div className="stats-item-icon">{s.icon}</div>
                <span className="stats-value">
                  {s.value}{s.suffix}
                </span>
                <span className="stats-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 7 — CTA AKHIR
          ───────────────────────────────────────────────────── */}
      <section id="tentang" className="cta-section">
        <div className="cta-container" data-animate>
          <span className="section-label">Siap Menjelajahi?</span>
          <h2 className="section-title" style={{ textAlign: "center" }}>
            Siap Menjelajahi Bandung?
          </h2>
          <p
            className="section-subtitle"
            style={{ textAlign: "center", margin: "0 auto var(--space-8)" }}
          >
            Buka peta interaktif sekarang dan temukan rute, halte, dan destinasi
            wisata terbaik di Kota Bandung.
          </p>
          <button
            id="cta-open-map"
            className="btn-primary"
            style={{ padding: "16px 40px", fontSize: "var(--text-lg)" }}
            onClick={() => navigate("/map")}
          >
            Buka Peta Sekarang
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          FOOTER
          ───────────────────────────────────────────────────── */}
      <footer id="footer" className="footer-section" role="contentinfo">
        <div className="footer-mountain" aria-hidden="true">
          <img src={footerGunung} alt="" />
        </div>

        <div className="footer-container">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
                <path
                  d="M12 2.5C9 4.5 4.5 6 4.5 11C4.5 15.5 7.5 19.5 12 21.5C16.5 19.5 19.5 15.5 19.5 11C19.5 6 15 4.5 12 2.5Z"
                  fill="var(--color-accent)"
                  opacity="0.25"
                />
                <path
                  d="M12 2.5C9 4.5 4.5 6 4.5 11C4.5 15.5 7.5 19.5 12 21.5C16.5 19.5 19.5 15.5 19.5 11C19.5 6 15 4.5 12 2.5Z"
                  stroke="var(--color-accent)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="12" cy="11.5" r="2.5" fill="var(--color-accent)" />
              </svg>
              <span>Kabandung Heula</span>
            </div>
            <p className="footer-tagline">Smart Mobility &amp; Tourism Platform</p>
            <p className="footer-brand-desc">
              Platform WebGIS Smart City Bandung untuk transportasi dan pariwisata
              berbasis data spasial. Dibangun sebagai proyek Sistem Informasi
              Geografis ITERA.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Instagram" className="footer-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="footer-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigasi */}
          <nav className="footer-nav-col" aria-label="Navigasi footer">
            <h4 className="footer-col-title">Navigasi</h4>
            <ul className="footer-links">
              {["Beranda", "Transportasi", "Wisata", "Peta Interaktif", "Tentang Kami"].map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </nav>

          {/* Transportasi */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Transportasi</h4>
            <ul className="footer-links">
              {["Bandros (Bus Wisata)", "Trans Metro Bandung", "Angkutan Kota"].map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Tim */}
          <div className="footer-nav-col footer-tim">
            <h4 className="footer-col-title">Tim Pengembang</h4>
            <ul className="footer-links footer-team">
              <li className="footer-team-item">
                <span className="footer-team-name">Muhammad Piela Nugraha</span>
                <span className="footer-team-nim">123140200</span>
              </li>
              <li className="footer-team-item">
                <span className="footer-team-name">Reihan Oktavian Putra</span>
                <span className="footer-team-nim">123140202</span>
              </li>
              <li className="footer-team-item">
                <span className="footer-team-name">Firman Gultom</span>
                <span className="footer-team-nim">123140171</span>
              </li>
            </ul>
            <div className="footer-institute">
              <p>Institut Teknologi Sumatera</p>
              <p>Teknik Informatika</p>
              <p>Sistem Informasi Geografis · 2026</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Kabandung Heula. All rights reserved.</p>
          <p>Dibangun dengan ♥ untuk Bandung yang lebih cerdas.</p>
        </div>
      </footer>
    </div>
  );
}
