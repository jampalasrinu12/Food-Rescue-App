const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const auth = require("../middleware/auth");

const multer = require("multer");

// ===============================
// 🔥 MULTER STORAGE CONFIG
// ===============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ===============================
// DONOR
// ===============================
router.post("/", auth, upload.single("food_image"), donationController.addDonation);
router.get("/user", auth, donationController.getUserDonations);

// ===============================
// ADMIN
// ===============================
router.get("/", donationController.getAllDonations);
router.delete("/:id", donationController.deleteDonation);

// ===============================
// NGO
// ===============================
router.get("/available", donationController.getAvailableDonations);
router.put("/:id/accept", donationController.acceptDonation);
router.put("/:id/schedule", donationController.schedulePickup);

// ===============================
// PICKUP TEAM WORKFLOW
// ===============================
router.put("/:id/pickup-accept", donationController.acceptPickup);

router.put("/:id/arrived", donationController.arrivedAtDonor);

router.put("/:id/picked", donationController.pickupFood);

router.put("/:id/deliver", donationController.markDelivered);
// ===============================
// NGO HISTORY
// ===============================
router.get("/history/:ngoName", (req, res) => {
  const { ngoName } = req.params;

  const db = require("../config/db");
const sql = `
  SELECT 
    nh.id,
    nh.donation_id,
    nh.action,
    nh.action_time,
    d.food_name,
    d.quantity,
    d.donor_address,
    d.priority,
    d.accepted_at
  FROM ngo_history nh
  JOIN donations d ON nh.donation_id = d.id
  WHERE nh.ngo_name = ?
  ORDER BY nh.id DESC
`;
  db.query(sql, [ngoName], (err, result) => {
    if (err) {
      console.log("History error:", err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

module.exports = router;