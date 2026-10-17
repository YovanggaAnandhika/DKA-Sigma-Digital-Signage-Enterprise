-- Migration: Add sleep and wake time scheduling to devices table for CEC display power management
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS sleep_time TIME,
ADD COLUMN IF NOT EXISTS wake_time TIME,
ADD COLUMN IF NOT EXISTS power_schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE;
