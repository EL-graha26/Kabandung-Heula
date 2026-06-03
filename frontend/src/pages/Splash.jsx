import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Lock, X, Eye, EyeOff, MapPin } from "lucide-react";
import "./Splash.css";

// Local assets
import kotaBandung from "../assets/asset_bandung/hero/kota bandung.png";
import kabut from "../assets/asset_bandung/ornamen/Kabut.png";
import gedungSate from "../assets/asset_bandung/hero/gedung sate_3.jpg";
import daunOrnamen from "../assets/asset_bandung/ornamen/DAUN ORNAMEN.png";

export default function Splash() {
  const navigate = useNavigate();

  // Phase: 'loading' | 'welcome'
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Login modal
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Counter animation
  const [counters, setCounters] = useState({ halte: 0, rute: 0, wisata: 0 });

  const startTime = useRef(Date.now());

  /* -------------------------------------------------------
     LOADING PHASE
     Dynamic timing: Math.max(1800ms, assetsLoaded)
  ------------------------------------------------------- */
  useEffect(() => {
    let currentProg = 0;
    let rafId;

    const tick = () => {
      // Organic progress: fast at start, slows near 100
      const remaining = 100 - currentProg;
      const increment = Math.random() * (remaining * 0.15) + 1;
      currentProg = Math.min(currentProg + increment, 99);
      setProgress(currentProg);

      if (currentProg < 99) {
        // Schedule next tick with variable delay (80–180ms)
        const delay = 80 + Math.random() * 100;
        const timer = setTimeout(() => {
          rafId = requestAnimationFrame(tick);
        }, delay);
        rafId = timer;
      }
    };

    rafId = requestAnimationFrame(tick);

    // Ensure minimum display time before transitioning
    const minDisplayTimer = setTimeout(() => {
      // Snap to 100% and transition out
      setProgress(100);

      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 1800 - elapsed);

      setTimeout(() => {
        setFadeOut(true);
        // Wait for fade-out animation, then switch phase
        setTimeout(() => {
          setPhase("welcome");
        }, 500);
      }, remaining);
    }, 1800);

    return () => {
      clearTimeout(minDisplayTimer);
      if (typeof rafId === "number") {
        clearTimeout(rafId);
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  /* -------------------------------------------------------
     COUNTER ANIMATION — runs when welcome screen appears
  ------------------------------------------------------- */
  useEffect(() => {
    if (phase !== "welcome") return;

    const targets = { halte: 59, rute: 20, wisata: 50 };
    const duration = 1400; // ms
    const fps = 60;
    const totalSteps = Math.round((duration / 1000) * fps);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const t = step / totalSteps;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      setCounters({
        halte: Math.round(eased * targets.halte),
        rute: Math.round(eased * targets.rute),
        wisata: Math.round(eased * targets.wisata),
      });

      if (step >= totalSteps) clearInterval(timer);
    }, duration / totalSteps);

    return () => clearInterval(timer);
  }, [phase]);

  /* -------------------------------------------------------
     HANDLERS
  ------------------------------------------------------- */
  const handleExplore = () => navigate("/home");

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // Simulasi — tidak ada perubahan backend
    setLoginError("");
    setShowLogin(false);
    navigate("/home");
  };

  /* -------------------------------------------------------
     RENDER: SPLASH / LOADING
  ------------------------------------------------------- */
  if (phase === "loading") {
    return (
      <div className={`splash-screen${fadeOut ? " splash-fade-out" : ""}`}>
        {/* Background city drone view */}
        <img
          src={kotaBandung}
          alt="Aerial view of Bandung city"
          className="splash-bg"
        />

        {/* Atmospheric fog overlay */}
        <img
          src={kabut}
          alt=""
          className="splash-fog animate-fog"
          aria-hidden="true"
        />

        {/* Dark gradient overlay */}
        <div className="splash-overlay" aria-hidden="true" />

        {/* Center content */}
        <div className="splash-content animate-fade-up">
          {/* Logo icon */}
          <div className="splash-logo">
            <div className="splash-logo-icon">
              <MapPin size={28} color="white" />
            </div>
          </div>

          {/* Brand name */}
          <h1 className="splash-title">
            Kabandung
            <span className="splash-title-accent">Heula</span>
          </h1>

          <p className="splash-platform">
            Smart Mobility &amp; Tourism · Bandung
          </p>

          {/* Dynamic progress bar */}
          <div
            className="splash-progress-track"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="splash-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="splash-loading-text">
            Memuat data spasial… {Math.round(progress)}%
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     RENDER: WELCOME SCREEN
  ------------------------------------------------------- */
  return (
    <div className="welcome-screen animate-fade-in">
      <div className="welcome-container">
        {/*  */}
        <div className="welcome-left animate-fade-left">
          {/* Platform badge */}
          <div className="welcome-badge" role="status">
            <span className="badge-dot" aria-hidden="true" />
            Platform Resmi WebGIS Kota Bandung
          </div>

          {/* Heading */}
          <h1 className="welcome-title">
            Selamat Datang di
            <span className="welcome-title-brand">Kabandung Heula</span>
          </h1>

          {/* Description */}
          <p className="welcome-desc">
            Platform WebGIS Interaktif untuk transportasi dan pariwisata Kota
            Bandung. Jelajahi rute, halte, dan destinasi wisata dalam satu peta
            yang cerdas dan mudah digunakan.
          </p>

          {/* CTA Buttons */}
          <div className="welcome-actions">
            <button
              id="btn-explore"
              className="btn-primary welcome-cta"
              onClick={handleExplore}
              aria-label="Mulai menjelajahi peta Bandung"
            >
              <ArrowRight size={18} aria-hidden="true" />
              Jelajahi Bandung
            </button>

            <button
              id="btn-admin-login"
              className="btn-admin"
              onClick={() => setShowLogin(true)}
              aria-label="Masuk sebagai administrator"
            >
              <Lock size={16} aria-hidden="true" />
              Masuk Admin
            </button>
          </div>

          {/* Statistics with counter animation */}
          <div
            className="welcome-stats"
            role="region"
            aria-label="Statistik platform"
          >
            <div className="stat-item">
              <span className="stat-value" aria-live="polite">
                {counters.halte}
              </span>
              <span className="stat-label">Halte Aktif</span>
            </div>

            <div className="stat-divider" aria-hidden="true" />

            <div className="stat-item">
              <span className="stat-value" aria-live="polite">
                {counters.rute}
              </span>
              <span className="stat-label">Rute Aktif</span>
            </div>

            <div className="stat-divider" aria-hidden="true" />

            <div className="stat-item">
              <span className="stat-value" aria-live="polite">
                {counters.wisata}+
              </span>
              <span className="stat-label">Destinasi Wisata</span>
            </div>

            <div className="stat-divider" aria-hidden="true" />

            <div className="stat-item">
              <span className="stat-value">3.5</span>
              <span className="stat-label">KM Radius</span>
            </div>
          </div>
        </div>

        {/*  */}
        <div className="welcome-right animate-fade-right delay-200">
          <div className="welcome-img-wrap">
            <img
              src={gedungSate}
              alt="Gedung Sate, ikon arsitektur Kota Bandung"
              className="welcome-img"
            />

            {/* Leaf ornaments */}
            <img
              src={daunOrnamen}
              alt=""
              className="welcome-leaf-top"
              aria-hidden="true"
            />
            <img
              src={daunOrnamen}
              alt=""
              className="welcome-leaf-bottom"
              aria-hidden="true"
            />

            {/* Location badge overlay */}
            <div
              className="welcome-img-badge glass-dark"
              aria-label="Lokasi: Bandung, Jawa Barat"
            >
              <MapPin
                size={13}
                color="var(--color-accent)"
                aria-hidden="true"
              />
              <span>Bandung, Jawa Barat</span>
            </div>
          </div>
        </div>
      </div>

      {/*  */}
      {showLogin && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogin(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Modal masuk admin"
        >
          <div
            className="login-modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="modal-close"
              onClick={() => setShowLogin(false)}
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="modal-header">
              <div className="modal-icon" aria-hidden="true">
                <Lock size={22} color="var(--color-primary)" />
              </div>
              <h2>Masuk ke Dashboard</h2>
              <p>Gunakan akun admin untuk mengelola sistem</p>
            </div>

            {/* Form */}
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
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} aria-hidden="true" />
                    ) : (
                      <Eye size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {loginError && (
                <p
                  style={{
                    color: "var(--color-error)",
                    fontSize: "var(--text-sm)",
                    marginTop: "-8px",
                  }}
                >
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "var(--space-2)",
                }}
              >
                Masuk
              </button>

              <div style={{ textAlign: "center", marginTop: "var(--space-2)" }}>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-light)",
                  }}
                >
                  atau
                </span>
              </div>

              <button
                type="button"
                className="btn-tamu"
                onClick={() => {
                  setShowLogin(false);
                  navigate("/home");
                }}
              >
                Eksplorasi Sebagai Tamu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
