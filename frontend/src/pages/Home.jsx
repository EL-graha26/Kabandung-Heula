import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  MapPin,
  Bus,
  Navigation,
  Clock,
  Ticket,
  Map as MapIcon,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import Navbar from "../components/Navbar";

// Aset gambar gambar latar dan transportasi
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

// animasi muncul saat scroll
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

// Komponen pratinjau peta yangmenampilkan peta interaktif kecil dengan iframe. Saat diklik, navigasi ke halaman peta penuh.
function MapPreviewMockup({ onNavigate }) {
  return (
    <div className="map-mockup-root" style={{ padding: 0, overflow: "hidden", borderRadius: "16px" }}>
      <iframe
        src="/map?preview=true"
        title="Peta Interaktif Bandung"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}

// page home
export default function Home() {
  const navigate = useNavigate();
  useScrollAnimation();

  // warna badge berdasarkan jarak wisata
  const distBadgeClass = (km) => {
    const v = parseFloat(km);
    if (v < 1.0) return "badge-dist-near";
    if (v < 2.0) return "badge-dist-mid";
    return "badge-dist-far";
  };

  // Data transportasi 
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

  //destinasi wisata
  const wisataData = [
    { name: "Braga City Walk", dist: "0.9 KM", km: 0.9, img: bragaImg, desc: "Kawasan ikonik bergaya Eropa klasik di pusat kota dengan deretan kafe dan spot foto estetik." },
    { name: "Museum Asia Afrika", dist: "0.5 KM", km: 0.5, img: asiaAfrikaImg, desc: "Saksi sejarah bersatunya bangsa Asia-Afrika dengan koleksi dokumentasi peninggalan Konferensi 1955." },
    { name: "Alun-Alun Bandung", dist: "0.2 KM", km: 0.2, img: alunAlunImg, desc: "Ruang terbuka publik dengan rumput sintetis luas, berada tepat di depan Masjid Raya Bandung." },
    { name: "Masjid Al-Jabar", dist: "2.5 KM", km: 2.5, img: masjidAlJabarImg, desc: "Masjid raya megah dengan arsitektur futuristik yang seolah mengapung di atas danau." },
    { name: "Museum Geologi", dist: "1.2 KM", km: 1.2, img: museumGeologiImg, desc: "Wisata edukasi yang menyimpan fosil dinosaurus langka dan berbagai koleksi batuan bumi." },
    { name: "Trans Studio Bandung", dist: "2.8 KM", km: 2.8, img: transStudioImg, desc: "Taman hiburan indoor terbesar dengan puluhan wahana memacu adrenalin dan pertunjukan spektakuler." },
  ];

  return (
    <div className="home-page">
      {/* Navbar yang selalu tampil di atas */}
      <Navbar />

      {/*SECTION 1 — HERO FULLSCREEN */}
      <section
        id="hero"
        className="hero-section"
        aria-label="Hero Kabandung Heula"
      >

      // latar belakang
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
        {/* ini bungkus buat teks judul dan deskripsi yang numpuk di atas gambar background */}
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

            {/* ini tombol warna hijau buat buka halaman peta full interaktif */}
            <div className="hero-cta-row animate-fade-up delay-300">
              <button
                id="hero-cta-map"
                className="btn-primary"
                onClick={() => navigate("/map")}
                style={{ borderRadius: "100px", padding: "12px 24px" }}
              >
                <MapIcon size={18} />
                Buka Peta Interaktif
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ini pembatas ombak putih ke bagian bawahnya */}
        <div className="hero-wave-divider" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
              fill="var(--color-bg)"
            />
          </svg>
        </div>
      </section>

      {/*SECTION 2 — PETA INTERAKTIF PREVIEW (WebGIS Feel)*/}
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
            {/* caption deskripsi */}
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

          {/* peta interaktif kecil */}
          <div className="map-preview-mockup">
            <MapPreviewMockup onNavigate={() => navigate("/map")} />
          </div>
        </div>
      </section>

      {/*SECTION 3 — TRANSPORTASI*/}
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

      {/*SECTION 4 — WISATA TERDEKAT */}
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
                  <div className="wisata-glass-overlay">
                    <h4 className="wisata-overlay-name">{w.name}</h4>
                    <p className="wisata-overlay-desc">{w.desc}</p>
                    <button className="wisata-large-cta">
                      Lihat Detail <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

# bagian Footer
      <footer id="footer" className="footer-section" role="contentinfo">
        <div className="footer-mountain" aria-hidden="true">
          <img src={footerGunung} alt="" />
        </div>

        <div className="footer-container">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <MapPin size={24} color="var(--color-accent)" strokeWidth={2.5} />
              <span>Kabandung Heula</span>
            </div>
            <p className="footer-tagline">Smart Mobility &amp; Tourism Platform</p>
            <p className="footer-brand-desc">
              Platform WebGIS Smart City Bandung untuk transportasi dan pariwisata
              berbasis data spasial.
            </p>
            <div className="footer-social">
              <a href="https://github.com/EL-graha26/Kabandung-Heula" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="footer-social-link">
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
              <li><a href="#hero">Beranda</a></li>
              <li><a href="#map-preview">Peta Interaktif</a></li>
              <li><a href="#transportasi">Transportasi</a></li>
              <li><a href="#wisata">Wisata</a></li>
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
          <p>Dibangun oleh tim Aa Aa Team untuk tugas besar
              Sistem Informasi Geografis.</p>
        </div>
      </footer>
    </div>
  );
}
