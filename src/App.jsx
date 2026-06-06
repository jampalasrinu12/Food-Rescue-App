import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";

import AddDonation from "./components/AddDonation";
import DonationList from "./components/DonationList";
import NGOActions from "./components/NGOActions";
import PickupScheduler from "./components/PickupScheduler";
import DashboardCards from "./components/DashboardCards";
import AIFoodScanner from "./components/AIFoodScanner";
import HeroSection from "./components/HeroSection";
import PickupMapPage from "./components/PickupMapPage";
import { useEffect } from "react";
import { io } from "socket.io-client";
import AdminStats from "./components/AdminStats";
import AdminLogs from "./components/AdminLogs";
import LoginLogs from "./components/LoginLogs";

import AdminLogin from "./pages/AdminLogin";
import Profile from "./components/Profile";

/* ✅ ADD THESE LOGIN IMPORTS */
import DonorLogin from "./pages/DonorLogin";
import NGOLogin from "./pages/NGOLogin";
import PickupLogin from "./pages/PickupLogin";
import Notification from "./components/Notification";
import NotificationBell from "./components/NotificationBell";
import socket from "./socket";
import { useState } from "react";

/* 🟣 ACTIVE LINK HIGHLIGHT */
function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        margin: "14px 0",
        padding: "12px 18px",
        borderRadius: "30px",
        textDecoration: "none",
        fontWeight: "600",
        background: active
          ? "linear-gradient(135deg, #667eea, #764ba2)"
          : "transparent",
        color: active ? "white" : "#333",
        boxShadow: active ? "0 6px 16px rgba(0,0,0,0.25)" : "none",
        transition: "all 0.3s ease"
      }}
    >
      {children}
    </Link>
  );
}

