import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="logo">
          <h2>Kabandung-Heula</h2>
        </div>

        <div className="nav-links">
          <a href="#">Tentang Kami</a>
          <a href="#">Blog</a>
          <a href="#">Partisipasi</a>

          <button
            className="map-button"
            onClick={() => navigate("/map")}
          >
            Peta dan Panduan
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="overlay"></div>

        <div className="hero-content">
          <h1>
            Bergerak bersama mewujudkan transportasi umum
            Bandung Raya yang lebih baik
          </h1>

          <p>
            Platform GIS transportasi umum Kota Bandung
          </p>
        </div>
      </section>
    </div>
  );
}