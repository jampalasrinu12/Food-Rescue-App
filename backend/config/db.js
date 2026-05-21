// ===============================
// FILE: backend/config/db.js
// ===============================

// Load environment variables
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mysql = require("mysql2");

// 🔥 CREATE CONNECTION POOL (VERY IMPORTANT)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "food_waste_db",

  waitForConnections: true,
  connectionLimit: 10,   // max simultaneous connections
  queueLimit: 0
});

// 🔍 TEST CONNECTION ON STARTUP
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL Pool Connection Failed:", err.message);
    return;
  }
  console.log("✅ MySQL Pool Connected");
  connection.release(); // release back to pool
});

module.exports = pool;
