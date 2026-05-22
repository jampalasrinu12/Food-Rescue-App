import { useState } from "react";
import api from "../api";

function AIFoodScanner() {

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [foodName, setFoodName] = useState("");
  const [preparedTime, setPreparedTime] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🎨 Color
  const getColor = (status) => {
    if (status === "Fresh") return "#2e7d32";
    if (status === "Semi-Fresh") return "#f9a825";
    return "#c62828";
  };

  // 📤 Upload
  const handleUpload = async () => {

    if (!image) return setError("⚠ Please upload food image");
    if (!foodName) return setError("⚠ Enter food name");
    if (!preparedTime) return setError("⚠ Select prepared time");

    setError("");
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("food_name", foodName);
    formData.append("prepared_time", preparedTime);

    try {
      const res = await api.post("/ai/analyze", formData);
      setResult(res.data);

    } catch (err) {
      console.error(err);
      setError("❌ AI Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 RESET
  const resetForm = () => {
    setImage(null);
    setPreview(null);
    setFoodName("");
    setPreparedTime("");
    setResult(null);
    setError("");
  };

  return (
    <div style={{
      background: "#fff",
      padding: "25px",
      borderRadius: "15px",
      maxWidth: "600px",
      margin: "20px auto",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
    }}>

      <h2>🧠 AI Food Freshness Scanner</h2>

      {/* ERROR */}
      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
      )}

      {/* INPUTS */}
      <input
        type="text"
        placeholder="🍱 Food name"
        value={foodName}
        onChange={(e) => setFoodName(e.target.value)}
        style={{ width: "100%", padding: "10px", borderRadius: "8px", marginTop: "10px" }}
      />

      <input
        type="datetime-local"
        value={preparedTime}
        onChange={(e) => setPreparedTime(e.target.value)}
        style={{ width: "100%", padding: "10px", borderRadius: "8px", marginTop: "10px" }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          setImage(file);
          setPreview(URL.createObjectURL(file));
        }}
        style={{ marginTop: "10px" }}
      />

      {/* PREVIEW */}
      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{
            width: "100%",
            marginTop: "10px",
            borderRadius: "10px"
          }}
        />
      )}

      {/* BUTTONS */}
      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>

        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px",
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          {loading ? "🔍 Analyzing..." : "Analyze"}
        </button>

        <button
          onClick={resetForm}
          style={{
            flex: 1,
            padding: "12px",
            background: "#9e9e9e",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          Reset
        </button>

      </div>

      {/* RESULT */}
      {result && (
        <div style={{
          marginTop: "25px",
          padding: "20px",
          borderRadius: "12px",
          background: "#f9f9f9"
        }}>

          <h3>📊 Result</h3>

          <div style={{
            background: getColor(result.final_freshness || result.freshness),
            color: "white",
            padding: "8px 15px",
            borderRadius: "20px",
            display: "inline-block"
          }}>
            {result.final_freshness || result.freshness || "Unknown"}
          </div>

          <p><b>Food:</b> {result.food_item || foodName}</p>
          <p><b>Time Passed:</b> {result.time_passed_hours || result.hours_since_prepared || "N/A"} hrs</p>
          <p><b>Recommendation:</b> {result.expiry_status || result.ai_note || "N/A"}</p>

          <hr />

          <p><b>AI Detected:</b> {result.ai_prediction?.hf_label || result.hf_label || "-"}</p>
          <p><b>Confidence:</b> {result.ai_prediction?.hf_confidence || result.hf_confidence || "-"}%</p>

          {result.processed_image && (
            <img
              src={`http://localhost:8000/${result.processed_image}`}
              alt="processed"
              style={{ width: "100%", marginTop: "10px", borderRadius: "10px" }}
            />
          )}

        </div>
      )}

    </div>
  );
}

export default AIFoodScanner;