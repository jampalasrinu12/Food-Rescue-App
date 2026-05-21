import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Notification({ message, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    // 🔔 Navigate to notifications page
    navigate("/notifications");

    // 🔥 Close popup immediately
    if (onClose) onClose();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: "linear-gradient(135deg, #075E54, #128C7E)",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "12px",
        cursor: "pointer",
        minWidth: "260px",
        maxWidth: "320px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        animation: "slideIn 0.3s ease"
      }}
    >
      {/* ICON */}
      <div style={{
        background: "#25D366",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px"
      }}>
        💬
      </div>

      {/* MESSAGE */}
      <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
        {typeof message === "string" ? message : message?.message}
      </div>
    </div>
  );
}

export default Notification;