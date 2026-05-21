const db = require("../config/db");

/**
 * Send notification to user(s) via Socket.io and Database
 */
exports.notifyUser = (io, userId, role, eventType, data = {}) => {
  const notificationData = {
    user_id: userId,
    event_type: eventType,
    donation_id: data.donation_id || null,
    title: data.title || getEventTitle(eventType),
    message: data.message || getEventMessage(eventType, data),
    read_status: 0
  };

  // Save to database
  db.query(
    `INSERT INTO notifications 
     (user_id, event_type, donation_id, title, message, read_status, created_at) 
     VALUES (?, ?, ?, ?, ?, 0, NOW())`,
    [
      notificationData.user_id,
      notificationData.event_type,
      notificationData.donation_id,
      notificationData.title,
      notificationData.message
    ],
    (err) => {
      if (err) console.error("Notification DB Error:", err);
    }
  );

  // Send via Socket.io
  io.to(userId.toString()).emit("notification", {
    type: eventType,
    title: notificationData.title,
    message: notificationData.message,
    donation_id: data.donation_id,
    timestamp: new Date().toISOString()
  });
};

/**
 * Broadcast to role (e.g., all NGOs, all pickup teams)
 */
exports.notifyRole = (io, role, eventType, data = {}) => {
  const broadcastData = {
    type: eventType,
    title: getEventTitle(eventType),
    message: getEventMessage(eventType, data),
    donation_id: data.donation_id,
    timestamp: new Date().toISOString()
  };

  io.to(role).emit("notification", broadcastData);

  // Save broadcast notification to database (generic)
  db.query(
    `INSERT INTO notifications 
     (event_type, donation_id, title, message, created_at) 
     VALUES (?, ?, ?, ?, NOW())`,
    [
      eventType,
      data.donation_id || null,
      broadcastData.title,
      broadcastData.message
    ],
    (err) => {
      if (err) console.error("Broadcast Notification DB Error:", err);
    }
  );
};

/**
 * Get user notifications (unread count & recent)
 */
exports.getUserNotifications = (userId, limit = 10) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, event_type, title, message, donation_id, read_status, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    db.query(sql, [userId, limit], (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
};

/**
 * Mark notification as read
 */
exports.markAsRead = (notificationId) => {
  db.query(
    `UPDATE notifications SET read_status = 1 WHERE id = ?`,
    [notificationId],
    (err) => {
      if (err) console.error("Error marking notification as read:", err);
    }
  );
};

/**
 * Get event title based on event type
 */
function getEventTitle(eventType) {
  const titles = {
    DONATION_POSTED: "🍱 New Food Donation",
    DONATION_ACCEPTED: "✅ Donation Accepted!",
    PICKUP_ASSIGNED: "🚚 Pickup Assigned",
    PICKUP_ARRIVED: "🚗 Pickup Team Arrived",
    PICKUP_COMPLETED: "✨ Delivery Complete!",
    DONATION_EXPIRED: "⏰ Donation Expired"
  };
  return titles[eventType] || "📢 Notification";
}

/**
 * Get event message based on event type and data
 */
function getEventMessage(eventType, data) {
  const messages = {
    DONATION_POSTED: `New donation: ${data.food_name || "Food"} (${data.quantity || "qty"})`,
    DONATION_ACCEPTED: `${data.ngo_name || "NGO"} accepted your donation of ${data.food_name || "food"}`,
    PICKUP_ASSIGNED: `Pickup team assigned for your donation`,
    PICKUP_ARRIVED: `Pickup team is here to collect your donation`,
    PICKUP_COMPLETED: `Your donation was successfully delivered!`,
    DONATION_EXPIRED: `Your donation has expired and is no longer available`
  };
  return messages[eventType] || data.message || "You have a new notification";
}

/**
 * Log donation event for audit trail
 */
exports.logDonationEvent = (donationId, eventType, actorRole, actorId, details = {}) => {
  db.query(
    `INSERT INTO donation_events 
     (donation_id, event_type, actor_role, actor_id, details, created_at) 
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [donationId, eventType, actorRole, actorId, JSON.stringify(details)],
    (err) => {
      if (err) console.error("Event Log Error:", err);
    }
  );
};