/* 🏠 HOME PAGE */
function Home() {

  const role = sessionStorage.getItem("role");
  const navigate = useNavigate();

  return (
    <div>
      <HeroSection />
      {!role && (
        <div style={{ margin: "20px 0", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/admin-login")}
            style={{ padding: "12px 20px", borderRadius: "999px", border: "none", background: "#5f72ff", color: "white", cursor: "pointer" }}
          >
            Admin Login
          </button>
          <button
            onClick={() => navigate("/donor-login")}
            style={{ padding: "12px 20px", borderRadius: "999px", border: "1px solid #5f72ff", background: "white", color: "#5f72ff", cursor: "pointer" }}
          >
            Donor Login
          </button>
          <button
            onClick={() => navigate("/ngo-login")}
            style={{ padding: "12px 20px", borderRadius: "999px", border: "1px solid #5f72ff", background: "white", color: "#5f72ff", cursor: "pointer" }}
          >
            NGO Login
          </button>
          <button
            onClick={() => navigate("/pickup-login")}
            style={{ padding: "12px 20px", borderRadius: "999px", border: "1px solid #5f72ff", background: "white", color: "#5f72ff", cursor: "pointer" }}
          >
            Pickup Login
          </button>
        </div>
      )}

      <h2 className="section-title">🔄 How It Works</h2>

      <div className="flow-grid">
        <div className="flow-card">
          <div className="flow-icon">👤</div>
          <h3>Donor</h3>
          <p>Post surplus food with cooked time, expiry & location.</p>
        </div>

        <div className="flow-card">
          <div className="flow-icon">🤝</div>
          <h3>NGO</h3>
          <p>Nearby NGOs accept safe food based on freshness score.</p>
        </div>

        <div className="flow-card">
          <div className="flow-icon">🚚</div>
          <h3>Pickup</h3>
          <p>Pickup teams collect food before expiry.</p>
        </div>
      </div>

      <h2 className="section-title">📊 Live Impact</h2>
      <DashboardCards />

      <h2 className="section-title">⚡ Quick Actions</h2>

      <div className="quick-grid">

        {(role === "admin" || role === "donor") && (
          <Link to="/donor" className="quick-card">
            <h3>🍱 Donate Now</h3>
            <p>Add surplus food in less than 1 minute.</p>
          </Link>
        )}

        {(role === "admin" || role === "receiver") && (
          <Link to="/ngo" className="quick-card">
            <h3>🤝 Available Food</h3>
            <p>View nearby safe-to-donate food.</p>
          </Link>
        )}

        {(role === "admin" || role === "pickup") && (
          <Link to="/pickup" className="quick-card">
            <h3>🚚 Schedule Pickup</h3>
            <p>Collect food before it expires.</p>
          </Link>
        )}

        {role === "admin" && (
          <Link to="/ai" className="quick-card">
            <h3>🧠 AI Freshness Check</h3>
            <p>Predict freshness & expiry using AI rules.</p>
          </Link>
        )}

      </div>

      <h2 className="section-title">🟢 Live Donation Activity</h2>

      <div className="card">
        <DonationList />
      </div>
    </div>
  );
}

/* 👤 DONOR PAGE */
function DonorPage() {
  return (
    <div className="card">
      <h2>👤 Donor Panel</h2>
      <p>Post surplus food and help nearby NGOs instantly.</p>
      <AddDonation />
    </div>
  );
}

/* 🛠 ADMIN PAGE */
function AdminPage() {
  return (
    <div className="card">
      <h2>🛠 Admin Dashboard</h2>
      <p>Monitor donations, freshness status, and pickups.</p>

      {/* 🔥 STATS */}
      <AdminStats />

      {/* 🚨 ALERT BOX */}
      <div style={{
        background:"#fff3cd",
        padding:"15px",
        borderRadius:"10px",
        marginBottom:"15px",
        fontWeight:"500"
      }}>
        ⚠ Monitor expired food and pending pickups!
      </div>
{/* 🔐 LOGIN LOGS */}
<LoginLogs />			
{/* 📜 LOGS ADD HERE */}
<AdminLogs />

      {/* 📦 DONATIONS */}
      <DonationList />
    </div>
  );
}

/* 🤝 NGO PAGE */
function NGOPage() {
  return (
    <div className="card">
      <h2>🤝 NGO Dashboard</h2>
      <p>Accept food that is verified safe by AI.</p>
      <NGOActions />
    </div>
  );
}

/* 🚚 PICKUP PAGE */
function PickupPage() {
  return (
    <div className="card">
      <h2>🚚 Pickup Team Dashboard</h2>
      <p>Schedule and complete pickups efficiently.</p>
      <PickupScheduler />
    </div>
  );
}

/* 🧠 AI PAGE */
function AIPage() {
  return (
    <div className="card">
      <h2>🧠 AI Freshness Analyzer</h2>
      <p>
        Upload food image, cooked time & food name to predict freshness
        and expiry safety.
      </p>
      <AIFoodScanner />
    </div>
  );
}

/* 🔥 MAIN APPLICATION */
function App() {
const [notifications, setNotifications] = useState([]);

  const location = useLocation();
  const role = sessionStorage.getItem("role");
useEffect(() => {

  const userId = sessionStorage.getItem("userId");
  const role = sessionStorage.getItem("role");

  if (userId && role) {
    socket.emit("join", { userId, role });
    console.log("Joined:", userId, role);
  }

  const sound = new Audio("/sounds/notification.mp3");

  socket.on("notification", (data) => {
    console.log("🔥 Notification:", data);

    // 🔔 ADD TO STATE
    setNotifications(prev => [...prev, data.message]);

    // 🔊 SOUND
    sound.currentTime = 0;
    sound.play().catch(()=>{});
  });

  return () => {
    socket.off("notification");
  };

}, []);

  const isLoginPage =
    location.pathname === "/admin-login" ||
    location.pathname === "/donor-login" ||
    location.pathname === "/ngo-login" ||
    location.pathname === "/pickup-login";

  const navigate = useNavigate();

  /* 🔓 LOGOUT FUNCTION */
  const logout = () => {

    const role = sessionStorage.getItem("role");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");

    if (role === "admin") navigate("/admin-login");
    else if (role === "donor") navigate("/donor-login");
    else if (role === "receiver") navigate("/ngo-login");
    else if (role === "pickup") navigate("/pickup-login");
    else navigate("/");

  };

  return (
    <div className={isLoginPage ? "" : "app-layout"}>

      {/* 🔹 SIDEBAR */}
      {!isLoginPage && (
        <div className="sidebar">

          <h2>🍽 Food Rescue</h2>

          {role && (
            <p style={{fontSize:"13px",opacity:0.7}}>
              Logged in as <b>{role}</b>
            </p>
          )}

          <NavLink to="/">🏠 Home</NavLink>
          {role && (
  <NavLink to="/profile">👤 Profile</NavLink>
)}

          {(role === "admin" || role === "donor") && (
            <NavLink to="/donor">👤 Donor</NavLink>
          )}

          {role === "admin" && (
            <>
              <NavLink to="/admin">🛠 Admin</NavLink>
              <NavLink to="/ai">🧠 AI Freshness</NavLink>
            </>
          )}

          {(role === "admin" || role === "receiver") && (
            <NavLink to="/ngo">🤝 NGO</NavLink>
          )}

          {(role === "admin" || role === "pickup") && (
            <NavLink to="/pickup">🚚 Pickup</NavLink>
          )}

          {role && (
            <button
              onClick={logout}
              style={{
                marginTop: "30px",
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: "#ff5252",
                color: "white",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              🚪 Logout
            </button>
          )}

        </div>
      )}

      {/* 🔹 MAIN CONTENT */}
      <div className={isLoginPage ? "" : "main-content"}>
        <div className="page">

          <Routes>
            <Route path="/profile" element={
  role
    ? <Profile />
    : <Navigate to="/" />
}/>

            <Route path="/" element={<Home />} />

            <Route path="/donor" element={
              role === "admin" || role === "donor"
                ? <DonorPage />
                : <Navigate to="/" />
            }/>

            <Route path="/admin" element={
              role === "admin"
                ? <AdminPage />
                : <Navigate to="/" />
            }/>

            <Route path="/ngo" element={
              role === "admin" || role === "receiver"
                ? <NGOPage />
                : <Navigate to="/" />
            }/>

            <Route path="/pickup" element={
              role === "admin" || role === "pickup"
                ? <PickupPage />
                : <Navigate to="/" />
            }/>

            <Route path="/ai" element={
              role === "admin"
                ? <AIPage />
                : <Navigate to="/" />
            }/>

            {/* LOGIN ROUTES */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/donor-login" element={<DonorLogin />} />
            <Route path="/ngo-login" element={<NGOLogin />} />
            <Route path="/pickup-login" element={<PickupLogin />} />
            

            {/* MAP */}
            <Route path="/pickup-map" element={<PickupMapPage />} />

          </Routes>

        </div>
      </div>
    </div>
  );
}

export default App;