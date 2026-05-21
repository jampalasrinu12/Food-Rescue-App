const db = require("../config/db");

/**
 * Get notifications for logged-in user
 */
exports.getUserNotifications = (req, res) => {
  const user_id = req.user.id;
  const limit = req.query.limit || 20;

  const sql = `
    SELECT id, event_type, title, message, donation_id, read_status, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `;

  db.query(sql, [user_id, parseInt(limit)], (err, results) => {
    if (err) {
      console.error("Fetch notifications error:", err);
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }

    res.json(results || []);
  });
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ? AND read_status = 0
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Count error:", err);
      return res.status(500).json({ message: "Failed to count notifications" });
    }

    res.json({ unread_count: results[0].count });
  });
};

/**
 * Mark notification as read
 */
exports.markAsRead = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const sql = `
    UPDATE notifications
    SET read_status = 1
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [id, user_id], (err, result) => {
    if (err) {
      console.error("Mark as read error:", err);
      return res.status(500).json({ message: "Failed to mark as read" });
    }

    res.json({ message: "Notification marked as read" });
  });
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    UPDATE notifications
    SET read_status = 1
    WHERE user_id = ? AND read_status = 0
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error("Mark all as read error:", err);
      return res.status(500).json({ message: "Failed to mark notifications as read" });
    }

    res.json({ message: "All notifications marked as read", affected: result.affectedRows });
  });
};

/**
 * Delete notification
 */
exports.deleteNotification = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const sql = `
    DELETE FROM notifications
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [id, user_id], (err, result) => {
    if (err) {
      console.error("Delete notification error:", err);
      return res.status(500).json({ message: "Failed to delete notification" });
    }

    res.json({ message: "Notification deleted" });
  });
};

/**
 * Clear all notifications
 */
exports.clearAllNotifications = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    DELETE FROM notifications
    WHERE user_id = ?
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error("Clear notifications error:", err);
      return res.status(500).json({ message: "Failed to clear notifications" });
    }

    res.json({ message: "All notifications cleared", deleted: result.affectedRows });
  });
};

/**
 * Get notifications by event type
 */
exports.getNotificationsByType = (req, res) => {
  const user_id = req.user.id;
  const { event_type } = req.params;

  const sql = `
    SELECT id, event_type, title, message, donation_id, read_status, created_at
    FROM notifications
    WHERE user_id = ? AND event_type = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [user_id, event_type], (err, results) => {
    if (err) {
      console.error("Fetch by type error:", err);
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }

    res.json(results || []);
  });
};
