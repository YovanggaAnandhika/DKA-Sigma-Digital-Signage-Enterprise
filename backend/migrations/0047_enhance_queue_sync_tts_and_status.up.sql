-- 0047_enhance_queue_sync_tts_and_status.up.sql

-- Tambah kolom sektor, label, dan template naskah TTS ke queue_displays
ALTER TABLE queue_displays
ADD COLUMN IF NOT EXISTS sector_type VARCHAR(50) NOT NULL DEFAULT 'HOSPITAL',
ADD COLUMN IF NOT EXISTS ticket_label VARCHAR(100) NOT NULL DEFAULT 'Nomor Antrian',
ADD COLUMN IF NOT EXISTS counter_label VARCHAR(100) NOT NULL DEFAULT 'Loket',
ADD COLUMN IF NOT EXISTS tts_template_call TEXT NOT NULL DEFAULT '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
ADD COLUMN IF NOT EXISTS tts_template_recall TEXT NOT NULL DEFAULT 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
ADD COLUMN IF NOT EXISTS tts_template_break TEXT NOT NULL DEFAULT '{counter_label} {counter_name} sedang istirahat',
ADD COLUMN IF NOT EXISTS current_sequence INT NOT NULL DEFAULT 0;

-- Tambah kolom status dan status_note ke queue_counters
ALTER TABLE queue_counters
ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS status_note VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_queue_counters_status ON queue_counters(queue_display_id, status);
