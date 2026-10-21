CREATE TABLE IF NOT EXISTS components_queue_displays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    canvas_width INT NOT NULL DEFAULT 1920,
    canvas_height INT NOT NULL DEFAULT 1080,
    background_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    background_image_url TEXT,
    theme_preset VARCHAR(50) NOT NULL DEFAULT 'clean-light',
    auto_recall_enabled BOOLEAN NOT NULL DEFAULT false,
    opacity FLOAT NOT NULL DEFAULT 1.0,
    overlay_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    overlay_opacity FLOAT NOT NULL DEFAULT 0.0,
    sector_type VARCHAR(50) NOT NULL DEFAULT 'HOSPITAL',
    ticket_label VARCHAR(100) NOT NULL DEFAULT 'Nomor Antrian',
    counter_label VARCHAR(100) NOT NULL DEFAULT 'Loket',
    tts_template_call TEXT NOT NULL DEFAULT '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    tts_template_recall TEXT NOT NULL DEFAULT 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    tts_template_break TEXT NOT NULL DEFAULT '{counter_label} {counter_name} sedang istirahat',
    current_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_displays_created ON components_queue_displays(created_at DESC);
