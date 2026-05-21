import { useEffect, useState } from "react";
import api from "../api";

function AdminStats() {

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    requested: 0,
    expired: 0
  });

  useEffect(() => {
    api.get("/donations").then(res => {

      const data = res.data;

      const total = data.length;
      const available = data.filter(d => d.status === "available").length;
      const requested = data.filter(d => d.status === "requested").length;
      const expired = data.filter(d =>
        d.expiry_time && new Date(d.expiry_time) < new Date()
      ).length;

      setStats({ total, available, requested, expired });

    });
  }, []);

  return (
    <div className="stats-grid">

      <div className="stat-card">🍱 Total<br/><b>{stats.total}</b></div>
      <div className="stat-card">🟢 Available<br/><b>{stats.available}</b></div>
      <div className="stat-card">📦 Requested<br/><b>{stats.requested}</b></div>
      <div className="stat-card">⚠ Expired<br/><b>{stats.expired}</b></div>

    </div>
  );
}

export default AdminStats;