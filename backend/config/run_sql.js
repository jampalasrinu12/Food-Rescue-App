const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "food_waste_db",
  multipleStatements: true
});

const sqlFile = path.join(__dirname, "notification_settings.sql");
const sql = fs.readFileSync(sqlFile, "utf8");

pool.query(sql, (err, results) => {
  if (err) {
    console.error("Error executing SQL:", err);
    process.exit(1);
  }
  console.log("Database schema updated successfully!");
  console.log("Results:", results);
  pool.end();
});