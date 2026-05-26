import { useNavigate } from "react-router-dom";
import { 
  MapIcon, 
  BusFront, 
  Navigation, 
  Info,
  Clock,
  Ticket,
  ChevronRight,
  ShieldAlert,
  Activity,
  CloudLightning
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* =========================================================
         FLOATING NAVBAR (APPLE / VERCEL STYLE)
      ========================================================= */}
      <div className="navbar-wrapper">
        <nav className="navbar">
          <div className="logo">
            <div className="logo-glow"></div>
            <h2>Kabandung Heula</h2>
          </div>
          <div className="nav-links">
            <a href="#hero">Beranda</a>
            <a href="#produk">Transportasi</a>
            <a href="#wisata">Wisata</a>
            <a href="#kontak">Kontak</a>
          </div>
          <button className="nav-cta" onClick={() => navigate("/map")}>
            Open Map
          </button>
        </nav>
      </div>

      {/* =========================================================
         HERO SECTION (CINEMATIC HUD)
      ========================================================= */}
      <section id="hero" className="hero-section">
        {/* Menggunakan Video/GIF atau Gambar Statis Kualitas Tinggi untuk Hero */}
        <img 
          src="https://images.unsplash.com/photo-1549473889-14f410d83298?q=80&w=2070&auto=format&fit=crop" 
          alt="Bandung City Night" 
          className="hero-bg"
        />
        <div className="hero-overlay"></div>
        
        <div className="hero-grid">
          {/* Left: Typography */}
          <div className="hero-text animate-fade-up">
            <h1><span className="text-gradient">Smart City</span><br/>Bandung Hub</h1>
            <p>
              Eksplorasi mobilitas urban dan destinasi pariwisata Kota Bandung melalui platform WebGIS interaktif kelas premium. 
              Navigasi cerdas di ujung jari Anda.
            </p>
            <button className="btn-primary" onClick={() => navigate("/map")}>
              <MapIcon size={20} />
              Buka Peta Interaktif
            </button>
          </div>

          {/* Right: Floating Smart HUDs */}
          <div className="hero-hud">
            <div className="hud-card animate-float">
              <div className="hud-icon cyan"><Activity size={24} /></div>
              <div className="hud-info">
                <h4>Status Jaringan</h4>
                <p>Optimal</p>
              </div>
            </div>

            <div className="hud-card animate-float" style={{ animationDelay: '1s' }}>
              <div className="hud-icon emerald"><BusFront size={24} /></div>
              <div className="hud-info">
                <h4>Total Rute Aktif</h4>
                <p>38 Jalur</p>
              </div>
            </div>

            <div className="hud-card animate-float" style={{ animationDelay: '2s' }}>
              <div className="hud-icon amber"><CloudLightning size={24} /></div>
              <div className="hud-info">
                <h4>Cuaca Saat Ini</h4>
                <p>24°C Cerah</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
         PRODUK / TRANSPORTASI (CAROUSEL)
      ========================================================= */}
      <section id="produk" className="section-container">
        <div className="section-header animate-fade-up">
          <h2>Armada Transportasi</h2>
          <p>Pilihan mobilitas urban cerdas untuk perjalanan Anda di Kota Bandung.</p>
        </div>
        
        <div className="transport-carousel animate-fade-up">
          {/* BANDROS */}
          <div className="transport-card glass-card">
            <div className="tc-img-wrap">
              <img src="https://asset.kompas.com/crops/5gLdD9j4W6v-d8r_z4s-N2aE9t4=/0x0:739x493/750x500/data/photo/2020/07/21/5f16c72834b6b.jpg" alt="Bandros"/>
              <div className="tc-badge bus">Wisata</div>
            </div>
            <div className="tc-info" style={{padding: '0 20px 20px'}}>
              <h3>Bandung Tour on Bus</h3>
              <p className="text-muted" style={{fontSize: '14px', lineHeight: '1.5'}}>Cara asik keliling tempat ikonik di Bandung dengan bus wisata tematik.</p>
              <div className="tc-meta">
                <span><Clock size={14} color="#06b6d4"/> 08:00 - 16:00</span>
                <span><Ticket size={14} color="#06b6d4"/> Rp 20.000</span>
              </div>
            </div>
          </div>

          {/* TRANS METRO */}
          <div className="transport-card glass-card">
            <div className="tc-img-wrap">
              <img src="https://asset.kompas.com/crops/aQk2L9l6B-a-O3m8G1n6H_6VbM4=/0x0:1000x667/750x500/data/photo/2023/12/21/6584284534f3b.jpg" alt="TMB"/>
              <div className="tc-badge brt">BRT</div>
            </div>
            <div className="tc-info" style={{padding: '0 20px 20px'}}>
              <h3>Trans Metro Bandung</h3>
              <p className="text-muted" style={{fontSize: '14px', lineHeight: '1.5'}}>Bus Rapid Transit aman dan nyaman dengan rute melintasi jalan utama.</p>
              <div className="tc-meta">
                <span><Clock size={14} color="#10b981"/> 05:00 - 19:00</span>
                <span><Ticket size={14} color="#10b981"/> Rp 4.000</span>
              </div>
            </div>
          </div>

          {/* ANGKOT */}
          <div className="transport-card glass-card">
            <div className="tc-img-wrap">
              <img src="https://asset.kompas.com/crops/t3R4w8y0v5c_R0z_g6Y5x4_V4_8=/0x0:1000x667/750x500/data/photo/2020/02/10/5e4125b290b29.jpg" alt="Angkot"/>
              <div className="tc-badge angkot">Reguler</div>
            </div>
            <div className="tc-info" style={{padding: '0 20px 20px'}}>
              <h3>Angkutan Kota</h3>
              <p className="text-muted" style={{fontSize: '14px', lineHeight: '1.5'}}>Transportasi publik legendaris yang menjangkau seluruh pelosok wilayah.</p>
              <div className="tc-meta">
                <span><Clock size={14} color="#f59e0b"/> 24 Jam</span>
                <span><Ticket size={14} color="#f59e0b"/> Rp 3.000 - 5.000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
         WISATA SECTION (LARGE CARDS)
      ========================================================= */}
      <section id="wisata" className="section-container" style={{paddingTop: '20px'}}>
        <div className="section-header animate-fade-up">
          <h2>Destinasi Unggulan</h2>
          <p>Jelajahi landmark bersejarah yang terintegrasi dengan node transportasi cerdas.</p>
        </div>

        <div className="wisata-grid animate-fade-up">
          <div className="wisata-card">
            <img src="https://images.unsplash.com/photo-1626083049186-bce7782bcf2f?q=80&w=2070&auto=format&fit=crop" alt="Gedung Sate"/>
            <div className="wisata-overlay">
              <h3>Gedung Sate</h3>
              <p>Pusat pemerintahan Jawa Barat dengan arsitektur ikonis yang wajib dikunjungi.</p>
            </div>
          </div>

          <div className="wisata-card">
            <img src="https://images.unsplash.com/photo-1582650809292-b43e8bb4355a?q=80&w=2070&auto=format&fit=crop" alt="Jalan Braga"/>
            <div className="wisata-overlay">
              <h3>Jalan Braga</h3>
              <p>Lorong waktu menuju masa lalu dengan nuansa arsitektur Eropa klasik di jantung kota.</p>
            </div>
          </div>
          
          <div className="wisata-card" style={{gridColumn: '1 / -1', height: '300px'}}>
            <img src="https://images.unsplash.com/photo-1522199710521-72d69614c71c?q=80&w=2072&auto=format&fit=crop" alt="Alun-Alun"/>
            <div className="wisata-overlay">
              <h3>Alun-Alun & Masjid Raya</h3>
              <p>Ruang publik cerdas dan pusat keramaian terbesar warga Bandung.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
         FOOTER / KONTAK (PREMIUM SMART CITY)
      ========================================================= */}
      <footer id="kontak" className="footer-section">
        <div className="footer-content">
          <div className="footer-brand">
            <h2>
              <div className="logo-glow"></div>
              Kabandung Heula
            </h2>
            <p>
              Platform WebGIS Smart City Bandung. Sebuah inovasi dalam pemetaan 
              transportasi urban dan pariwisata terintegrasi.
            </p>
          </div>
          
          <div className="footer-team">
            <h3>Tim Pengembang Core</h3>
            <ul>
              <li><ShieldAlert size={16}/> <span>Muhammad Piela Nugraha</span> (123140200)</li>
              <li><ShieldAlert size={16}/> <span>Reihan Oktavian</span> (123140202)</li>
              <li><ShieldAlert size={16}/> <span>Firman Hgulthom</span> (123140171)</li>
            </ul>
            <p style={{color: '#64748b', fontSize: '13px', marginTop: '16px'}}>
              Institut Teknologi Sumatera<br/>
              Teknik Informatika - Sistem Informasi Geografis
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Kabandung Heula. GIS Engineering Division. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}