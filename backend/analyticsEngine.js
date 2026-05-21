const db = require("./config/db");

function runAnalytics() {
  console.log("📊 Running automated analytics...");

  // 1️⃣ Spoiled food count
  db.query(
    "SELECT COUNT(*) AS spoiled FROM donations WHERE pickup_time IS NOT NULL AND expiry_time IS NOT NULL AND pickup_time > expiry_time",
    (err, result) => {
      if (!err && result.length > 0) {
        const spoiled = result[0].spoiled || 0;
        db.query(
          "INSERT INTO analytics_results (metric_name, metric_value) VALUES (?, ?)",
          ["spoiled_food_count", spoiled]
        );
      }
    }
  );

  // 2️⃣ Average pickup delay
  db.query(
    "SELECT AVG(TIMESTAMPDIFF(MINUTE, accepted_at, pickup_time)) AS avg_delay FROM donations WHERE pickup_status='COMPLETED'",
    (err, result) => {
      if (!err && result.length > 0 && result[0].avg_delay !== null) {
        db.query(
          "INSERT INTO analytics_results (metric_name, metric_value) VALUES (?, ?)",
          ["avg_pickup_delay_minutes", result[0].avg_delay]
        );
      }
    }
  );

  // 3️⃣ NGO response time
  db.query(
    "SELECT ngo_name, AVG(TIMESTAMPDIFF(MINUTE, created_at, accepted_at)) AS avg_response FROM donations WHERE ngo_name IS NOT NULL GROUP BY ngo_name",
    (err, result) => {
      if (!err && result.length > 0) {
        result.forEach((row) => {
          db.query(
            "INSERT INTO analytics_results (metric_name, metric_value) VALUES (?, ?)",
            [`avg_response_${row.ngo_name}`, row.avg_response]
          );
        });
      }
    }
  );
}

// ▶ Run once at server start
runAnalytics();

// 🔁 Run every 10 minutes
setInterval(runAnalytics, 10 * 60 * 1000);

module.exports = runAnalytics;
