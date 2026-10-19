-- 0047_enhance_queue_sync_tts_and_status.down.sql

DROP INDEX IF EXISTS idx_queue_counters_status;

ALTER TABLE queue_counters
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS status_note;

ALTER TABLE queue_displays
DROP COLUMN IF EXISTS sector_type,
DROP COLUMN IF EXISTS ticket_label,
DROP COLUMN IF EXISTS counter_label,
DROP COLUMN IF EXISTS tts_template_call,
DROP COLUMN IF EXISTS tts_template_recall,
DROP COLUMN IF EXISTS tts_template_break,
DROP COLUMN IF EXISTS current_sequence;
