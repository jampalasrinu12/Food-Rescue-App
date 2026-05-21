-- Add user_id column to donations table if it doesn't exist
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'donations' AND COLUMN_NAME = 'user_id') = 0,
  'ALTER TABLE donations ADD COLUMN user_id INT NOT NULL AFTER id',
  'SELECT "Column user_id already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if it doesn't exist
SET @fk_sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'donations' AND CONSTRAINT_NAME = 'fk_donations_user_id') = 0,
  'ALTER TABLE donations ADD CONSTRAINT fk_donations_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "Foreign key already exists"'
));
PREPARE fk_stmt FROM @fk_sql;
EXECUTE fk_stmt;
DEALLOCATE PREPARE fk_stmt;

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  donation_updates BOOLEAN DEFAULT TRUE,
  pickup_reminders BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_settings (user_id)
);