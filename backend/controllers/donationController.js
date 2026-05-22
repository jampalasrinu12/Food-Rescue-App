const db = require("../config/db");
const notifyService = require("../utils/notificationService");
const { haversineDistance } = require("../utils/distance");

/* 🔥 ADD DONATION — SMART + IMAGE + AUTO HISTORY + ADDRESS */
exports.addDonation = (req, res) => {
const {
  food_name,
  quantity,
  prepared_time,
  expiry_time,
  donor_lat,
  donor_lng,
  donor_address,
  phone
} = req.body;

const user_id = req.user.id;

// 🔥 Image now comes from multer
const food_image = req.file ? req.file.filename : null;

  // 🔹 Smart priority logic
  const now = new Date();
  const expiry = new Date(expiry_time);
  const diffHours = (expiry - now) / (1000 * 60 * 60);

  let priority = "LOW";
  if (diffHours <= 4) priority = "HIGH";
  else if (diffHours <= 8) priority = "MEDIUM";

  const sql = `
    INSERT INTO donations
    (user_id, food_name, quantity, prepared_time, expiry_time, priority,
     donor_lat, donor_lng, donor_address, status, food_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?)
  `;

  db.query(
    sql,
    [
      user_id,
      food_name,
      quantity,
      prepared_time,
      expiry_time,
      priority,
      donor_lat,
      donor_lng,
      donor_address,
      food_image
    ],
    (err, result) => {
      if (err) {
        console.error("DB Insert Error:", err);
        return res.status(500).json({ message: "Database insert failed" });
      }

      const donationId = result.insertId;

      // 🔥 AUTO SAVE LOCATION INTO PROFILE (FINAL VERSION)
      const city = donor_address?.split(",").pop()?.trim() || "";

      db.query(
        "SELECT id FROM profile WHERE user_id=?",
        [user_id],
        (errCheck, rows) => {

    if (rows && rows.length > 0) {

      // 🔁 UPDATE PROFILE
      db.query(
        `UPDATE profile 
         SET lat=?, lng=?, street=?, city=? 
         WHERE user_id=?`,
        [donor_lat, donor_lng, donor_address, city, user_id],
        (err3) => {
          if (err3) console.log("❌ Profile update error:", err3);
          else console.log("✅ Profile updated");
        }
      );

    } else {

      // ➕ CREATE PROFILE
      db.query(
        `INSERT INTO profile (user_id, lat, lng, street, city)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, donor_lat, donor_lng, donor_address, city],
        (err4) => {
          if (err4) console.log("❌ Profile insert error:", err4);
          else console.log("✅ Profile created");
        }
      );

    }
  }
);
      const io = req.app.get("io");
      const ngoMessage = "🍱 New donation available";

      notifyService.notifyRole(io, "ngo", "DONATION_POSTED", {
        donation_id: donationId,
        food_name,
        quantity,
        message: ngoMessage
      });

      notifyService.notifyRole(io, "receiver", "DONATION_POSTED", {
        donation_id: donationId,
        food_name,
        quantity,
        message: ngoMessage
      });

// 💚 Donor ki thank you message
const messages = [
  "🙏 Thank you! You helped someone ❤️",
  "🌍 You saved food from waste!",
  "💚 Great job donor!",
];

const msg = messages[Math.floor(Math.random() * messages.length)];

      notifyService.notifyUser(io, user_id, "DONATION_POSTED", {
        donation_id: donationId,
        title: "Thank you for donating!",
        message: msg
      });

      // history insert
db.query(
  `INSERT INTO donation_history 
   (donation_id, action, new_status, remarks, food_image)
   VALUES (?, 'POSTED', 'available', 'Donation created', ?)`,
  [donationId, food_image],
  (err2) => {
    if (err2) console.error("History Insert Error:", err2);
  }
);

// response
res.json({
  message: "Donation added successfully",
  donation_id: donationId,
  priority
});
    }
  );
};


/* 🔥 GET ALL DONATIONS */
exports.getAllDonations = (req, res) => {
  db.query(
    "SELECT * FROM donations ORDER BY created_at DESC",
    (err, result) => {
      if (err) {
        console.error("Fetch Error:", err);
        return res.status(500).json({ message: "Failed to fetch donations" });
      }
      res.json(result);
    }
  );
};


/* 🔥 GET USER DONATIONS */
exports.getUserDonations = (req, res) => {
  const user_id = req.user.id;

  db.query(
    "SELECT * FROM donations WHERE user_id=? ORDER BY created_at DESC",
    [user_id],
    (err, result) => {
      if (err) {
        console.error("Fetch User Donations Error:", err);
        return res.status(500).json({ message: "Failed to fetch user donations" });
      }
      res.json(result);
    }
  );
};

/* 🔥 GET AVAILABLE DONATIONS */
exports.getAvailableDonations = (req, res) => {
  db.query(
    "SELECT * FROM donations WHERE status='available' ORDER BY priority DESC, created_at ASC",
    (err, result) => {
      if (err) {
        console.error("Fetch Available Error:", err);
        return res.status(500).json({ message: "Failed to fetch available donations" });
      }
      res.json(result);
    }
  );
};


/* 🔥 ACCEPT DONATION */
exports.acceptDonation = (req, res) => {
  const { ngo_name } = req.body;
  const { id } = req.params;

  const sql = `
    UPDATE donations 
    SET status='requested', ngo_name=?, accepted_at=NOW() 
    WHERE id=? AND status='available'
  `;

  db.query(sql, [ngo_name, id], (err, result) => {
    if (err) {
      console.error("Accept Error:", err);
      return res.status(500).json({ message: "Accept failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Donation already accepted or not available" });
    }

    // 🔥 AUTO ASSIGN NEAREST PICKUP TEAM
    db.query("SELECT donor_lat, donor_lng FROM donations WHERE id=?", [id], (errLoc, locRows) => {
      if (!errLoc && locRows.length > 0) {

        const donorLat = locRows[0].donor_lat;
        const donorLng = locRows[0].donor_lng;

        db.query("SELECT id, lat, lng FROM users WHERE role='pickup' AND active=TRUE", (errPickup, pickupTeams) => {
          if (!errPickup && pickupTeams.length > 0) {

            let nearestTeam = null;
            let minDistance = Infinity;

            pickupTeams.forEach(team => {
              const distance = Math.sqrt(
                Math.pow(team.lat - donorLat, 2) +
                Math.pow(team.lng - donorLng, 2)
              );

              if (distance < minDistance) {
                minDistance = distance;
                nearestTeam = team;
              }
            });

            db.query(
              `UPDATE donations 
               SET pickup_team_id=?, pickup_status='ASSIGNED'
               WHERE id=?`,
              [nearestTeam.id, id]
            );
          }
        });
      }
    });

    db.query("SELECT food_image FROM donations WHERE id=?", [id], (err2, rows) => {
      if (rows && rows.length > 0) {

        const image = rows[0].food_image;

        db.query(
          `INSERT INTO donation_history 
           (donation_id, action, old_status, new_status, remarks, food_image)
           VALUES (?, 'ACCEPTED', 'available', 'requested', ?, ?)`,
          [id, ngo_name, image]
        );

        db.query(
          `INSERT INTO ngo_history 
           (ngo_name, donation_id, action)
           VALUES (?, ?, 'ACCEPTED')`,
          [ngo_name, id]
        );
      }
const io = req.app.get("io");

notifyService.notifyRole(io, "pickup", "PICKUP_ASSIGNED", {
  donation_id: id,
  message: "📦 Pickup assigned"
});

notifyService.notifyRole(io, "admin", "PICKUP_ASSIGNED", {
  donation_id: id,
  message: "📦 Donation accepted and pickup assigned"
});
      res.json({ message: "Donation accepted successfully" });
    });
  });
};


/* 🔥 SCHEDULE PICKUP — FIXED ENUM */
exports.schedulePickup = (req, res) => {
  const { pickup_time } = req.body;
  const { id } = req.params;

  const sql = `
    UPDATE donations
    SET pickup_time=?, pickup_status='ACCEPTED'
WHERE id=? AND pickup_status='ASSIGNED'
  `;

  db.query(sql, [pickup_time, id], (err, result) => {
    if (err) {
      console.error("Schedule Error:", err);
      return res.status(500).json({ message: "Pickup scheduling failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Pickup can only be scheduled for ASSIGNED donations"
      });
    }

    db.query(
      `INSERT INTO pickup_history 
       (donation_id, pickup_time, status)
       VALUES (?, ?, 'ACCEPTED')`,
      [id, pickup_time]
    );
    db.query(
      `INSERT INTO donation_history 
       (donation_id, action, new_status, remarks)
       VALUES (?, 'SCHEDULED', 'pickup_scheduled', ?)`,
      [id, pickup_time]
    );
    const io = req.app.get("io");

    notifyService.notifyRole(io, "pickup", "PICKUP_ASSIGNED", {
      donation_id: id,
      message: "🚚 Pickup scheduled"
    });

    res.json({ message: "Pickup scheduled successfully" });
  });
};



/* 🔥 MARK AS DELIVERED */
exports.markDelivered = (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE donations
    SET pickup_status='DELIVERED', status='donated'
    WHERE id=? AND pickup_status='PICKED'
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Delivery Error:", err);
      return res.status(500).json({ message: "Delivery update failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Food must be PICKED before delivery"
      });
    }
      db.query(
        `INSERT INTO donation_history 
         (donation_id, action, new_status)
         VALUES (?, 'DELIVERED', 'donated')`,
        [id]
      );
      const io = req.app.get("io");

      notifyService.notifyRole(io, "donor", "PICKUP_COMPLETED", {
        donation_id: id,
        message: "🎉 Food delivered successfully"
      });

      res.json({ message: "Food delivered successfully" });
  });
};
/* 🔥 DELETE DONATION — ADMIN */
exports.deleteDonation = (req, res) => {

  const { id } = req.params;

  console.log("DELETE API HIT:", id);

  const queries = [

    "DELETE FROM donation_history WHERE donation_id=?",
    "DELETE FROM pickup_history WHERE donation_id=?",
    "DELETE FROM ngo_history WHERE donation_id=?",
    "DELETE FROM pickup_tracking WHERE donation_id=?",
    "DELETE FROM location_history WHERE donation_id=?",
    "DELETE FROM alerts WHERE donation_id=?",
    "DELETE FROM analytics_results WHERE donation_id=?",
    "DELETE FROM recommendation_log WHERE donation_id=?"

  ];

  let completed = 0;

  queries.forEach((q) => {

    db.query(q, [id], (err) => {

      if (err) {
        console.error("Delete relation error:", err);
      }

      completed++;

      if (completed === queries.length) {

        db.query("DELETE FROM donations WHERE id=?", [id], (err2, result) => {

          if (err2) {
            console.error("Main delete error:", err2);
            return res.status(500).json({ message: "Delete failed" });
          }

          res.json({
            message: "Donation deleted permanently"
          });

        });

      }

    });

  });

};
/* 🚚 PICKUP TEAM ACCEPT ORDER */
exports.acceptPickup = (req, res) => {

  const { id } = req.params;

  const sql = `
  UPDATE donations
  SET pickup_status='ACCEPTED'
  WHERE id=? AND pickup_status='ASSIGNED'
  `;

  db.query(sql,[id],(err,result)=>{

    if(err){
      console.error(err);
      return res.status(500).json({message:"Pickup accept failed"});
    }

    if(result.affectedRows === 0){
      return res.status(400).json({message:"Order already accepted"});
    }
db.query(
  `INSERT INTO donation_history 
   (donation_id, action, new_status)
   VALUES (?, 'PICKUP_ACCEPTED', 'accepted')`,
  [id]
);
const io = req.app.get("io");

notifyService.notifyRole(io, "ngo", "PICKUP_ACCEPTED", {
  donation_id: id,
  message: "📦 Pickup accepted by team"
});
notifyService.notifyRole(io, "receiver", "PICKUP_ACCEPTED", {
  donation_id: id,
  message: "📦 Pickup accepted by team"
});

    res.json({message:"Pickup order accepted"});
  });

};

/* 📍 PICKUP TEAM ARRIVED AT DONOR */
exports.arrivedAtDonor = (req,res)=>{

  const { id } = req.params;

  const sql = `
  UPDATE donations
  SET pickup_status='ARRIVED'
  WHERE id=? AND pickup_status='ACCEPTED'
  `;

  db.query(sql,[id],(err,result)=>{

    if(err){
      console.error(err);
      return res.status(500).json({message:"Arrival update failed"});
    }

    if(result.affectedRows === 0){
      return res.status(400).json({
        message:"Pickup must be ACCEPTED before ARRIVED"
      });
    }
db.query(
  `INSERT INTO donation_history 
   (donation_id, action, new_status)
   VALUES (?, 'ARRIVED', 'arrived')`,
  [id]
);
const io = req.app.get("io");

notifyService.notifyRole(io, "donor", "PICKUP_ARRIVED", {
  donation_id: id,
  message: "📍 Pickup team arrived"
});


    res.json({message:"Pickup team arrived at donor"});
  });

};


/* 📦 PICKUP FOOD FROM DONOR */
exports.pickupFood = (req,res)=>{

  const { id } = req.params;

  const sql = `
  UPDATE donations
  SET pickup_status='PICKED'
  WHERE id=? AND pickup_status='ARRIVED'
  `;

  db.query(sql,[id],(err,result)=>{

    if(err){
      console.error(err);
      return res.status(500).json({message:"Pickup failed"});
    }
db.query(
  `INSERT INTO donation_history 
   (donation_id, action, new_status)
   VALUES (?, 'PICKED', 'picked')`,
  [id]
);
const io = req.app.get("io");

notifyService.notifyRole(io, "ngo", "PICKUP_IN_PROGRESS", {
  donation_id: id,
  message: "🍱 Food picked"
});
notifyService.notifyRole(io, "receiver", "PICKUP_IN_PROGRESS", {
  donation_id: id,
  message: "🍱 Food picked"
});

    res.json({message:"Food picked successfully"});
  });

};