import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Menu, X, ChevronRight, MapPin } from "lucide-react";

// Navbar
export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      
      // Auto-select footer if scrolled to bottom
      if (window.innerHeight + Math.round(window.scrollY) >= document.body.offsetHeight - 50) {
        setActiveLink("footer");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  useEffect(() => {
    setMenuOpen(false);
  }, []);


  useEffect(() => {
    const sections = ["hero", "map-preview", "transportasi", "wisata", "footer"];
    const observers = sections
      .map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) setActiveLink(id);
          },
          { rootMargin: "-30% 0px -60% 0px" }
        );
        obs.observe(el);
        return obs;
      })
      .filter(Boolean);

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const navLinks = [
    { label: "Beranda", href: "#hero" },
    { label: "Peta Interaktif", href: "#map-preview" },
    { label: "Transportasi", href: "#transportasi" },
    { label: "Wisata", href: "#wisata" },
    { label: "Kontak", href: "#footer" },
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
            <MapPin size={20} strokeWidth={2.5} />
          </div>
          <div className="kh-nav-logo-text">
            <span className="kh-nav-logo-name">Kabandung Heula</span>
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
