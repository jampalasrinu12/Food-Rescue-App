import { MapContainer, TileLayer, Marker } from "react-leaflet";

function MapPreview({ lat, lng }) {
  return (
    <MapContainer center={[lat, lng]} zoom={14} style={{ height: 250 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} />
    </MapContainer>
  );
}

export default MapPreview;
