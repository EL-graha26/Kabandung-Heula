import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

export default function FloatingMenu() {
  const [open, setOpen] = useState(true);

  const routes = ["DAMRI", "BANDROS", "TRANS METRO BANDUNG"];

  return (
    <>
      {/* OPEN BUTTON */}

      {!open && (
        <button className="open-menu-btn" onClick={() => setOpen(true)}>
          <Menu size={30} />
        </button>
      )}

      {/* PANEL */}

      <div className={`transport-sidebar ${open ? "show" : ""}`}>
        {/* CLOSE BUTTON */}

        <button className="close-btn" onClick={() => setOpen(false)}>
          <X size={28} />
        </button>

        {/* HEADER */}

        <div className="sidebar-header">
          <h2>Pilih Rute</h2>
        </div>

        {/* HALTE */}

        <div className="halte-card">
          <div className="halte-top">
            <div className="toggle-switch"></div>

            <p>Tampilkan Halte Bus</p>
          </div>

          <span>Klik halte untuk melihat rute</span>
        </div>

        {/* ROUTES */}

        <div className="sidebar-routes">
          {routes.map((route, index) => (
            <div className="sidebar-route-card" key={index}>
              <p>{route}</p>

              <ChevronDown size={26} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
