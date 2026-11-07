CREATE TABLE IF NOT EXISTS components_queue_sectors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    default_prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    ticket_label VARCHAR(50) NOT NULL DEFAULT 'Nomor Antrian',
    counter_label VARCHAR(50) NOT NULL DEFAULT 'Loket',
    tts_template_call TEXT NOT NULL,
    tts_template_recall TEXT NOT NULL,
    tts_template_break TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'users',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
