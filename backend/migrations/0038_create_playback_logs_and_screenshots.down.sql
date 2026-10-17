-- Revert Migration 0038: Proof of Play, Device Screenshots, and Schedule Campaign Dates

DROP TABLE IF EXISTS playback_logs CASCADE;
DROP TABLE IF EXISTS device_screenshots CASCADE;

ALTER TABLE schedule_events 
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date;
