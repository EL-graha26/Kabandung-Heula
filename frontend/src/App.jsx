import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import Home from "./pages/Home";
import MapPage from "./pages/MapPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;