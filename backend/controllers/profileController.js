const db = require("../config/db");

/* =====================================================
   🔹 GET PROFILE (AUTO FILL FROM USERS + PROFILE)
===================================================== */
exports.getProfile = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT 
      p.*, 
      u.name AS user_name,
      u.phone AS user_phone,
      u.email
    FROM users u
    LEFT JOIN profile p ON u.id = p.user_id
    WHERE u.id = ?
    LIMIT 1
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error("❌ GET PROFILE ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!result.length) {
      return res.json(null);
    }

    const data = result[0];

    // 🔥 AUTO MERGE (users + profile)
    const profile = {
      name: data.name || data.user_name,
      phone: data.phone || data.user_phone,
      email: data.email,

      house: data.house || "",
      street: data.street || "",
      landmark: data.landmark || "",
      city: data.city || "",
      state: data.state || "",
      pincode: data.pincode || "",

      lat: data.lat || null,
      lng: data.lng || null
    };

    res.json(profile);
  });
};


/* =====================================================
   🔹 SAVE / UPDATE PROFILE (WITH LOCATION)
===================================================== */
exports.saveProfile = (req, res) => {
  const user_id = req.user.id;

  const {
    name,
    phone,
    house,
    street,
    landmark,
    city,
    state,
    pincode,
    lat,
    lng
  } = req.body;

  /* =========================
     🔒 VALIDATION
  ========================= */
  if (!name || !phone) {
    return res.status(400).json({
      message: "Name and phone are required"
    });
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({
      message: "Phone must be 10 digits"
    });
  }

  /* =========================
     CHECK PROFILE EXISTS
  ========================= */
  db.query(
    "SELECT id FROM profile WHERE user_id = ? LIMIT 1",
    [user_id],
    (err, result) => {
      if (err) {
        console.error("❌ PROFILE CHECK ERROR:", err);
        return res.status(500).json({ message: "Server error" });
      }

      /* =====================
         🔁 UPDATE PROFILE
      ===================== */
      if (result.length > 0) {
        const updateSql = `
          UPDATE profile 
          SET 
            name=?, phone=?, house=?, street=?, landmark=?, 
            city=?, state=?, pincode=?, lat=?, lng=? 
          WHERE user_id=?
        `;

        db.query(
          updateSql,
          [
            name,
            phone,
            house,
            street,
            landmark,
            city,
            state,
            pincode,
            lat || null,
            lng || null,
            user_id
          ],
          (err2) => {
            if (err2) {
              console.error("❌ UPDATE ERROR:", err2);
              return res.status(500).json({
                message: "Failed to update profile"
              });
            }

            return res.json({
              message: "✅ Profile updated successfully"
            });
          }
        );
      }

      /* =====================
         ➕ INSERT PROFILE
      ===================== */
      else {
        const insertSql = `
          INSERT INTO profile 
          (user_id, name, phone, house, street, landmark, city, state, pincode, lat, lng)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [
            user_id,
            name,
            phone,
            house,
            street,
            landmark,
            city,
            state,
            pincode,
            lat || null,
            lng || null
          ],
          (err2) => {
            if (err2) {
              console.error("❌ INSERT ERROR:", err2);
              return res.status(500).json({
                message: "Failed to save profile"
              });
            }

            return res.json({
              message: "✅ Profile created successfully"
            });
          }
        );
      }
    }
  );
};

/* =====================================================
   🔹 SAVE NOTIFICATION SETTINGS
===================================================== */
exports.saveNotificationSettings = (req, res) => {
  const user_id = req.user.id;

  const { email, sms, push } = req.body;

  // Check if settings exist
  db.query(
    "SELECT id FROM notification_settings WHERE user_id = ? LIMIT 1",
    [user_id],
    (err, result) => {
      if (err) {
        console.error("❌ NOTIFICATION SETTINGS CHECK ERROR:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.length > 0) {
        // Update existing settings
        const updateSql = `
          UPDATE notification_settings
          SET email_notifications=?, sms_notifications=?, push_notifications=?, updated_at=NOW()
          WHERE user_id=?
        `;

        db.query(
          updateSql,
          [email ? 1 : 0, sms ? 1 : 0, push ? 1 : 0, user_id],
          (err2) => {
            if (err2) {
              console.error("❌ UPDATE NOTIFICATION SETTINGS ERROR:", err2);
              return res.status(500).json({ message: "Failed to update settings" });
            }

            return res.json({ message: "✅ Notification settings updated" });
          }
        );
      } else {
        // Insert new settings
        const insertSql = `
          INSERT INTO notification_settings (user_id, email_notifications, sms_notifications, push_notifications)
          VALUES (?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [user_id, email ? 1 : 0, sms ? 1 : 0, push ? 1 : 0],
          (err2) => {
            if (err2) {
              console.error("❌ INSERT NOTIFICATION SETTINGS ERROR:", err2);
              return res.status(500).json({ message: "Failed to save settings" });
            }

            return res.json({ message: "✅ Notification settings saved" });
          }
        );
      }
    }
  );
};

/* =====================================================
   🔹 GET NOTIFICATION SETTINGS
===================================================== */
exports.getNotificationSettings = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT email_notifications AS email, sms_notifications AS sms, push_notifications AS push
    FROM notification_settings
    WHERE user_id = ?
    LIMIT 1
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error("❌ GET NOTIFICATION SETTINGS ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!result.length) {
      return res.json({ email: true, sms: false, push: true }); // Default settings
    }

    const settings = result[0];
    res.json({
      email: settings.email === 1,
      sms: settings.sms === 1,
      push: settings.push === 1
    });
  });
};