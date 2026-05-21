import { useState, useEffect } from "react";
import api from "../api";

function Profile() {

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    house: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    lat: null,
    lng: null
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 LOAD PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile", {
          headers: {
            Authorization: "Bearer " + sessionStorage.getItem("token")
          }
        });

        if (res.data) {
          setProfile(prev => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.log("❌ Profile load error:", err);
      }
    };

    fetchProfile();
    getLocation(); // 🔥 auto location
  }, []);

  // 🔥 AUTO LOCATION + ADDRESS
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Location not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setProfile(prev => ({ ...prev, lat, lng }));

        // 🔥 Reverse geocoding (auto address)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();

          setProfile(prev => ({
            ...prev,
            street: data.address?.road || "",
            city: data.address?.city || data.address?.town || "",
            state: data.address?.state || "",
            pincode: data.address?.postcode || ""
          }));

        } catch (err) {
          console.log("Address fetch error:", err);
        }
      },
      () => {
        alert("📍 Please allow location access");
      }
    );
  };

  // 🔹 SAVE PROFILE
  const saveProfile = async () => {
    if (!profile.name || !profile.phone || !profile.city) {
      setMessage("❌ Name, Phone & City required");
      return;
    }

    if (!/^[0-9]{10}$/.test(profile.phone)) {
      setMessage("❌ Invalid phone number");
      return;
    }

    setLoading(true);

    try {
      await api.post("/profile", profile, {
        headers: {
          Authorization: "Bearer " + sessionStorage.getItem("token")
        }
      });

      setMessage("✅ Profile saved successfully");
    } catch (err) {
      console.log("❌ Save error:", err);
      setMessage("❌ Error saving profile");
    }

    setLoading(false);
  };

  return (
    <div className="form-card">
      <h2>👤 Profile</h2>

      <input
        placeholder="Name"
        value={profile.name}
        onChange={(e) =>
          setProfile({ ...profile, name: e.target.value })
        }
      />

      <input
        placeholder="Phone Number"
        value={profile.phone}
        onChange={(e) =>
          setProfile({ ...profile, phone: e.target.value })
        }
      />

      <h3>📍 Address Details</h3>

      <input
        placeholder="House / Flat No"
        value={profile.house}
        onChange={(e) =>
          setProfile({ ...profile, house: e.target.value })
        }
      />

      <input
        placeholder="Street / Area"
        value={profile.street}
        onChange={(e) =>
          setProfile({ ...profile, street: e.target.value })
        }
      />

      <input
        placeholder="Landmark"
        value={profile.landmark}
        onChange={(e) =>
          setProfile({ ...profile, landmark: e.target.value })
        }
      />

      <input
        placeholder="City"
        value={profile.city}
        onChange={(e) =>
          setProfile({ ...profile, city: e.target.value })
        }
      />

      <input
        placeholder="State"
        value={profile.state}
        onChange={(e) =>
          setProfile({ ...profile, state: e.target.value })
        }
      />

      <input
        placeholder="Pincode"
        value={profile.pincode}
        onChange={(e) =>
          setProfile({ ...profile, pincode: e.target.value })
        }
      />

      {/* 🔥 Location Status */}
      {profile.lat && (
        <p style={{ color: "green" }}>📍 Location detected automatically</p>
      )}

      <button onClick={saveProfile} disabled={loading}>
        {loading ? "Saving..." : "Save Profile"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Profile;