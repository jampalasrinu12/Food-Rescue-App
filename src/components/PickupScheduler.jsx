import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { haversineDistance, getDistanceStatus, formatDistance } from "../utils/distance";
import { UPLOADS_URL } from "../config";

function PickupScheduler({ socket }) {

  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);
  const [trackingDonationId, setTrackingDonationId] = useState(null);

  /* 📍 GET CURRENT LOCATION WITH REAL-TIME TRACKING */
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLat(latitude);
        setCurrentLng(longitude);

        // Send real-time location updates if tracking a donation
        if (trackingDonationId && socket) {
          socket.emit("pickup-location-update", {
            donationId: trackingDonationId,
            lat: latitude,
            lng: longitude,
            pickupUserId: localStorage.getItem("userId")
          });
        }
      },
      () => {
        alert("❌ Location permission denied");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    loadDonations();

    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackingDonationId, socket]);

  /* 🔴 SOCKET.IO LISTENERS FOR REAL-TIME UPDATES */
  useEffect(() => {
    if (!socket) return;

    // Listen for pickup assignments
    const handlePickupAssigned = (data) => {
      if (data.donation_id) {
        loadDonations(); // Refresh to show new assignment
      }
    };

    // Listen for arrival confirmations
    const handleArrivalConfirmed = (data) => {
      if (data.donation_id) {
        loadDonations(); // Refresh to show contact reveal
      }
    };

    socket.on("pickup-assigned", handlePickupAssigned);
    socket.on("arrival-confirmed", handleArrivalConfirmed);

    return () => {
      socket.off("pickup-assigned", handlePickupAssigned);
      socket.off("arrival-confirmed", handleArrivalConfirmed);
    };
  }, [socket]);
  const loadDonations = async () => {
    try {
      const res = await api.get("/donations");
      setDonations(res.data);
    } catch {
      console.log("Failed loading donations");
    }
  };

  const acceptPickup = async (id) => {
    try {
      await api.put(`/donations/${id}/pickup-accept`);
      setTrackingDonationId(id); // Start real-time tracking
      loadDonations();
    } catch {
      alert("Accept failed");
    }
  };

  const arrivedDonor = async (id) => {
    try {
      await api.put(`/donations/${id}/arrived`);
      setTrackingDonationId(null); // Stop tracking

      // Emit arrival confirmation via socket
      if (socket) {
        socket.emit("pickup-arrived", {
          donationId: id,
          pickupUserId: localStorage.getItem("userId"),
          lat: currentLat,
          lng: currentLng
        });
      }

      loadDonations();
    } catch {
      alert("Arrival update failed");
    }
  };

  const pickupFood = async (id) => {
    try {
      await api.put(`/donations/${id}/picked`);

      // Emit pickup completion via socket
      if (socket) {
        socket.emit("pickup-completed", {
          donationId: id,
          pickupUserId: localStorage.getItem("userId")
        });
      }

      loadDonations();
    } catch {
      alert("Pickup failed");
    }
  };

  /* 🗺 GOOGLE NAVIGATION */
 const navigateGoogle = (lat, lng) => {

  if (!lat || !lng) {
    alert("❌ Donor location missing");
    return;
  }

  if (!currentLat || !currentLng) {
    alert("❌ Your location not detected");
    return;
  }

  window.open(
    `https://www.google.com/maps/dir/${currentLat},${currentLng}/${lat},${lng}`,
    "_blank"
  );
};

  /* 📏 DISTANCE CALCULATION USING UTILITIES */

  const getDistance = (lat, lng) => {
    if (!currentLat || !currentLng || !lat || !lng) return null;
    return haversineDistance(currentLat, currentLng, lat, lng);
  };

  /* 🔎 CHECK STATUS */

