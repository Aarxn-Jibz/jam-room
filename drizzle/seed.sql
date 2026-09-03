-- Local development data for Jamroom. This is deliberately idempotent.
INSERT OR IGNORE INTO booking_policies (id, name, booking_horizon_days, min_booking_duration_minutes, max_booking_duration_minutes, booking_interval_minutes, active)
VALUES ('default-policy-uuid-0000-0000-000000000000', 'Default Policy', 7, 30, 180, 30, 1);

INSERT OR IGNORE INTO system_settings (id, booking_release_day, booking_release_time, default_policy_id)
VALUES ('system-settings-singleton', 6, '13:30', 'default-policy-uuid-0000-0000-000000000000');

INSERT OR IGNORE INTO rooms (id, name, number, created_at, active, policy_id)
VALUES
  ('00000000-0000-4000-b000-000000000001', 'Main Room', 1, 1700000000000, 1, 'default-policy-uuid-0000-0000-000000000000'),
  ('00000000-0000-4000-b000-000000000002', 'Acoustic Room', 2, 1700000000000, 1, 'default-policy-uuid-0000-0000-000000000000');

INSERT OR IGNORE INTO profiles (id, name, color, active, created_at)
VALUES ('00000000-0000-4000-a000-000000000001', 'University Choir', '#4F46E5', 1, 1700000000000);

INSERT OR IGNORE INTO users (id, username, email, name, password_hash, role, must_change_password, active, created_at, updated_at)
VALUES ('00000000-0000-4000-a000-000000000000', 'aaron@admin.com', 'aaron@admin.com', 'Admin', '$2b$10$u2zX8Z2mP3QXIWqhsh1/GOg5BlOSWtpyi7gI/pQYT/h5A.aSC3BYa', 'ADMIN', 0, 1, 1700000000000, 1700000000000);

INSERT OR IGNORE INTO user_profiles (user_id, profile_id)
VALUES ('00000000-0000-4000-a000-000000000000', '00000000-0000-4000-a000-000000000001');

WITH RECURSIVE
  days(day) AS (VALUES(0) UNION ALL SELECT day + 1 FROM days WHERE day < 6),
  hours(hour) AS (VALUES(9) UNION ALL SELECT hour + 1 FROM hours WHERE hour < 19)
INSERT OR IGNORE INTO operating_schedules (id, policy_id, day_of_week, start_time, end_time, enabled)
SELECT
  'default-schedule-' || day || '-' || hour,
  'default-policy-uuid-0000-0000-000000000000',
  day,
  printf('%02d:00', hour),
  printf('%02d:00', hour + 1),
  1
FROM days CROSS JOIN hours;
