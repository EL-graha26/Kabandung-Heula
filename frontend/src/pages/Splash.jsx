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

import backgroundGedung from "../assets/asset_bandung/hero/gedung sate_2.png";
import kabut from "../assets/asset_bandung/ornamen/Kabut.png";

export default function Splash() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("splash");
  const [fadeOut, setFadeOut] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");

  // tahan splash screen sebentar lalu masuk halaman utama
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setPhase("welcome"), 500); // durasi animasi memudar
    }, 1200); // tampil selama 1.2 detik

    return () => clearTimeout(timer);
  }, []);

  const closeLogin = () => setShowLogin(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");
    closeLogin();
    navigate("/home");
  };

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

          <button
            id="btn-admin-login"
            className="hero-cta-btn hero-cta-secondary"
            onClick={() => setShowLogin(true)}
          >
            <span className="hero-btn-icon hero-btn-icon-lock">
              <Lock size={20} strokeWidth={2} />
            </span>
            <span className="hero-btn-label">
              <strong>Login Admin</strong>
              <small>Kelola data &amp; sistem</small>
            </span>
          </button>
        </div>
      </div>

      {/* modal form login */}
      {showLogin && (
        <div
          className="modal-overlay"
          onClick={closeLogin}
          role="dialog"
          aria-modal="true"
          aria-label="Modal masuk admin"
        >
          <div
            className="login-glass-card animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* tombol silang close */}
            <button
              className="modal-close-x"
              onClick={closeLogin}
              aria-label="Tutup modal"
            >
              <X size={15} />
            </button>

            {/* judul form */}
            <div className="modal-header">
              <div className="modal-icon" aria-hidden="true">
                <Lock size={22} color="#10b981" />
              </div>
              <h2>Masuk ke Dashboard</h2>
              <p>Gunakan akun admin untuk mengelola sistem</p>
            </div>

            {/* area form input */}
            <form
              onSubmit={handleLoginSubmit}
              className="modal-form"
              noValidate
            >
              <div className="form-group">
                <label htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  className="input"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-password">Password</label>
                <div className="input-password-wrap">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={
                      showPassword ? "Sembunyikan" : "Tampilkan password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="login-row-extras">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe((r) => !r)}
                  />
                  <span>Ingat saya</span>
                </label>
                <button type="button" className="forgot-password">
                  Lupa Password?
                </button>
              </div>

              {loginError && <p className="login-error-msg">{loginError}</p>}

              <button type="submit" className="btn-login-submit">
                Masuk <ArrowRight size={16} />
              </button>

              <div className="modal-divider">
                <span>atau</span>
              </div>

              <button
                type="button"
                className="btn-tamu"
                onClick={() => {
                  closeLogin();
                  navigate("/home");
                }}
              >
                <Users size={15} /> Eksplorasi Sebagai Tamu
              </button>

              <p className="login-tamu-note">
                Nikmati peta dan informasi tanpa login
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
