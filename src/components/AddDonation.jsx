import { useEffect, useState } from "react";
import api from "../api";

function AddDonation() {
  const [form, setForm] = useState({
    food_name: "",
    quantity: "",
    prepared_time: "",
    expiry_time: "",
    donor_lat: null,
    donor_lng: null,
    food_image: null,
    street: "",
    phone: ""
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [uploading, setUploading] = useState(false);

  /* 📍 AUTO LOCATION + ADDRESS */
  useEffect(() => {
    if (!navigator.geolocation) {
      setMessage("❌ Geolocation not supported");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setForm((prev) => ({
          ...prev,
          donor_lat: lat,
          donor_lng: lng
        }));

        // 🔥 AUTO ADDRESS
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();

          setForm(prev => ({
            ...prev,
            street: data.address?.road || prev.street
          }));
        } catch (err) {
          console.log("Address fetch error");
        }

        setLoadingLocation(false);
      },
      () => {
        setMessage("❌ Location permission denied");
        setLoadingLocation(false);
      }
    );
  }, []);

  /* 👤 LOAD PROFILE DATA */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/profile", {
          headers: {
            Authorization: "Bearer " + sessionStorage.getItem("token")
          }
        });

        if (res.data) {
          setForm(prev => ({
            ...prev,
            street: res.data.street || "",
            phone: res.data.phone || ""
          }));
        }
      } catch (err) {
        console.log("Profile load failed", err);
      }
    };

    loadProfile();
  }, []);

  /* 🔹 INPUT CHANGE */
  const handleChange = (e) => {
    setMessage("");
    setAiResult(null);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* 🖼 IMAGE PREVIEW + STORE FILE */
  const handleImage = (e) => {
    setMessage("");
    setAiResult(null);

    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage("❌ Image too large (max 2MB)");
      return;
    }

    setPreview(URL.createObjectURL(file));

    setForm((prev) => ({
      ...prev,
      food_image: file
    }));
  };

  /* 🔹 FORMAT DATETIME */
  const formatDateTime = (dt) => {
    if (!dt) return null;
    return dt.replace("T", " ") + ":00";
  };

  /* 🚀 SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setAiResult(null);

    if (!form.food_name || !form.quantity || !form.expiry_time) {
      setMessage("❌ Required fields missing");
      return;
    }

    if (!form.donor_lat || !form.donor_lng) {
      setMessage("❌ Location not ready");
      return;
    }

    try {
      setUploading(true);

      let aiData = null;

      if (form.food_image) {
        /* 🔹 1️⃣ AI */
        const aiForm = new FormData();
        aiForm.append("image", form.food_image);
        aiForm.append("food_name", form.food_name);
        aiForm.append("prepared_time", form.prepared_time);

        const aiRes = await api.post("/ai/analyze", aiForm, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        aiData = aiRes.data;

        if (aiData.status !== "success") {
          setMessage("❌ AI analysis failed");
          return;
        }

        setAiResult(aiData);
      }

      /* 🔹 2️⃣ SAVE */
      const formData = new FormData();

      formData.append("food_name", form.food_name);
      formData.append("quantity", form.quantity);
      formData.append("prepared_time", formatDateTime(form.prepared_time));
      formData.append("expiry_time", formatDateTime(form.expiry_time));
      formData.append("donor_lat", form.donor_lat);
      formData.append("donor_lng", form.donor_lng);
      formData.append("donor_address", form.street);
      formData.append("phone", form.phone);
      if (form.food_image) {
        formData.append("food_image", form.food_image);
      }

      await api.post("/donations", formData, {
        headers: {
          Authorization: "Bearer " + sessionStorage.getItem("token")
        }
      });

      setMessage("✅ Donation submitted successfully");

      setForm({
        ...form,
        food_name: "",
        quantity: "",
        prepared_time: "",
        expiry_time: "",
        food_image: null
      });

      setPreview(null);

    } catch (err) {
      console.error(err);
      setMessage("❌ Submission failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: 500, margin: "auto" }}>
      <h2 style={{ textAlign: "center" }}>🍱 Donate Food</h2>

      {/* LOCATION */}
      <div style={{
        background: "#f5f5f5",
        padding: 10,
        borderRadius: 10,
        marginBottom: 10
      }}>
        {loadingLocation ? (
          <p>📍 Detecting location...</p>
        ) : (
          <p style={{ color: "green" }}>📍 Location ready</p>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input name="food_name" placeholder="Food name" value={form.food_name} onChange={handleChange} />
        <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
        <input name="street" placeholder="Pickup address" value={form.street} onChange={handleChange} />
        <input name="phone" placeholder="Contact Number" value={form.phone} onChange={handleChange} />

        <label>Prepared Time</label>
        <input type="datetime-local" name="prepared_time" value={form.prepared_time} onChange={handleChange} />

        <label>Expiry Time</label>
        <input type="datetime-local" name="expiry_time" value={form.expiry_time} onChange={handleChange} />

        <input type="file" accept="image/*" onChange={handleImage} />

        {preview && (
          <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 12 }} />
        )}

        <button
          disabled={uploading || loadingLocation}
          style={{
            padding: 12,
            background: "#ff5722",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: "bold"
          }}
        >
          {uploading ? "⏳ Processing..." : "🚀 Submit Donation"}
        </button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      {aiResult && (
        <div style={{
          marginTop: 20,
          background: "#fff",
          padding: 15,
          borderRadius: 10,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}>
          <h3>🧠 AI Analysis</h3>
          <p>🥗 Freshness: <b>{aiResult.freshness}</b></p>
          <p>📦 Recommendation: <b>{aiResult.recommendation}</b></p>
          <p>📍 Distance: <b>{aiResult.distance_km} km</b></p>
          <p>⚡ Priority: <b>{aiResult.pickup_priority}</b></p>
        </div>
      )}
    </div>
  );
}

export default AddDonation;