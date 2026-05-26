import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import "./Splash.css";

export default function Splash() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setShowLogin(false);
    alert("Login berhasil (Simulasi)");
  };

  return (
    <div className="splash-container">
      {/* Floating Lights */}
      <div className="splash-glow-1"></div>
      <div className="splash-glow-2"></div>
      
      {/* Tugu Kujang Silhouettes */}
      <div className="tugu-left">
        <svg viewBox="0 0 100 200" className="tugu-svg" fill="rgba(6, 182, 212, 0.4)">
          <path d="M50 0 L60 30 L60 100 L70 120 L70 180 L30 180 L30 120 L40 100 L40 30 Z" />
          <path d="M20 70 Q 50 20 80 70 Q 60 110 50 150 Q 40 110 20 70 Z" fill="rgba(255,255,255,0.2)"/>
        </svg>
      </div>
      
      <div className="tugu-right">
        <svg viewBox="0 0 100 200" className="tugu-svg" fill="rgba(6, 182, 212, 0.4)">
          <path d="M50 0 L60 30 L60 100 L70 120 L70 180 L30 180 L30 120 L40 100 L40 30 Z" />
          <path d="M20 70 Q 50 20 80 70 Q 60 110 50 150 Q 40 110 20 70 Z" fill="rgba(255,255,255,0.2)"/>
        </svg>
      </div>

      <div className="splash-glass-card animate-fade-up">
        <h1 className="splash-title">Kabandung Heula</h1>
        <p className="splash-subtitle">Smart City Bandung</p>
        
        <div className="splash-buttons">
          <button className="btn-mulai" onClick={() => navigate("/home")}>
            Mulai Eksplorasi <ArrowRight size={18} />
          </button>
          <button className="btn-masuk" onClick={() => setShowLogin(true)}>
            <Lock size={16} /> Admin
          </button>
        </div>
      </div>

      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowLogin(false)}>✕</button>
            <h2>Admin Gateway</h2>
            <form onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label>Username</label>
                <input type="text" placeholder="ID Admin" required />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" placeholder="Passcode" required />
              </div>
              <button type="submit" className="btn-submit">Secure Login</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
