import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Lock,
  X,
  Eye,
  EyeOff,
  MapPin,
  Bus,
  Users,
} from "lucide-react";
import "./Splash.css";
import api from "../api.js";

import backgroundGedung from "../assets/asset_bandung/hero/gedung sate_2.png";
import kabut from "../assets/asset_bandung/ornamen/Kabut.png";

export default function Splash() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("splash");
  const [fadeOut, setFadeOut] = useState(false);

  // tahan splash screen sebentar lalu masuk halaman utama
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setPhase("welcome"), 500); // durasi animasi memudar
    }, 1200); // tampil selama 1.2 detik

    return () => clearTimeout(timer);
  }, []);

  const closeLogin = () => setShowLogin(false);

  // layar splash awal
  if (phase === "splash") {
    return (
      <div className={`splash-screen${fadeOut ? " splash-fade-out" : ""}`}>
        <img src={backgroundGedung} alt="Bandung" className="splash-bg" />
        <div className="splash-overlay" aria-hidden="true" />
        <img src={kabut} alt="" className="splash-fog" aria-hidden="true" />

        <div className="splash-content">
          <div className="splash-logo-icon">
            <MapPin size={38} color="#10b981" strokeWidth={2.5} />
          </div>
          <h1 className="splash-title">
            <span className="splash-title-main">Kabandung</span>
            <span className="splash-title-accent">Heula</span>
          </h1>
        </div>
      </div>
    );
  }

  // layar utama
  return (
    <div className="welcome-fullscreen">
      {/* gambar latar belakang */}
      <img
        src={backgroundGedung}
        alt="Bandung"
        className="welcome-bg-full"
        style={{ objectPosition: "60% center" }}
      />

      {/* animasi efek kabut */}
      <img src={kabut} alt="" className="welcome-fog" aria-hidden="true" />

      {/* gradien latar untuk teks */}
      <div className="welcome-gradient-overlay" aria-hidden="true" />

      {/* konten teks & tombol kiri */}
      <div className="welcome-hero-content animate-fade-left">
        <h1 className="welcome-hero-title">
          Selamat Datang di
          <span className="welcome-hero-brand">Kabandung Heula</span>
        </h1>

        <p className="welcome-hero-desc">
          Platform WebGIS Interaktif untuk Transportasi dan Pariwisata Kota
          Bandung
        </p>

        {/* aksi utama */}
        <div className="welcome-hero-actions">
          <button
            id="btn-explore"
            className="hero-cta-btn hero-cta-primary"
            onClick={() => navigate("/home")}
          >
            <span className="hero-btn-icon">
              <Bus size={20} strokeWidth={2} />
            </span>
            <span className="hero-btn-label">
              <strong>Jelajahi Bandung</strong>
              <small>Eksplor transportasi &amp; wisata</small>
            </span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
