import { useState, useEffect } from "react";
import AddDonation from "../components/AddDonation";
import Profile from "../components/Profile";
import NotificationBell from "../components/NotificationBell";
import api from "../api";
import socket from "../socket";

function Donor() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [donations, setDonations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true
  });
  const [notificationMessages, setNotificationMessages] = useState([]);

  // Load donations and profile
  useEffect(() => {
    loadDonations();
    loadProfile();
    loadNotificationSettings();
    applyTheme();

    // Socket listeners for real-time notifications
    const userId = sessionStorage.getItem("userId");
    socket.emit("join", { userId, role: "donor" });

    socket.on("notification", (data) => {
      setNotificationMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off("notification");
    };
  }, []);

  const clearNotifications = () => {
    setNotificationMessages([]);
  };

  const loadDonations = async () => {
    try {
      const res = await api.get("/donations/user", {
        headers: { Authorization: "Bearer " + sessionStorage.getItem("token") }
      });
      setDonations(res.data);
    } catch (err) {
      console.log("Error loading donations:", err);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await api.get("/profile", {
        headers: { Authorization: "Bearer " + sessionStorage.getItem("token") }
      });
      setProfile(res.data);
    } catch (err) {
      console.log("Error loading profile:", err);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const res = await api.get("/profile/notifications", {
        headers: { Authorization: "Bearer " + sessionStorage.getItem("token") }
      });
      setNotifications(res.data);
    } catch (err) {
      console.log("Error loading notification settings:", err);
    }
  };

  const applyTheme = (themeToApply = theme) => {
    const root = document.documentElement;
    if (themeToApply === "dark") {
      root.style.setProperty("--bg-color", "#1a1a1a");
      root.style.setProperty("--text-color", "#ffffff");
      root.style.setProperty("--card-bg", "#2d2d2d");
      root.style.setProperty("--border-color", "#444");
    } else {
      root.style.setProperty("--bg-color", "#f4f6f8");
      root.style.setProperty("--text-color", "#333");
      root.style.setProperty("--card-bg", "#ffffff");
      root.style.setProperty("--border-color", "#e0e0e0");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const updateNotificationSettings = async () => {
    try {
      await api.post("/profile/notifications", notifications, {
        headers: { Authorization: "Bearer " + sessionStorage.getItem("token") }
      });
      alert("Notification settings updated!");
    } catch (err) {
      alert("Error updating settings");
    }
  };

  const getStatusLabel = (donation) => {
    if (donation.status === "donated") return "Delivered";
    if (donation.status === "available") return "Pending";
    if (donation.status === "requested") {
      if (donation.pickup_status === "ASSIGNED") return "Pickup Assigned";
      if (donation.pickup_status === "ACCEPTED") return "Accepted by NGO";
      if (donation.pickup_status === "ARRIVED") return "Pickup Arrived";
      if (donation.pickup_status === "PICKED") return "Picked Up";
      return "Accepted by NGO";
    }
    return donation.status?.toString().toUpperCase() || "Unknown";
  };

  const getStatusColor = (statusLabel) => {
    switch (statusLabel) {
      case "Pending":
        return "#4CAF50";
      case "Accepted by NGO":
      case "Pickup Assigned":
      case "Pickup Arrived":
      case "Picked Up":
        return "#FF9800";
      case "Delivered":
        return "#2196F3";
      default:
        return "#9E9E9E";
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Notification Bell */}
      <NotificationBell
        notifications={notificationMessages}
        clearNotifications={clearNotifications}
      />

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        borderRadius: "15px",
        color: "white"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px" }}>👤 Donor Dashboard</h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
            Welcome back! Manage your donations and profile
          </p>
        </div>
        <button
          onClick={toggleTheme}
          style={{
            padding: "10px 20px",
            borderRadius: "25px",
            border: "none",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "30px",
        borderBottom: "2px solid #e0e0e0",
        paddingBottom: "10px"
      }}>
        {[
          { id: "dashboard", label: "📊 Dashboard", icon: "📊" },
          { id: "donate", label: "🍱 Add Donation", icon: "🍱" },
          { id: "history", label: "📋 My Donations", icon: "📋" },
          { id: "profile", label: "👤 Profile", icon: "👤" },
          { id: "settings", label: "⚙️ Settings", icon: "⚙️" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 24px",
              borderRadius: "25px",
              border: "none",
              background: activeTab === tab.id ? "#667eea" : "#f5f5f5",
              color: activeTab === tab.id ? "white" : "#333",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.3s ease"
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {/* Stats Cards */}
          <div style={{
            background: "var(--card-bg)",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            border: "1px solid var(--border-color)"
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#667eea" }}>📦 Total Donations</h3>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#333" }}>
              {donations.length}
            </div>
            <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>
              Food items donated
            </p>
          </div>

          <div style={{
            background: "var(--card-bg)",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            border: "1px solid var(--border-color)"
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#4CAF50" }}>✅ Completed</h3>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#4CAF50" }}>
              {donations.filter(d => d.status === "donated").length}
            </div>
            <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>
              Successfully delivered
            </p>
          </div>

          <div style={{
            background: "var(--card-bg)",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            border: "1px solid var(--border-color)"
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#FF9800" }}>⏳ Pending</h3>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#FF9800" }}>
              {donations.filter(d => d.status === "available" || d.status === "requested").length}
            </div>
            <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>
              Awaiting pickup
            </p>
          </div>

          {/* Profile Summary */}
          <div style={{
            background: "var(--card-bg)",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            border: "1px solid var(--border-color)",
            gridColumn: "span 2"
          }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#667eea" }}>👤 Profile Summary</h3>
            {profile ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <strong>Name:</strong> {profile.name}
                </div>
                <div>
                  <strong>Phone:</strong> {profile.phone}
                </div>
                <div>
                  <strong>Email:</strong> {profile.email}
                </div>
                <div>
                  <strong>City:</strong> {profile.city}
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <strong>Address:</strong> {profile.house}, {profile.street}, {profile.city}, {profile.state} {profile.pincode}
                </div>
              </div>
            ) : (
              <p>Please complete your profile in the Profile tab</p>
            )}
          </div>
        </div>
      )}

      {/* Add Donation Tab */}
      {activeTab === "donate" && (
        <div style={{
          background: "var(--card-bg)",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          border: "1px solid var(--border-color)"
        }}>
          <h2 style={{ margin: "0 0 25px 0", color: "#667eea" }}>🍱 Add New Donation</h2>
          <AddDonation onSuccess={loadDonations} />
        </div>
      )}

      {/* Donation History Tab */}
      {activeTab === "history" && (
        <div style={{
          background: "var(--card-bg)",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          border: "1px solid var(--border-color)"
        }}>
          <h2 style={{ margin: "0 0 25px 0", color: "#667eea" }}>📋 My Donation History</h2>
          {donations.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>
              No donations yet. Start by adding your first donation!
            </p>
          ) : (
            <div style={{ display: "grid", gap: "15px" }}>
              {donations.map(donation => (
                <div key={donation.id} style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "20px",
                  background: "var(--bg-color)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0, color: "#333" }}>{donation.food_name}</h3>
                    <span style={{
                      padding: "5px 12px",
                      borderRadius: "15px",
                      background: getStatusColor(getStatusLabel(donation)),
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {getStatusLabel(donation)}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", fontSize: "14px" }}>
                    <div><strong>Quantity:</strong> {donation.quantity}</div>
                    <div><strong>Priority:</strong> {donation.priority}</div>
                    <div><strong>Prepared:</strong> {new Date(donation.prepared_time).toLocaleString()}</div>
                    <div><strong>Expiry:</strong> {new Date(donation.expiry_time).toLocaleString()}</div>
                    <div><strong>Address:</strong> {donation.donor_address}</div>
                    {donation.ngo_name && <div><strong>NGO:</strong> {donation.ngo_name}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div style={{
          background: "var(--card-bg)",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          border: "1px solid var(--border-color)"
        }}>
          <h2 style={{ margin: "0 0 25px 0", color: "#667eea" }}>👤 My Profile</h2>
          <Profile />
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div style={{
          background: "var(--card-bg)",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          border: "1px solid var(--border-color)"
        }}>
          <h2 style={{ margin: "0 0 25px 0", color: "#667eea" }}>⚙️ Settings</h2>

          {/* Notification Settings */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>🔔 Notification Preferences</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                />
                📧 Email notifications for donation updates
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                />
                📱 SMS notifications for pickup updates
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                />
                🔔 Push notifications in browser
              </label>
            </div>
            <button
              onClick={updateNotificationSettings}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                borderRadius: "25px",
                border: "none",
                background: "#4CAF50",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              💾 Save Notification Settings
            </button>
          </div>

          {/* Theme Settings */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>🎨 Theme Settings</h3>
            <div style={{ display: "flex", gap: "15px" }}>
              <button
                onClick={() => { setTheme("light"); localStorage.setItem("theme", "light"); applyTheme("light"); }}
                style={{
                  padding: "12px 24px",
                  borderRadius: "25px",
                  border: theme === "light" ? "2px solid #667eea" : "2px solid #e0e0e0",
                  background: theme === "light" ? "#667eea" : "white",
                  color: theme === "light" ? "white" : "#333",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                ☀️ Light Theme
              </button>
              <button
                onClick={() => { setTheme("dark"); localStorage.setItem("theme", "dark"); applyTheme("dark"); }}
                style={{
                  padding: "12px 24px",
                  borderRadius: "25px",
                  border: theme === "dark" ? "2px solid #667eea" : "2px solid #e0e0e0",
                  background: theme === "dark" ? "#667eea" : "white",
                  color: theme === "dark" ? "white" : "#333",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                🌙 Dark Theme
              </button>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>📋 Account Information</h3>
            <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "14px" }}>
                <div><strong>User ID:</strong> {sessionStorage.getItem("userId")}</div>
                <div><strong>Role:</strong> {sessionStorage.getItem("role")}</div>
                <div><strong>Registered:</strong> {profile ? new Date().toLocaleDateString() : "N/A"}</div>
                <div><strong>Last Login:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Version Information */}
          <div style={{ marginTop: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "10px", textAlign: "center" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>📱 Application Version</h4>
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Food Waste Management System - Version 1.0</p>
            <p style={{ margin: "5px 0 0 0", color: "#999", fontSize: "12px" }}>© 2024 Food Rescue Platform</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Donor;
