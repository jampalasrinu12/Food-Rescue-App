import { useEffect, useState } from "react";
import api from "../api";
import { io } from "socket.io-client";
import { useRef } from "react";
import { WEB_SOCKET_URL, UPLOADS_URL } from "../config";

function NGOActions() {
  
  const socketRef = useRef(null);
  const [donations, setDonations] = useState([]);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");



  const [stats, setStats] = useState({
    available: 0,
    high: 0,
    medium: 0,
    low: 0,
    accepted: 0
  });

  const ngoName =
    localStorage.getItem("ngoName") || "Helping Hands NGO";

  // ✅ HELPER
  const isExpired = (time) =>
    time && new Date(time) < new Date();

  // ===========================
  // 📊 CALCULATE STATS
  // ===========================
  const calculateStats = (data, historyData) => {

    let high = 0, medium = 0, low = 0;

    data.forEach(d => {
      if (d.priority === "HIGH") high++;
      else if (d.priority === "MEDIUM") medium++;
      else low++;
    });

    setStats({
      available: data.length,
      high,
      medium,
      low,
      accepted: historyData.length
    });
  };

  // ===========================
  // 🔄 LOAD DATA
  // ===========================
 const loadData = async () => {
  try {

    const donRes = await api.get("/donations/available");

    let histData = [];

    try {
      const res = await api.get(`/donations/history/${ngoName}`);
      histData = res.data;
    } catch (e) {
      console.log("History not available");
    }

    setDonations(donRes.data);
    setHistory(histData);

    calculateStats(donRes.data, histData);

  } catch (err) {
    console.error("Load error:", err);
  }
};

useEffect(() => {
  socketRef.current = io(WEB_SOCKET_URL);

  return () => {
    socketRef.current.disconnect();
  };
}, []);

  useEffect(() => {
    loadData();
  }, []);

useEffect(() => {

  socketRef.current.emit("join", {
    userId: "ngo1",
    role: "ngo"
  });

}, []);

useEffect(() => {

  socketRef.current.on("notification", (data) => {
    console.log("🔥 NGO Notification:", data);

    loadData(); // 🔥 reload data automatically
  });

  return () => socketRef.current.off("notification");

}, []);

  // ===========================
  // 🤝 ACCEPT
  // ===========================
  const acceptDonation = async (id) => {
    try {

      await api.put(`/donations/${id}/accept`, {
        ngo_name: ngoName
      });

      setMessage("✅ Donation accepted successfully");

      loadData();

    } catch {
      setMessage("❌ Error accepting donation");
    }
  };

  // ===========================
  // 🎨 PRIORITY BADGE
  // ===========================
  const badge = (p) => {
    const style = {
      padding: "4px 8px",
      borderRadius: "6px",
      color: "white",
      fontSize: "12px"
    };

    if (p === "HIGH") return <span style={{...style, background:"#ff5252"}}>HIGH</span>;
    if (p === "MEDIUM") return <span style={{...style, background:"#ffb300"}}>MEDIUM</span>;
    return <span style={{...style, background:"#4caf50"}}>LOW</span>;
  };

  const statCard = (color) => ({
    background: color,
    color: "white",
    padding: "15px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "600"
  });

  // ===========================
  // UI
  // ===========================
  return (
    <div style={{ maxWidth: "1200px", margin: "auto" }}>

   
      <p style={{ color: "#777" }}>
        Accept and manage food donations in real-time
      </p>

      {/* 📊 STATS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
        gap: "15px",
        marginTop: "15px"
      }}>
        <div style={statCard("#2196f3")}>📦 {stats.available}<p>Available</p></div>
        <div style={statCard("#ff5252")}>🔴 {stats.high}<p>High</p></div>
        <div style={statCard("#ffb300")}>🟡 {stats.medium}<p>Medium</p></div>
        <div style={statCard("#4caf50")}>🟢 {stats.low}<p>Low</p></div>
        <div style={statCard("#673ab7")}>✅ {stats.accepted}<p>Accepted</p></div>
      </div>

      {/* INFO */}
      <div style={{
        background:"#e3f2fd",
        padding:"10px",
        borderRadius:"8px",
        marginTop:"15px"
      }}>
        ℹ️ Accept high priority food quickly to avoid waste
      </div>

      {/* AVAILABLE */}
      <h3 style={{marginTop:"30px"}}>📦 Available Donations</h3>

      {donations.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          background:"#fff",
          borderRadius:"12px",
          boxShadow:"0 5px 20px rgba(0,0,0,0.1)"
        }}>
          <h3>🍽 No Donations Available</h3>
          <p style={{color:"#777"}}>New donations will appear here</p>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
        gap: "20px",
        marginTop: "20px"
      }}>

        {[...donations]
          .sort((a, b) => {
            const order = { HIGH: 1, MEDIUM: 2, LOW: 3 };
            return order[a.priority] - order[b.priority];
          })
          .map((d) => {

            const expired = isExpired(d.expiry_time);

            const expiringSoon =
              d.expiry_time &&
              (new Date(d.expiry_time) - new Date()) < 2 * 60 * 60 * 1000 &&
              !expired;

            return (

              <div key={d.id} style={{
                background: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                border: expired ? "2px solid red" : "none",
                opacity: expired ? 0.8 : 1
              }}>

                {d.food_image ? (
                  <img
                    src={`${UPLOADS_URL}/${d.food_image}`}
                    alt="Food"
                    style={{ width:"100%", height:"180px", objectFit:"cover" }}
                  />
                ) : (
                  <div style={{
                    height:"180px",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    background:"#eee"
                  }}>📷 No Image</div>
                )}

                <div style={{ padding:"15px" }}>

                  {expired && <span style={{background:"red",color:"white",padding:"4px 8px",borderRadius:"6px"}}>EXPIRED</span>}
                  {expiringSoon && <span style={{background:"orange",color:"white",padding:"4px 8px",borderRadius:"6px",marginLeft:"5px"}}>SOON</span>}

                  <h3>{d.food_name}</h3>

                  <p><b>Qty:</b> {d.quantity}</p>
                  <p><b>Priority:</b> {badge(d.priority)}</p>
                  <p>📍 {d.donor_address || "Not Provided"}</p>

                  <p>
                    ⏰ Expiry:{" "}
                    {d.expiry_time
                      ? new Date(d.expiry_time).toLocaleString()
                      : "Not set"}
                  </p>

                  {expired && (
                    <p style={{ color: "red", fontWeight: "bold" }}>
                      ⚠ Food Expired
                    </p>
                  )}

                  <button
                    disabled={expired}
                    onClick={() => acceptDonation(d.id)}
                    style={{
                      marginTop:"10px",
                      background: expired ? "#aaa" : "#ff5722",
                      color:"white",
                      border:"none",
                      padding:"8px 12px",
                      borderRadius:"6px"
                    }}
                  >
                    {expired ? "Expired" : "Accept Donation"}
                  </button>

                </div>

              </div>
            );
        })}

      </div>

      {/* HISTORY */}
      <h3 style={{marginTop:"40px"}}>📜 Accepted History</h3>

      {history.length === 0 ? (
        <p style={{color:"#777"}}>No history yet</p>
      ) : (
        <div style={{marginTop:"15px"}}>
         {history.map((h) => (
  <div key={h.id} style={{
    padding:"12px",
    marginBottom:"10px",
    borderRadius:"8px",
    boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
    background:
      h.priority === "HIGH"
        ? "#ffe5e5"
        : h.priority === "MEDIUM"
        ? "#fff4e5"
        : "#e5ffe5"
  }}>

    <p><b>🍱 Food:</b> {h.food_name}</p>

    <p><b>📍 Place:</b> {h.donor_address}</p>

    <p>
      <b>⚡ Priority:</b>{" "}
      <span style={{
        color:
          h.priority === "HIGH"
            ? "red"
            : h.priority === "MEDIUM"
            ? "orange"
            : "green",
        fontWeight:"600"
      }}>
        {h.priority}
      </span>
    </p>

    <p>
      <b>🕒 Date:</b>{" "}
      {new Date(h.accepted_at || h.action_time).toLocaleString()}
    </p>

  </div>
))}
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <p style={{
          marginTop:"20px",
          color: message.includes("❌") ? "red" : "green",
          fontWeight:"600"
        }}>
          {message}
        </p>
      )}

    </div>
  );
}

export default NGOActions;