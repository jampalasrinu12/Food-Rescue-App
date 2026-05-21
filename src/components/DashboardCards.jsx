import { useEffect, useState } from "react";
import api from "../api";

function DashboardCards() {

  const [stats, setStats] = useState({
    total: 0,
    donated: 0,
    available: 0,
    ngos: 0,
    expired: 0
  });

  const [loading, setLoading] = useState(true);

  // ✅ HELPER
  const isExpired = (time) =>
    time && new Date(time) < new Date();

  useEffect(() => {

    const loadStats = async () => {
      try {
        const res = await api.get("/donations");
        const data = res.data;

        const total = data.length;
        const donated = data.filter(d => d.status === "donated").length;
        const available = data.filter(d => d.status === "available").length;

        const expired = data.filter(d =>
          isExpired(d.expiry_time)
        ).length;

        // 👉 unique NGO count
        const ngos = new Set(
          data.map(d => d.ngo_name).filter(Boolean)
        ).size;

        setStats({
          total,
          donated,
          available,
          ngos,
          expired
        });

      } catch (err) {
        console.error("Stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

  }, []);

  // 🎨 CARD STYLE
  const cardStyle = (bg) => ({
    background: bg,
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    textAlign: "center"
  });

  if (loading) return <p>⏳ Loading stats...</p>;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
      gap: "20px",
      marginBottom: "25px"
    }}>

      <div style={cardStyle("#e0f7fa")}>
        <h3>📦 Total Donations</h3>
        <h1>{stats.total}</h1>
      </div>

      <div style={cardStyle("#e8f5e9")}>
        <h3>🍽 Food Rescued</h3>
        <h1>{stats.donated}</h1>
      </div>

      <div style={cardStyle("#fff3e0")}>
        <h3>⏳ Available Now</h3>
        <h1>{stats.available}</h1>
      </div>

      <div style={cardStyle("#ede7f6")}>
        <h3>🤝 Active NGOs</h3>
        <h1>{stats.ngos}</h1>
      </div>

      <div style={cardStyle("#ffebee")}>
        <h3>⚠ Expired</h3>
        <h1>{stats.expired}</h1>
      </div>

    </div>
  );
}

export default DashboardCards;