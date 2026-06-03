import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Menu, X, ChevronRight } from "lucide-react";

/* -----------------------------------------------------------
   Navbar — Floating Glass Pill, Scroll-Aware
   Transparent on top → white glass on scroll
----------------------------------------------------------- */
export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const navRef = useRef(null);

  /* Scroll listener — switches glass style at 40px */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close mobile menu on outside click */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMenuOpen(false);
  }, []);

  /* Intersection Observer — highlight active section */
  useEffect(() => {
    const sections = ["hero", "transportasi", "wisata", "peta", "tentang"];
    const observers = sections
      .map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) setActiveLink(id);
          },
          { threshold: 0.4 },
        );
        obs.observe(el);
        return obs;
      })
      .filter(Boolean);

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const navLinks = [
    { label: "Beranda", href: "#hero" },
    { label: "Transportasi", href: "#transportasi" },
    { label: "Wisata", href: "#wisata" },
    { label: "Peta Interaktif", href: "#peta" },
    { label: "Tentang", href: "#tentang" },
  ];

  const handleNav = (href) => {
    setMenuOpen(false);
    if (href.startsWith("#")) {
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <header
      ref={navRef}
      className={`kh-navbar-wrapper${scrolled ? " kh-navbar--scrolled" : ""}`}
      role="banner"
    >
      <nav className="kh-navbar" aria-label="Navigasi utama">
        {/* ── Logo ── */}
        <button
          className="kh-nav-logo"
          onClick={() => navigate("/home")}
          aria-label="Kembali ke beranda Kabandung Heula"
        >
          <div className="kh-nav-logo-icon" aria-hidden="true">
            {/* Leaf/shield icon */}
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path
                d="M12 2.5C9 4.5 4.5 6 4.5 11C4.5 15.5 7.5 19.5 12 21.5C16.5 19.5 19.5 15.5 19.5 11C19.5 6 15 4.5 12 2.5Z"
                fill="currentColor"
                opacity="0.15"
              />
              <path
                d="M12 2.5C9 4.5 4.5 6 4.5 11C4.5 15.5 7.5 19.5 12 21.5C16.5 19.5 19.5 15.5 19.5 11C19.5 6 15 4.5 12 2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="12" cy="11.5" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="kh-nav-logo-text">
            <span className="kh-nav-logo-name">Kabandung Heula</span>
            <span className="kh-nav-logo-sub">
              Smart Mobility &amp; Tourism
            </span>
          </div>
        </button>

        {/* ── Desktop links ── */}
        <div className="kh-nav-links" role="list">
          {navLinks.map(({ label, href }) => {
            const sectionId = href.slice(1);
            const isActive = activeLink === sectionId;
            return (
              <button
                key={label}
                className={`kh-nav-link${isActive ? " kh-nav-link--active" : ""}`}
                onClick={() => handleNav(href)}
                role="listitem"
                aria-current={isActive ? "page" : undefined}
              >
                {label}
                {isActive && (
                  <span className="kh-nav-link-dot" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Actions ── */}
        <div className="kh-nav-actions">
          <button
            id="nav-open-map"
            className="kh-nav-cta"
            onClick={() => navigate("/map")}
            aria-label="Buka peta interaktif Bandung"
          >
            Buka Peta
            <ChevronRight size={15} aria-hidden="true" />
          </button>

          {/* Mobile hamburger */}
          <button
            className="kh-nav-hamburger btn-icon"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="kh-nav-mobile animate-fade-down" role="menu">
          {navLinks.map(({ label, href }) => (
            <button
              key={label}
              className="kh-nav-mobile-link"
              onClick={() => handleNav(href)}
              role="menuitem"
            >
              {label}
            </button>
          ))}
          <div className="kh-nav-mobile-cta">
            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                setMenuOpen(false);
                navigate("/map");
              }}
            >
              Buka Peta Interaktif
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
