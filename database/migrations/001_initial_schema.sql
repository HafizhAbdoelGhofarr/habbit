CREATE DATABASE IF NOT EXISTS habitday
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE habitday;

CREATE TABLE IF NOT EXISTS habits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'Lainnya',
  reminder_time TIME NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_habits_active_order (is_active, sort_order, id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS habit_completions (
  habit_id BIGINT UNSIGNED NOT NULL,
  completed_on DATE NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (habit_id, completed_on),
  KEY idx_habit_completions_date (completed_on),
  CONSTRAINT fk_habit_completions_habit
    FOREIGN KEY (habit_id) REFERENCES habits (id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
