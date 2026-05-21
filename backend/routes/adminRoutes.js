  const express = require("express");
  const router = express.Router();
  const db = require("../config/db");

  const authController = require("../controllers/adminController");

  /* ===============================
    REGISTER
  =============================== */
  router.post("/register", authController.register);

  /* ===============================
    LOGIN
  =============================== */
  router.post("/login", authController.login);

  /* ===============================
    OTP LOGIN
  =============================== */
  router.post("/send-otp", authController.sendOTP);
  router.post("/verify-otp", authController.verifyOTP);

  /* ===============================
    FORGOT PASSWORD
  =============================== */
  router.post("/forgot-password", authController.forgotPassword);

  /* ===============================
    RESET PASSWORD
  =============================== */
  router.post("/reset-password", authController.resetPassword);

  /* ===============================
    🔐 LOGIN LOGS
  =============================== */
  router.get("/login-logs", (req, res) => {

    db.query(`
      SELECT email, status, message, login_time
      FROM login_history
      ORDER BY login_time DESC
      LIMIT 50
    `, (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch login logs" });
      }

      res.json(result);
    });

  });

  /* ===============================
    📜 DONATION LOGS
  =============================== */
  router.get("/history", (req, res) => {

    db.query(`
      SELECT donation_id, action, new_status, action_time
      FROM donation_history
      ORDER BY action_time DESC
      LIMIT 50
    `, (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch logs" });
      }

      res.json(result);
    });

  });

  module.exports = router;