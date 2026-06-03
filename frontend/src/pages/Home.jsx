import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
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
  CheckSquare,
} from "lucide-react";

import Navbar from "../components/Navbar";

// ── Local Assets ──────────────────────────────────────────
import gedungSateBg from "../assets/asset_bandung/hero/gedung sate_2.png";
import backgroundGunung from "../assets/asset_bandung/ornamen/BACKGROUND GUNUNG.png";
import kabut from "../assets/asset_bandung/ornamen/Kabut.png";
import daunOrnamen from "../assets/asset_bandung/ornamen/DAUN ORNAMEN.png";
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

// MINI MAP — Static preview for hero section - Non-interactive, light CartoDB Positron tile
function MiniMap() {
  return (
    <MapContainer
      center={[-6.914744, 107.60981]}
      zoom={13}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      keyboard={false}
      touchZoom={false}
      boxZoom={false}
      attributionControl={false}
      style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
    </MapContainer>
  );
}

// SCROLL ANIMATION — IntersectionObserver utility
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// HOME PAGE
export default function Home() {
  const navigate = useNavigate();
  useScrollAnimation();

  /* ── Counter animation for Smart City Overview ─────── */
  const overviewRef = useRef(null);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const counterTargets = [3, 59, 50, 3.5];

  useEffect(() => {
    const el = overviewRef.current;
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
            parseFloat((t * counterTargets[3]).toFixed(1)),
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

  /* ── Distance badge helper ──────────────────────────── */
  const distBadgeClass = (km) => {
    const v = parseFloat(km);
    if (v < 1.0) return "badge-dist-near";
    if (v < 2.0) return "badge-dist-mid";
    return "badge-dist-far";
  };

  /* ── Data ───────────────────────────────────────────── */
  const transportData = [
    {
      id: "bandros",
      badge: "BUS WISATA",
      badgeClass: "badge-bandros",
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
      badgeClass: "badge-tmb",
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
      badgeClass: "badge-angkot",
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

  const wisataData = [
    { name: "Braga City Walk", dist: "0.9 KM", km: 0.9, img: bragaImg },
    { name: "Museum Asia Afrika", dist: "0.5 KM", km: 0.5, img: asiaAfrikaImg },
    { name: "Alun-Alun Bandung", dist: "0.2 KM", km: 0.2, img: alunAlunImg },
    { name: "Masjid Al-Jabar", dist: "2.5 KM", km: 2.5, img: masjidAlJabarImg },
    { name: "Museum Geologi", dist: "1.2 KM", km: 1.2, img: museumGeologiImg },
    {
      name: "Trans Studio Bandung",
      dist: "2.8 KM",
      km: 2.8,
      img: transStudioImg,
    },
  ];

  const featureCards = [
    {
      icon: <Bus size={26} />,
      title: "Transportasi",
      desc: "3 moda transportasi aktif yang menghubungkan berbagai kawasan di Bandung.",
      link: "#transportasi",
      suffix: "",
      color: "var(--color-tmb)",
      iconBg: "rgba(58, 130, 195, 0.12)",
    },
    {
      icon: <MapPin size={26} />,
      title: "Halte Aktif",
      desc: "59 halte strategis yang tersebar di seluruh rute transportasi Bandung.",
      link: "#peta",
      suffix: "",
      color: "var(--color-primary)",
      iconBg: "rgba(47, 107, 82, 0.12)",
    },
    {
      icon: <Camera size={26} />,
      title: "Destinasi Wisata",
      desc: "50+ destinasi wisata menarik di sekitar rute halte dan moda transportasi.",
      link: "#wisata",
      suffix: "+",
      color: "var(--color-accent)",
      iconBg: "rgba(216, 177, 92, 0.12)",
    },
    {
      icon: <Navigation size={26} />,
      title: "Radius Analisis",
      desc: "Temukan wisata dalam radius 3.5 KM dari halte yang Anda pilih secara cerdas.",
      link: "/map",
      suffix: " KM",
      color: "var(--color-bandros)",
      iconBg: "rgba(202, 137, 30, 0.12)",
    },
  ];

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="home-page">
      {/* Sticky floating navbar */}
      <Navbar />

      {/*  */}
      <section
        id="hero"
        className="hero-section"
        aria-label="Hero — Kabandung Heula Smart Tourism Platform"
      >
        {/* ── Background layers ── */}
        <div className="hero-bg-layers" aria-hidden="true">
          {/* Primary: Gedung Sate landscape */}
          <img src={gedungSateBg} alt="" className="hero-bg-photo" />
          {/* Secondary: Mountain silhouette */}
          <img src={backgroundGunung} alt="" className="hero-bg-mountain" />
          {/* Atmospheric fog */}
          <img src={kabut} alt="" className="hero-bg-fog animate-fog" />
          {/* Left gradient overlay (for text readability) */}
          <div className="hero-gradient-left" />
          {/* Bottom gradient (blends into page bg) */}
          <div className="hero-gradient-bottom" />
        </div>

        {/* ── Leaf ornaments ── */}
        <img
          src={daunOrnamen}
          alt=""
          className="hero-leaf hero-leaf--tl animate-leaf"
          aria-hidden="true"
        />
        <img
          src={daunOrnamen}
          alt=""
          className="hero-leaf hero-leaf--br animate-leaf delay-500"
          aria-hidden="true"
        />

        {/* ── Main content grid ── */}
        <div className="hero-container">
          {/* LEFT — Copy + CTA */}
          <div className="hero-left">
            {/* Smart City badge (revision #4) */}
            <div className="hero-smart-badge animate-fade-down">
              <span className="hero-badge-dot" aria-hidden="true">
                ◉
              </span>
              Smart Mobility &amp; Tourism Platform
            </div>

            {/* Main heading */}
            <h1 className="hero-heading animate-fade-up delay-100">
              Kabandung
              <span className="hero-heading-accent">Heula</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle animate-fade-up delay-200">
              Smart Mobility &amp; Tourism Platform for Bandung
            </p>

            {/* Description */}
            <p className="hero-desc animate-fade-up delay-300">
              Jelajahi rute transportasi publik, halte, dan destinasi wisata
              menarik di Kota Bandung melalui WebGIS interaktif yang cerdas dan
              mudah digunakan.
            </p>

            {/* Single primary CTA (revision #3) */}
            <button
              id="hero-cta-map"
              className="hero-cta btn-primary animate-fade-up delay-400"
              onClick={() => navigate("/map")}
              aria-label="Buka peta interaktif Kabandung Heula"
            >
              <MapIcon size={18} aria-hidden="true" />
              Mulai Eksplorasi
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          {/* RIGHT — Mini map + stats (revision #5) */}
          <div className="hero-right animate-fade-right delay-300">
            {/* Mini Map Preview */}
            <div
              className="hero-map-card glass animate-float-card"
              role="img"
              aria-label="Pratinjau peta interaktif Bandung"
            >
              <div className="hero-map-header">
                <div className="hero-map-status">
                  <span className="hero-map-dot" aria-hidden="true" />
                  <span>Peta Bandung</span>
                </div>
                <span className="hero-map-live" aria-label="Status: Online">
                  ● Online
                </span>
              </div>
              <div className="hero-map-viewport">
                <MiniMap />
                {/* Click overlay → navigate to full map */}
                <button
                  className="hero-map-overlay"
                  onClick={() => navigate("/map")}
                  aria-label="Buka peta lengkap"
                >
                  <span className="hero-map-overlay-text">
                    <Layers size={16} aria-hidden="true" />
                    Buka Peta Lengkap
                  </span>
                </button>
              </div>
            </div>

            {/* Stats Cards (revision #3 — value-based) */}
            <div className="hero-stats-card glass animate-float-slow delay-200">
              <div className="hero-stat-row">
                <div
                  className="hero-stat-icon"
                  style={{
                    background: "var(--color-tmb-light)",
                    color: "var(--color-tmb)",
                  }}
                >
                  <MapPin size={16} aria-hidden="true" />
                </div>
                <div className="hero-stat-info">
                  <span className="hero-stat-value">59</span>
                  <span className="hero-stat-label">Halte Aktif</span>
                </div>
              </div>

              <div className="hero-stat-divider" aria-hidden="true" />

              <div className="hero-stat-row">
                <div
                  className="hero-stat-icon"
                  style={{
                    background: "var(--color-bandros-light)",
                    color: "var(--color-bandros)",
                  }}
                >
                  <Bus size={16} aria-hidden="true" />
                </div>
                <div className="hero-stat-info">
                  <span className="hero-stat-value">20</span>
                  <span className="hero-stat-label">Rute Terintegrasi</span>
                </div>
              </div>

              <div className="hero-stat-divider" aria-hidden="true" />

              <div className="hero-stat-row">
                <div
                  className="hero-stat-icon"
                  style={{
                    background: "rgba(216,177,92,0.12)",
                    color: "var(--color-accent)",
                  }}
                >
                  <Camera size={16} aria-hidden="true" />
                </div>
                <div className="hero-stat-info">
                  <span className="hero-stat-value">50+</span>
                  <span className="hero-stat-label">Destinasi Wisata</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mountain wave divider ── */}
        <div className="hero-mountain-divider" aria-hidden="true">
          <img src={footerGunung} alt="" />
        </div>
      </section>

      {/*  */}
      <section id="overview" className="overview-section" ref={overviewRef}>
        {/* Leaf ornaments */}
        <img
          src={daunOrnamen}
          alt=""
          className="overview-leaf-left"
          aria-hidden="true"
        />
        <img
          src={daunOrnamen}
          alt=""
          className="overview-leaf-right"
          aria-hidden="true"
        />

        <div className="overview-container">
          <div className="section-header-center" data-animate>
            <span className="section-label">Fitur Platform</span>
            <div className="divider-accent-center" />
            <h2 className="section-title" style={{ textAlign: "center" }}>
              Smart City Overview
            </h2>
            <p
              className="section-subtitle"
              style={{ textAlign: "center", margin: "0 auto" }}
            >
              Semua yang Anda butuhkan untuk menjelajahi Bandung secara cerdas
            </p>
          </div>

          <div className="overview-grid" data-animate-group>
            {featureCards.map((card, idx) => (
              <button
                key={card.title}
                className="overview-card-glass"
                onClick={() => {
                  if (card.link.startsWith("/")) navigate(card.link);
                  else {
                    const el = document.querySelector(card.link);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                aria-label={`Lihat detail: ${card.title}`}
              >
                {/* Color-coded icon */}
                <div
                  className="overview-card-icon-wrap"
                  style={{ background: card.iconBg, color: card.color }}
                >
                  {card.icon}
                </div>

                {/* Animated counter */}
                <div className="overview-card-counter" aria-live="polite">
                  <span
                    className="overview-count-num"
                    style={{ color: card.color }}
                  >
                    {counts[idx]}
                    {card.suffix}
                  </span>
                </div>

                <h3 className="overview-card-title">{card.title}</h3>
                <p className="overview-card-desc">{card.desc}</p>

                <span
                  className="overview-card-cta"
                  style={{ color: card.color }}
                >
                  Lihat Detail <ChevronRight size={14} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>

          {/* Mountain divider to next section */}
          <div className="overview-divider" aria-hidden="true">
            <img src={footerGunung} alt="" />
          </div>
        </div>
      </section>

      {/*  */}
      <section id="transportasi" className="transport-section">
        {/* Texture background */}
        <div className="transport-texture" aria-hidden="true">
          <img src={textureBackground} alt="" />
        </div>
        {/* Mountain ornament */}
        <div className="transport-mountain" aria-hidden="true">
          <img src={backgroundGunung} alt="" />
        </div>
        {/* Leaf ornament */}
        <img
          src={daunOrnamen}
          alt=""
          className="transport-leaf"
          aria-hidden="true"
        />

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
              aria-label="Lihat peta semua transportasi"
            >
              Lihat di Peta <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="transport-grid" data-animate-group>
            {transportData.map((t) => (
              <article key={t.id} className="transport-card-premium">
                {/* Full-bleed image */}
                <div className="transport-img-wrap">
                  <img
                    src={t.img}
                    alt={`${t.fullName} Bandung`}
                    className="transport-img"
                  />

                  {/* Static overlay (always visible) */}
                  <div className="transport-static-overlay">
                    <span className={`transport-badge-top badge-moda-${t.id}`}>
                      {t.badge}
                    </span>
                    <h3 className="transport-static-name">{t.fullName}</h3>
                  </div>
                </div>

                {/* Glass overlay at bottom (hover only) */}
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
                    aria-label={`Lihat detail ${t.fullName} di peta`}
                  >
                    Lihat Detail <ChevronRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/*  */}
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
              aria-label="Lihat semua wisata di peta interaktif"
            >
              Lihat Semua <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Grid/Scroll wrapper */}
          <div className="wisata-grid-scroll" role="list" data-animate>
            {wisataData.map((w) => (
              <article
                key={w.name}
                className="wisata-card-large"
                role="listitem"
                onClick={() => navigate("/map")}
                aria-label={`${w.name} — ${w.dist} dari halte terdekat`}
              >
                {/* Full-bleed image */}
                <div className="wisata-large-img-wrap">
                  <img src={w.img} alt={w.name} className="wisata-large-img" />

                  {/* Static overlay (always visible) */}
                  <div className="wisata-static-overlay">
                    <span
                      className={`wisata-dist-pill ${distBadgeClass(w.km)}`}
                    >
                      <MapPin size={10} aria-hidden="true" />
                      {w.dist}
                    </span>
                    <h4 className="wisata-static-name">{w.name}</h4>
                  </div>

                  {/* Bottom gradient overlay (hover only) */}
                  <div className="wisata-large-gradient" aria-hidden="true" />

                  {/* Name overlay at bottom */}
                  <div className="wisata-large-overlay">
                    <span className="wisata-large-sub">
                      Dalam radius halte &bull; Klik untuk detail
                    </span>
                    <button className="wisata-large-cta">
                      Mulai Eksplorasi{" "}
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/*  */}
      <section id="map-preview" className="map-preview-section">
        {/* Decorative background leaf */}
        <img
          src={daunOrnamen}
          alt=""
          className="map-preview-leaf"
          aria-hidden="true"
        />

        <div className="map-preview-container" data-animate>
          <div className="map-preview-content">
            <span className="section-label">Interactive Platform</span>
            <h2 className="section-title">Peta Interaktif Kota Bandung</h2>
            <p className="section-subtitle">
              Jelajahi halte, rute transportasi, dan destinasi wisata dalam satu
              platform WebGIS premium.
            </p>

            <ul className="map-preview-features">
              <li>
                <CheckSquare size={16} color="var(--color-primary)" /> 59 Halte
                Aktif
              </li>
              <li>
                <CheckSquare size={16} color="var(--color-tmb)" /> 20 Rute
                Transportasi
              </li>
              <li>
                <CheckSquare size={16} color="var(--color-accent)" /> 50+
                Destinasi Wisata
              </li>
              <li>
                <CheckSquare size={16} color="var(--color-bandros)" /> Radius
                Analisis 3.5 KM
              </li>
            </ul>

            <button
              className="btn-primary map-preview-btn"
              onClick={() => navigate("/map")}
              aria-label="Buka peta interaktif penuh"
            >
              Buka Peta Interaktif <MapIcon size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="map-preview-mockup">
            {/* The MiniMap component acting as a live preview */}
            <div className="map-preview-map-wrapper">
              <MiniMap />
            </div>

            {/* Floating glass panel on top of the map preview to make it look like a dashboard */}
            <div className="map-preview-glass-panel layer-panel">
              <div className="panel-header">
                <Layers size={14} /> Layer Aktif
              </div>
              <div className="panel-item">
                <div
                  className="dot"
                  style={{ background: "var(--color-tmb)" }}
                />{" "}
                Trans Metro
              </div>
              <div className="panel-item">
                <div
                  className="dot"
                  style={{ background: "var(--color-bandros)" }}
                />{" "}
                Bandros
              </div>
              <div className="panel-item">
                <div
                  className="dot"
                  style={{ background: "var(--color-primary)" }}
                />{" "}
                Halte
              </div>
            </div>

            <div className="map-preview-glass-panel radius-panel">
              <div className="panel-header">
                <Navigation size={14} /> Radius
              </div>
              <div className="panel-value">3.5 KM</div>
            </div>
          </div>
        </div>
      </section>

      {/*  */}
      <section id="statistik" className="stats-dark-section">
        {/* Mountain decoration */}
        <div className="stats-mountain" aria-hidden="true">
          <img src={backgroundGunung} alt="" />
        </div>

        <div className="stats-container">
          <div
            data-animate
            style={{ textAlign: "center", marginBottom: "var(--space-12)" }}
          >
            <span
              className="section-label"
              style={{ color: "var(--color-accent)" }}
            >
              Data Real-Time Platform
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
              style={{
                color: "var(--color-text-inverse)",
                textAlign: "center",
              }}
            >
              Smart Tourism Insights
            </h2>
            <p
              className="section-subtitle"
              style={{
                color: "rgba(255,255,255,0.60)",
                textAlign: "center",
                margin: "0 auto",
              }}
            >
              Statistik nyata sistem WebGIS Kabandung Heula
            </p>
          </div>

          <div className="stats-grid" data-animate-group>
            {[
              { value: "59+", label: "Halte", sub: "Tersebar di seluruh kota" },
              { value: "20+", label: "Rute Aktif", sub: "TMB & Angkutan Kota" },
              {
                value: "3",
                label: "Moda Transportasi",
                sub: "TMB, Bandros, Angkot",
              },
              {
                value: "50+",
                label: "Destinasi Wisata",
                sub: "Terindeks dalam sistem",
              },
              {
                value: "3.5",
                label: "KM Radius",
                sub: "Analisis wisata terdekat",
              },
            ].map((s) => (
              <div key={s.label} className="stats-item">
                <span className="stats-value">{s.value}</span>
                <span className="stats-label">{s.label}</span>
                <span className="stats-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  */}
      <section id="tentang" className="cta-section">
        <div className="cta-leaf" aria-hidden="true">
          <img src={daunOrnamen} alt="" />
        </div>
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
            aria-label="Buka peta interaktif Kabandung Heula"
          >
            Buka Peta Sekarang
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/*  */}
      <footer id="footer" className="footer-section" role="contentinfo">
        {/* Mountain texture top */}
        <div className="footer-mountain" aria-hidden="true">
          <img src={footerGunung} alt="" />
        </div>

        <div className="footer-container">
          {/* ── Brand ── */}
          <div className="footer-brand">
            <div className="footer-logo">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="22"
                height="22"
                aria-hidden="true"
              >
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
            <p className="footer-tagline">
              Smart Mobility &amp; Tourism Platform
            </p>
            <p className="footer-brand-desc">
              Platform WebGIS Smart City Bandung untuk transportasi dan
              pariwisata berbasis data spasial. Dibangun sebagai proyek Sistem
              Informasi Geografis ITERA.
            </p>
            <div className="footer-social">
              <a
                href="#"
                aria-label="Instagram Kabandung Heula"
                className="footer-social-link"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="14"
                  height="14"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="YouTube Kabandung Heula"
                className="footer-social-link"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="14"
                  height="14"
                >
                  <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository Kabandung Heula"
                className="footer-social-link"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="14"
                  height="14"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
            </div>
          </div>

          {/* ── Navigasi ── */}
          <nav className="footer-nav-col" aria-label="Navigasi footer">
            <h4 className="footer-col-title">Navigasi</h4>
            <ul className="footer-links">
              {[
                "Beranda",
                "Transportasi",
                "Wisata",
                "Peta Interaktif",
                "Tentang Kami",
              ].map((l) => (
                <li key={l}>
                  <a href="#">{l}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Transportasi ── */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Transportasi</h4>
            <ul className="footer-links">
              {[
                "Bandros (Bus Wisata)",
                "Trans Metro Bandung",
                "Angkutan Kota",
              ].map((l) => (
                <li key={l}>
                  <a href="#">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Lainnya ── */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Lainnya</h4>
            <ul className="footer-links">
              <li>
                <a href="#">Cara Penggunaan</a>
              </li>
              <li>
                <a href="#">FAQ</a>
              </li>
              <li>
                <a href="#">Kebijakan Privasi</a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Repository proyek"
                >
                  Github Repository ↗
                </a>
              </li>
              <li>
                <a href="#" aria-label="Dokumentasi platform">
                  Dokumentasi ↗
                </a>
              </li>
            </ul>
          </div>

          {/* ── Tim Pengembang ── */}
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
