-- ====================================
-- NOTIFICATION & TRACKING SCHEMA
-- ====================================

-- Notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  event_type ENUM('DONATION_POSTED', 'DONATION_ACCEPTED', 'PICKUP_ASSIGNED', 'PICKUP_ARRIVED', 'PICKUP_COMPLETED', 'DONATION_EXPIRED') NOT NULL,
  donation_id INT,
  title VARCHAR(255),
  message TEXT,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  INDEX (user_id, created_at),
  INDEX (donation_id)
);

-- Pickup location tracking (real-time)
CREATE TABLE IF NOT EXISTS pickup_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  donation_id INT NOT NULL,
  pickup_user_id INT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_to_donor DECIMAL(10, 2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (pickup_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX (donation_id, timestamp),
  INDEX (pickup_user_id)
);

-- Donation status events (audit trail)
CREATE TABLE IF NOT EXISTS donation_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  donation_id INT NOT NULL,
  event_type VARCHAR(50),
  actor_role VARCHAR(50),
  actor_id INT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  INDEX (donation_id, created_at)
);
