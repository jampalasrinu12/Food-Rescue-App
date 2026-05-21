const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profileController");
const auth = require("../middleware/auth"); // 🔐 JWT middleware

/* =====================================================
   🔹 GET PROFILE (Logged-in user)
   GET /api/profile
===================================================== */
router.get("/", auth, profileController.getProfile);


/* =====================================================
   🔹 CREATE / UPDATE PROFILE
   POST /api/profile
===================================================== */
router.post("/", auth, profileController.saveProfile);


/* =====================================================
   🔹 UPDATE PROFILE (OPTIONAL - REST STYLE)
   PUT /api/profile
===================================================== */
router.put("/", auth, profileController.saveProfile);

/* =====================================================
   🔹 GET NOTIFICATION SETTINGS
   GET /api/profile/notifications
===================================================== */
router.get("/notifications", auth, profileController.getNotificationSettings);

/* =====================================================
   🔹 SAVE NOTIFICATION SETTINGS
   POST /api/profile/notifications
===================================================== */
router.post("/notifications", auth, profileController.saveNotificationSettings);

/* =====================================================
   🔹 DELETE PROFILE (OPTIONAL FUTURE)
===================================================== */
// router.delete("/", auth, profileController.deleteProfile);


module.exports = router;