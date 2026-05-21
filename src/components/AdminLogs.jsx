import { useEffect, useState } from "react";
import api from "../api";

function AdminLogs() {

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/admin/history").then(res => {
      setLogs(res.data);
    });
  }, []);

  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "15px",
      marginTop: "20px"
    }}>

      <h3>📜 System Logs</h3>

      {logs.length === 0 && <p>No logs found</p>}

      {logs.map((log, index) => (
        <div key={index} style={{
          borderBottom: "1px solid #eee",
          padding: "10px"
        }}>
          🟢 Donation #{log.donation_id} → {log.action} ({log.new_status})
          <br />
          <small>{log.created_at}</small>
        </div>
      ))}

    </div>
  );
}

export default AdminLogs;