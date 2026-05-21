const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();
const upload = multer();

// 🔥 Forward image to Python AI server
router.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("file", req.file.buffer, "image.jpg");

    const response = await axios.post(
      "http://localhost:8000/analyze",
      formData,
      { headers: formData.getHeaders() }
    );

    res.json(response.data);

  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ error: "AI server error" });
  }
});

module.exports = router;
