import { useState, useEffect, useRef } from "react";
import { fetchNotifications, markNotificationAsRead, formatNotificationTime, getNotificationIcon, getNotificationColor } from "../utils/notificationManager";

function NotificationBell({ socket }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef();

  // Load notifications on mount and refresh every 30 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      setNotifications((prev) => [
        {
          id: Math.random(),
          event_type: data.type || "GENERIC",
          title: data.title,
          message: data.message,
          donation_id: data.donation_id,
          read_status: 0,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification", handleNewNotification);
    return () => socket.off("notification", handleNewNotification);
  }, [socket]);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.read_status).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read_status) {
      markNotificationAsRead(notification.id);
      notification.read_status = 1;
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleClick = () => setOpen(!open);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  return (
    <div
      ref={bellRef}
      style={{
        position: "fixed",
        top: "25px",
        left: "260px",
        zIndex: 9999
      }}
    >
      {/* 🔔 ICON */}
      <div
        onClick={handleClick}
        style={{
          cursor: "pointer",
          position: "relative"
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "10px",
            borderRadius: "50%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
          }}
        >
          <span style={{ fontSize: "26px" }}>🔔</span>
        </div>

        {/* 🔴 UNREAD COUNT BADGE */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "#F44336",
              color: "#fff",
              borderRadius: "50%",
              fontSize: "12px",
              padding: "2px 6px",
              fontWeight: "bold",
              minWidth: "20px",
              textAlign: "center"
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {/* 📥 NOTIFICATION DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: 0,
            width: "360px",
            maxHeight: "500px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            padding: "12px",
            overflowY: "auto"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              paddingBottom: "10px",
              borderBottom: "1px solid #eee"
            }}
          >
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>🔔 Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={loadNotifications}
                style={{
                  border: "none",
                  background: "none",
                  color: "#5f72ff",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p
              style={{
                fontSize: "13px",
                color: "#999",
                textAlign: "center",
                padding: "20px"
              }}
            >
              No notifications yet
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  padding: "12px",
                  borderLeft: `4px solid ${getNotificationColor(notif.event_type)}`,
                  background: notif.read_status ? "#fafafa" : "#f0f7ff",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px"
                  }}
                >
                  <span style={{ fontSize: "18px" }}>
                    {getNotificationIcon(notif.event_type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "13px",
                        color: "#333"
                      }}
                    >
                      {notif.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "4px",
                        lineHeight: "1.4"
                      }}
                    >
                      {notif.message}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#999",
                        marginTop: "6px"
                      }}
                    >
                      {formatNotificationTime(notif.created_at)}
                    </div>
                  </div>
                  {!notif.read_status && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#5f72ff",
                        marginTop: "4px",
                        flexShrink: 0
                      }}
                    ></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;