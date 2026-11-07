CREATE TABLE IF NOT EXISTS components_queue_displays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    current_number INT NOT NULL DEFAULT 0,
    counter_name VARCHAR(50) DEFAULT 'Loket 1',
    theme_preset VARCHAR(50) NOT NULL DEFAULT 'standard',
    audio_chime_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    chime_sound VARCHAR(50) NOT NULL DEFAULT 'bell',
    voice_speed NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    canvas_width INT NOT NULL DEFAULT 1920,
    canvas_height INT NOT NULL DEFAULT 1080,
    background_color VARCHAR(30) NOT NULL DEFAULT '#0f172a',
    tts_template_call TEXT,
    tts_template_recall TEXT,
    tts_template_break TEXT,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_displays_corp ON components_queue_displays(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_displays_branch ON components_queue_displays(branch_id);
