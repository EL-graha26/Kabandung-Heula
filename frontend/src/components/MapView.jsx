import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";

import { routes } from "../data/routes";

import { useState } from "react";

function MapView() {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className="map-section">
      <div className="map-container">
        <MapContainer
          center={[-6.914744, 107.60981]}
          zoom={12}
          className="map"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routes.map((route) => (
            <Polyline
              key={route.id}
              positions={route.positions}
              pathOptions={{
                color: route.color,
                weight: 7,
              }}
            />
          ))}

          {routes.map((route) =>
            route.positions.map((position, index) => (
              <Marker key={index} position={position}>
                <Popup>{route.name}</Popup>
              </Marker>
            ))
          )}
        </MapContainer>

        {/* FLOAT BUTTON */}

        <button
          className="floating-btn"
          onClick={() => setOpenMenu(!openMenu)}
        >
          ☰
        </button>

        {/* FLOAT PANEL */}

        {openMenu && (
          <div className="floating-panel">
            <div className="panel-header">
              <h3>Pilih Rute</h3>

              <button onClick={() => setOpenMenu(false)}>
                ✕
              </button>
            </div>

            <div className="route-list">
              {routes.map((route) => (
                <div className="route-item" key={route.id}>
                  <div
                    className="route-dot"
                    style={{
                      background: route.color,
                    }}
                  ></div>

                  <p>{route.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapView;