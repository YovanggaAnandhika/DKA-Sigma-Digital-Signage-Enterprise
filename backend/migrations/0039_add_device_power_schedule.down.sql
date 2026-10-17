ALTER TABLE devices
DROP COLUMN IF EXISTS sleep_time,
DROP COLUMN IF EXISTS wake_time,
DROP COLUMN IF EXISTS power_schedule_enabled;
