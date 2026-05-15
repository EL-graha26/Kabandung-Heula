import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  // Coordinates for a starting point
  const position = [-6.9024, 107.6186]; 

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {/* This is where your Halte and Wisata layers will go later */}
        <Marker position={position}>
          <Popup>Halo! Ini titik awal SIG kamu.</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default App;