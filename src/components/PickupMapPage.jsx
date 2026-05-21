
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";
import L from "leaflet";
import socket from "../socket";
import "leaflet/dist/leaflet.css";

// ✅ Fix marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

// 🔄 Auto recenter
function Recenter({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  return null;
}

function PickupMapPage() {

  const location = useLocation();
  const { lat, lng, foodName, street, donationId } = location.state || {};
  const role = sessionStorage.getItem("role");

  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    if (!donationId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join", {
      role: role || "pickup"
    });

    socket.emit("joinDonation", {
      donationId
    });

    const handlePickupLocation = (data) => {
      if (data.donationId !== donationId) return;
      if (role !== "pickup") {
        setCurrentLat(data.lat);
        setCurrentLng(data.lng);
      }
    };

    socket.on("pickup-location", handlePickupLocation);

    return () => {
      socket.off("pickup-location", handlePickupLocation);
    };
  }, [donationId, role]);

  // 📍 LIVE TRACKING
  useEffect(() => {
    if (role !== "pickup") return;

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {

        const clat = pos.coords.latitude;
        const clng = pos.coords.longitude;

        // 🔥 Smooth movement
        setCurrentLat(prev => prev ? prev + (clat - prev) * 0.3 : clat);
        setCurrentLng(prev => prev ? prev + (clng - prev) * 0.3 : clng);

        if (role === "pickup" && donationId) {
          socket.emit("pickup-location", {
            donationId,
            lat: clat,
            lng: clng
          });
        }

        // 📏 Distance calculation
        const R = 6371;
        const dLat = (lat - clat) * Math.PI / 180;
        const dLng = (lng - clng) * Math.PI / 180;

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(clat * Math.PI / 180) *
          Math.cos(lat * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distKm = R * c;
        const distMeters = distKm * 1000;

        setDistance(distKm.toFixed(2));

        // ⏱ ETA (avg speed 30km/h)
        const speed = 30;
        const time = (distKm / speed) * 60;
        setEta(time.toFixed(1));

        // 🎯 AUTO ARRIVAL ALERT
        if (distMeters <= 50) {
          console.log("Reached location");
        }

      },
      () => {
        alert("❌ Location permission denied");
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);

  }, [lat, lng, donationId, role]);

const [lastFetch, setLastFetch] = useState(0);
useEffect(() => {

  if (!currentLat || !currentLng) return;

  const now = Date.now();

  // 🔥 Only fetch every 5 seconds
  if (now - lastFetch < 5000) return;

  setLastFetch(now);

  const fetchRoute = async () => {
    try {

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${lng},${lat}?overview=full&geometries=geojson`
      );

      const data = await res.json();

      if (!data.routes || data.routes.length === 0) return;

      const coords = data.routes[0].geometry.coordinates;

      const latLngs = coords.map(c => [c[1], c[0]]);

      setRouteCoords(latLngs);

    } catch (err) {
      console.error("Route error", err);
    }
  };

  fetchRoute();

}, [currentLat, currentLng, lat, lng, lastFetch]);

  if (!donationId || !lat || !lng) {
    return <h2>❌ Live tracking requires a selected donation and donor location.</h2>;
  }

  // 🚗 Google navigation
  const openGoogleMaps = () => {
    if (!currentLat || !currentLng) {
      alert("Current location not detected");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <div style={{
      maxWidth: "1000px",
      margin: "20px auto"
    }}>

      <h2>🚚 Live Pickup Tracking</h2>

      <p><b>🍱 Food:</b> {foodName || "Donation"}</p>
      <p><b>📍 Street:</b> {street || "Not Provided"}</p>

      {/* 📊 INFO PANEL */}
      <div style={{
        background:"#f5f5f5",
        padding:"10px",
        borderRadius:"10px",
        marginTop:"10px"
      }}>
        {distance && <p>📏 Distance: <b>{distance} km</b></p>}
        {eta && <p>⏱ ETA: <b>{eta} mins</b></p>}
        {!currentLat && !currentLng && role !== "pickup" && (
          <p style={{ color: "#555", marginTop: "8px" }}>
            ⏳ Waiting for pickup team live location...
          </p>
        )}
      </div>

      {/* 🗺 MAP */}
      <div style={{
        height: "450px",
        borderRadius: "18px",
        overflow: "hidden",
        marginTop: "15px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}>
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >

          <Recenter lat={currentLat || lat} lng={currentLng || lng} />

          <TileLayer
  attribution="© CARTO"
  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
  detectRetina={true}
/>

          {/* 🎯 Donor */}
          <Marker position={[lat, lng]}>
            <Popup>
              🍱 {foodName}
              <br />
              📍 {street}
            </Popup>
          </Marker>

          {/* 🚗 YOU */}
          {currentLat && currentLng && (
            <Marker position={[currentLat, currentLng]}>
              <Popup>🚗 You (Live)</Popup>
            </Marker>
          )}

      {/* 🔵 ROUTE */}
{routeCoords.length > 0 && (
  <Polyline
    key={routeCoords.length}
    positions={routeCoords}
    pathOptions={{
      color: "#2962ff",
      weight: 6,
      opacity: 0.9
    }}
  />
)}


        </MapContainer>
      </div>



      {/* BUTTON */}
     <button
  onClick={openGoogleMaps}
  style={{
    marginTop: "20px",
    padding: "15px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg,#2962ff,#0039cb)",
    color: "white",
    cursor: "pointer",
    width: "100%",
    fontSize: "18px",
    fontWeight: "700",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
  }}
>
  ▶ START NAVIGATION
</button>

      {/* LOCATION */}
      {currentLat && currentLng && (
        <p style={{ marginTop: "10px", fontSize: "13px", color:"#555" }}>
          📍 You: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
        </p>
      )}

    </div>
  );
}

export default PickupMapPage;