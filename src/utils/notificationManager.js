import api from "../api";

/**
 * Fetch user notifications
 */
export const fetchNotifications = async () => {
  try {
    const res = await api.get("/notifications", {
      headers: { Authorization: "Bearer " + sessionStorage.getItem("token") }
    });
    return res.data || [];
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await api.put(`/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: "Bearer " + sessionStorage.getItem("token") }
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
  }
};

/**
 * Get notification icon/emoji based on event type
 */
export const getNotificationIcon = (eventType) => {
  const icons = {
    DONATION_POSTED: "🍱",
    DONATION_ACCEPTED: "✅",
    PICKUP_ASSIGNED: "🚗",
    PICKUP_ARRIVED: "📍",
    PICKUP_COMPLETED: "✨",
    DONATION_EXPIRED: "⏰"
  };
  return icons[eventType] || "📢";
};

/**
 * Get color for notification type
 */
export const getNotificationColor = (eventType) => {
  const colors = {
    DONATION_POSTED: "#4CAF50",
    DONATION_ACCEPTED: "#2196F3",
    PICKUP_ASSIGNED: "#FF9800",
    PICKUP_ARRIVED: "#9C27B0",
    PICKUP_COMPLETED: "#4CAF50",
    DONATION_EXPIRED: "#F44336"
  };
  return colors[eventType] || "#666";
};

/**
 * Format notification timestamp
 */
export const formatNotificationTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

/**
 * Group notifications by date
 */
export const groupNotificationsByDate = (notifications) => {
  const grouped = {};

  notifications.forEach((notif) => {
    const date = new Date(notif.created_at).toLocaleDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(notif);
  });

  return grouped;
};

/**
 * Filter notifications by type
 */
export const filterNotifications = (notifications, eventType) => {
  if (!eventType) return notifications;
  return notifications.filter((n) => n.event_type === eventType);
};

/**
 * Get unread notification count
 */
export const getUnreadCount = (notifications) => {
  return notifications.filter((n) => !n.read_status).length;
};
