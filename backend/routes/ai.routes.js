const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();
const upload = multer();

// 🔥 Forward image to Python AI server
router.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const {
      food_name,
      prepared_time,
      cooked_time,
      expiry_time,
      donor_lat,
      donor_lng,
      street
    } = req.body;

    const aiServerUrl = process.env.AI_SERVER_URL || "http://127.0.0.1:8000/analyze-food";

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: "food.jpg",
      contentType: req.file.mimetype
    });

    formData.append("food_name", food_name || "");
    formData.append("prepared_time", prepared_time || cooked_time || "");
    formData.append("expiry_time", expiry_time || "");
    formData.append("donor_lat", donor_lat || "");
    formData.append("donor_lng", donor_lng || "");
    formData.append("street", street || "");

    const response = await axios.post(aiServerUrl, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    const data = response.data || {};
    const payload = {
      status: "success",
      ...data,
      final_freshness: data.final_freshness || data.freshness || null
    };

    res.json(payload);
  } catch (err) {
    console.error("AI Error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI server error", details: err.response?.data || err.message });
  }
});

module.exports = router;
