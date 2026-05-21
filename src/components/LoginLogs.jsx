import { useEffect, useState } from "react";
import api from "../api";

function LoginLogs() {

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/admin/login-logs").then(res => {
      setLogs(res.data);
    });
  }, []);

  const getColor = (status) => {
    return status === "SUCCESS" ? "#2e7d32" : "#e53935";
  };

  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "15px",
      marginTop: "20px"
    }}>

      <h3>🔐 Login Activity</h3>

      {logs.length === 0 && <p>No logs found</p>}

      {logs.map((log, i) => (
        <div key={i} style={{
          borderBottom: "1px solid #eee",
          padding: "10px"
        }}>

          {/* STATUS */}
          <span style={{
            background: getColor(log.status),
            color: "white",
            padding: "4px 10px",
            borderRadius: "10px",
            fontSize: "12px",
            marginRight: "10px"
          }}>
            {log.status}
          </span>

          {/* EMAIL */}
          <strong>{log.email}</strong>

          <br />

          {/* MESSAGE */}
          <span style={{ color: "#555" }}>
            {log.message}
          </span>

          <br />

          {/* TIME */}
          <small style={{ color: "#999" }}>
            {new Date(log.login_time).toLocaleString()}
          </small>

        </div>
      ))}

    </div>
  );
}

export default LoginLogs;