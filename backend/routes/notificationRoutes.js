const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middleware/auth");

/**
 * Get user notifications
 * GET /api/notifications?limit=20
 */
router.get("/", auth, notificationController.getUserNotifications);

/**
 * Get unread count
 * GET /api/notifications/unread/count
 */
router.get("/unread/count", auth, notificationController.getUnreadCount);

/**
 * Get notifications by type
 * GET /api/notifications/type/:event_type
 */
router.get("/type/:event_type", auth, notificationController.getNotificationsByType);

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
router.put("/:id/read", auth, notificationController.markAsRead);

/**
 * Mark all as read
 * PUT /api/notifications/read/all
 */
router.put("/read/all", auth, notificationController.markAllAsRead);

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete("/:id", auth, notificationController.deleteNotification);

/**
 * Clear all notifications
 * DELETE /api/notifications/clear/all
 */
router.delete("/clear/all", auth, notificationController.clearAllNotifications);

module.exports = router;