const getStatus = (d) => {

  const now = new Date();
  const expiry = new Date(d.expiry_time);

  if (expiry < now) return "EXPIRED";

  if (d.status === "donated" || d.pickup_status === "PICKED")
    return "COMPLETED";

  if (
    d.pickup_status === "ASSIGNED" ||
    d.pickup_status === "ACCEPTED" ||
    d.pickup_status === "ARRIVED"
  )
    return "AVAILABLE";

  return "OTHER";
};
  return (

    <div>

      <h2>🚚 Pickup Orders</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: "20px",
          marginTop: "20px"
        }}
      >

        {[...donations]
  .sort((a, b) => {
    const da = getDistance(a.donor_lat, a.donor_lng) || 999;
    const db = getDistance(b.donor_lat, b.donor_lng) || 999;
    return da - db;
  })
  .map((d) => {

          const status = getStatus(d);
if (status === "EXPIRED") return null;
          const distance = getDistance(d.donor_lat, d.donor_lng);

          return (

            <div
              key={d.id}
              style={{
                background: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)"
              }}
            >

              {/* FOOD IMAGE */}
              <img
  src={
    d.food_image
      ? `${UPLOADS_URL}/${d.food_image}`
      : "/no-image.png"
  }
  alt={d.food_name}
  onError={(e) => {
    e.target.src = "/no-image.png";
  }}
  style={{
    width: "100%",
    height: "180px",
    objectFit: "cover"
  }}
/>

              <div style={{ padding: 15 }}>

                <h3>{d.food_name}</h3>

                <p>Qty: {d.quantity}</p>

                <p>Priority: {d.priority}</p>

                <p>
  📍 {d.donor_address
      ? d.donor_address
      : (d.donor_lat && d.donor_lng
          ? `${d.donor_lat.toFixed(4)}, ${d.donor_lng.toFixed(4)}`
          : "Location not available")}
</p>
<p>
  <b>Status:</b>{" "}
  <span style={{
    background:
      status === "EXPIRED" ? "#f44336" :
      status === "COMPLETED" ? "#4caf50" :
      "#ff9800",
    color: "white",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px"
  }}>
    {status}
  </span>
</p>

                {/* 📏 DISTANCE */}
                {distance !== null && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      background: getDistanceStatus(distance).color,
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      {getDistanceStatus(distance).emoji} {formatDistance(distance)}
                    </span>
                    {trackingDonationId === d.id && (
                      <span style={{
                        background: "#4CAF50",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px"
                      }}>
                        📡 Live Tracking
                      </span>
                    )}
                  </div>
                )}

                {/* 🗺 MAP PREVIEW */}

                {d.donor_lat && d.donor_lng ? (
  <iframe
    title="map"
    width="100%"
    height="180"
    style={{ border: 0, marginTop: "10px" }}
    loading="lazy"
    src={`https://maps.google.com/maps?q=${d.donor_lat},${d.donor_lng}&z=15&output=embed`}
  ></iframe>
) : (
  <p style={{ color: "#888", marginTop: "10px" }}>
    📍 Map not available
  </p>
)}

                {/* STATUS */}

{status !== "EXPIRED" && (
  <div style={{ marginTop: 10 }}>

    {d.pickup_status === "ASSIGNED" && (
      <button
        onClick={() => acceptPickup(d.id)}
        style={{
          background: "#ff9800",
          color: "white",
          border: "none",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          marginTop: "5px"
        }}
      >
        ✅ Accept Order
      </button>
    )}

    {d.pickup_status === "ACCEPTED" && (
      <>
        <button
          onClick={() => navigateGoogle(d.donor_lat, d.donor_lng)}
          style={{
            background: "#ff9800",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "5px"
          }}
        >
          🧭 Navigate
        </button>

        <button
          onClick={() => navigate("/pickup-map", {
            state: {
              donationId: d.id,
              lat: d.donor_lat,
              lng: d.donor_lng,
              foodName: d.food_name,
              street: d.donor_address
            }
          })}
          style={{
            background: "#2962ff",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "5px",
            marginLeft: "10px"
          }}
        >
          📍 Live Trace
        </button>

        {typeof distance === "number" && distance <= 0.05 ? ( // 50 meters = 0.05 km
          <button
            onClick={() => arrivedDonor(d.id)}
            style={{
              background: "#4CAF50",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "5px",
              marginLeft: "10px",
              fontWeight: "bold"
            }}
          >
            📍 Arrived at Donor
          </button>
        ) : (
          <p style={{
            color: distance !== null && distance <= 0.1 ? "#FF9800" : "#f44336",
            marginTop: "5px",
            fontSize: "12px",
            marginLeft: "10px"
          }}>
            {distance !== null
              ? `⛔ ${formatDistance(distance)} to arrival (need ≤ 50m)`
              : "⛔ Distance unknown - enable location"
            }
          </p>
        )}
      </>
    )}

    {d.pickup_status === "ARRIVED" && (
      <>
        <div style={{
          background:"#e3f2fd",
          padding:"10px",
          borderRadius:"8px",
          marginTop:"10px"
        }}>
          <p><b>👤 Donor Contact</b></p>
          <p>📞 {d.donor_phone || "Not Available"}</p>
        </div>

        {d.donor_phone && (
          <a href={`tel:${d.donor_phone}`}>
            <button style={{
              background:"#4caf50",
              color:"white",
              border:"none",
              padding:"8px 12px",
              borderRadius:"6px",
              cursor:"pointer",
              marginTop:"5px"
            }}>
              📞 Call Donor
            </button>
          </a>
        )}

        <button
          onClick={() => pickupFood(d.id)}
          style={{
            background:"#ff9800",
            color:"white",
            border:"none",
            padding:"8px 12px",
            borderRadius:"6px",
            cursor:"pointer",
            marginTop:"5px"
          }}
        >
          🚚 Pickup Food
        </button>
      </>
    )}

    {status === "COMPLETED" && (
      <span style={{
        background: "#4caf50",
        color: "white",
        padding: "6px 10px",
        borderRadius: "6px"
      }}>
        ✅ Completed
      </span>
    )}

  </div>
)}

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );
}

export default PickupScheduler;