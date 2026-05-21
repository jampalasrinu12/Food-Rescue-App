import { useEffect, useState } from "react";
import api from "../api";
import { UPLOADS_URL } from "../config";

function DonationList() {

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
const [filter, setFilter] = useState("all");

  const loadDonations = () => {
    api.get("/donations").then((res) => {
      setDonations(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDonations();
    const interval = setInterval(loadDonations, 5000);
    return () => clearInterval(interval);
  }, []);

  const priorityColor = (p) => {
    if (p === "HIGH") return "#ff5252";
    if (p === "MEDIUM") return "#ffb300";
    return "#4caf50";
  };

  const statusColor = (s) => {
    if (s === "available") return "#2e7d32";
    if (s === "requested") return "#ef6c00";
    if (s === "donated") return "#5e35b1";
    return "#555";
  };

  /* ADMIN ACTIONS */

  const acceptDonation = async (id) => {
    try {
      await api.put(`/donations/${id}/accept`, {
        ngo_name: "Admin Assigned NGO"
      });
      loadDonations();
    } catch (err) {
      console.error(err);
      alert("Accept failed");
    }
  };

  const schedulePickup = async (id) => {
    const time = prompt("Enter Pickup Time (YYYY-MM-DD HH:MM)");
    if (!time) return;

    try {
      await api.put(`/donations/${id}/schedule`, {
        pickup_time: time
      });
      loadDonations();
    } catch (err) {
      console.error(err);
      alert("Schedule failed");
    }
  };

  const completePickup = async (id) => {
    try {
      await api.put(`/donations/${id}/complete`);
      loadDonations();
    } catch (err) {
      console.error(err);
      alert("Pickup completion failed");
    }
  };

  /* 🔴 DELETE DONATION */

  const deleteDonation = async (id) => {

    if (!window.confirm("Delete this donation permanently?")) return;

    try {

      await api.delete(`/donations/${id}`);

      alert("Donation deleted successfully");

      loadDonations();

    } catch (error) {

      console.error("Delete Error:", error);

      alert("Delete failed. Check server.");

    }

  };
const filteredDonations = donations.filter((d) => {

  const matchSearch =
    d.food_name.toLowerCase().includes(search.toLowerCase());

  const matchFilter =
  filter === "all"
    ? true
    : filter === "expired"
    ? (d.expiry_time && new Date(d.expiry_time) < new Date())
    : d.status === filter;

  return matchSearch && matchFilter;

});

  return (
  <div>   {/* ✅ MAIN ROOT */}

    {/* 🔍 SEARCH + FILTER */}
    <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>

      <input
        type="text"
        placeholder="Search food..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "10px", borderRadius: "10px", flex: 1 }}
      />

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ padding: "10px", borderRadius: "10px" }}
      >
        <option value="all">All</option>
        <option value="available">Available</option>
        <option value="requested">Requested</option>
        <option value="donated">Donated</option>
        <option value="expired">Expired</option>
      </select>

    </div>

    {/* LOADING */}
    {loading && <p>⏳ Loading donations...</p>}

    {/* EMPTY */}
    {!loading && filteredDonations.length === 0 && (
      <p style={{ color: "#888" }}>No donations available yet.</p>
    )}

    {/* GRID */}
    <div className="donation-grid">

      {[...filteredDonations]
  .sort((a, b) => {
    const aExp = new Date(a.expiry_time) < new Date();
    const bExp = new Date(b.expiry_time) < new Date();
    return bExp - aExp;
  })
  .map((d) => {

        const expired =
          d.expiry_time && new Date(d.expiry_time) < new Date();

        return (
          <div
  key={d.id}
  className="donation-card"
  style={{
    border: expired ? "2px solid red" : "none",
    opacity: expired ? 0.8 : 1
  }}
>

            {d.food_image ? (
              <img
                src={`${UPLOADS_URL}/${d.food_image}`}
                alt={d.food_name}
                className="donation-image"
              />
            ) : (
              <div className="donation-image placeholder">
                🍽 No Image
              </div>
            )}

            <div className="donation-body">
{expired && (
  <span style={{
    background: "red",
    color: "white",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    marginBottom: "5px",
    display: "inline-block"
  }}>
    EXPIRED
  </span>
)}
              <h3>{d.food_name}</h3>

              <p>🍱 Qty: {d.quantity}</p>
              <p>🏢 NGO: {d.ngo_name || "Not Assigned"}</p>
 <p>
    📌 Status:{" "}
    <span style={{
      background: expired ? "red" : statusColor(d.status),
      color: "white",
      padding: "3px 6px",
      borderRadius: "6px"
    }}>
      {expired ? "expired" : d.status}
    </span>
  </p>

              {expired && (
                <p style={{ color: "red", fontWeight: "bold" }}>
                  ⚠ Food Expired
                </p>
              )}
            </div>

          </div>
        );
      })}

    </div>

  </div>
);
}

export default DonationList;