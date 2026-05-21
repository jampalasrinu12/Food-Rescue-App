// ===============================
// FILE: backend/server.js
// ===============================

// Load environment variables FIRST
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const http = require("http");
const { Server } = require("socket.io");

// 🔥 Import DB (connects once)
require("./config/db");

// Routes
const authRoutes = require("./routes/auth.routes");
const donationRoutes = require("./routes/donationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profile");
const notificationRoutes = require("./routes/notificationRoutes");

// 🔥 Analytics Engine (auto-runs)
require("./analyticsEngine");

const app = express();
const server = http.createServer(app);


// ===============================
// MIDDLEWARE
// ===============================
app.use(cors({ origin: "*", credentials: true }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// 🔥 Make uploads folder public
app.use("/uploads", express.static("uploads"));
// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "Smart Food Waste Management API"
  });
});
// ===============================
// SOCKET.IO
// ===============================
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// IMPORTANT
app.set("io", io);

// Import distance utilities
const { haversineDistance, isPickupArrivedAtDonor } = require("./utils/distance");
const notifyService = require("./utils/notificationService");

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Join user/role rooms
  socket.on("join", (data) => {
    const { userId, role } = data || {};

    if (!role && !userId) {
      console.log("❌ Invalid join data");
      return;
    }




    if (userId) {
      socket.join(userId.toString());
    }

    if (role) {
      socket.join(role);
      if (role === "receiver" || role === "ngo") {
        socket.join("ngo");
      }
    }

    console.log(`✅ Joined → user: ${userId || "anon"}, role: ${role || "unknown"}`);
  });

  // Join specific donation tracking room
  socket.on("joinDonation", (data) => {
    const { donationId } = data || {};

    if (!donationId) {
      console.log("❌ Invalid donation join");
      return;
    }

    socket.join(`donation_${donationId}`);
    console.log(`✅ Joined donation room: donation_${donationId}`);
  });

  // ===== LIVE TRACKING =====
  // Pickup team sends real-time location
  socket.on("pickup-location-update", (data) => {
    const { donationId, lat, lng, pickupUserId } = data || {};

    if (!donationId || typeof lat !== "number" || typeof lng !== "number") {
      console.log("❌ Invalid location data");
      return;
    }

    // Broadcast to donation room (donor + NGO + admin can see)
    const payload = {
      donationId,
      lat,
      lng,
      timestamp: Date.now()
    };

    io.to(`donation_${donationId}`).emit("pickup-location", payload);

    // Save tracking to database
    const db = require("./config/db");
    db.query(
      `INSERT INTO pickup_tracking 
       (donation_id, pickup_user_id, latitude, longitude, timestamp) 
       VALUES (?, ?, ?, ?, NOW())`,
      [donationId, pickupUserId || null, lat, lng],
      (err) => {
        if (err) console.error("Tracking DB Error:", err);
      }
    );
  });

  // Check if pickup arrived at donor (distance < 50m)
  socket.on("check-arrival", (data) => {
    const { donationId, pickupLat, pickupLng, donorLat, donorLng } = data || {};

    if (!donationId || !pickupLat || !donorLat) return;

    const arrived = isPickupArrivedAtDonor(pickupLat, pickupLng, donorLat, donorLng);
    const distance = haversineDistance(pickupLat, pickupLng, donorLat, donorLng);

    socket.emit("arrival-check-result", {
      donationId,
      arrived,
      distanceKm: distance,
      distanceMeters: Math.round(distance * 1000)
    });

    // If arrived, notify donor
    if (arrived) {
      io.to(`donation_${donationId}`).emit("pickup-arrived", {
        donationId,
        message: "🚗 Pickup team has arrived!"
      });
    }
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ===============================
// API ROUTES
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.delete("/test-delete", (req,res)=>{
  res.json({message:"Delete route working"});
});
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);

// ===============================
// 🔥 AI ROUTE
// ===============================

// Use MEMORY storage (no temp files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * 🧠 AI FOOD FRESHNESS ANALYSIS
 * Receives:
 * - image
 * - food_name
 * - prepared_time
 * - expiry_time
 * - donor_lat
 * - donor_lng
 * - street
 */
app.post("/api/ai/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const {
      food_name,
      prepared_time,
      expiry_time,
      donor_lat,
      donor_lng,
      street
    } = req.body;

    // 🔹 Build FormData for FastAPI
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: "food.jpg",
      contentType: req.file.mimetype
    });

    // Send metadata
    formData.append("food_name", food_name || "");
    formData.append("prepared_time", prepared_time || "");
    formData.append("expiry_time", expiry_time || "");
    formData.append("donor_lat", donor_lat || "");
    formData.append("donor_lng", donor_lng || "");
    formData.append("street", street || "");

    // 🔥 Send to Python AI server
    const aiResponse = await axios.post(
      "http://127.0.0.1:8000/analyze-food", // ✅ MATCHES FastAPI
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000
      }
    );

    // ✅ Return AI result
    res.json(aiResponse.data);

  } catch (error) {
    console.error("🧠 AI ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "AI analysis failed",
      details: error.response?.data || error.message
    });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🧠 AI Proxy: http://localhost:${PORT}/api/ai/analyze`);
});
