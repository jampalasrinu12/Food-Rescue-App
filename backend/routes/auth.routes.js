const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");


/* ===============================
   REGISTER
=============================== */

router.post("/register", authController.register);


/* ===============================
   LOGIN WITH PASSWORD
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


module.exports = router;
