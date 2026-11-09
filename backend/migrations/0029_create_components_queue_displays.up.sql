CREATE TABLE IF NOT EXISTS components_queue_displays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    canvas_width INT NOT NULL DEFAULT 1920,
    canvas_height INT NOT NULL DEFAULT 1080,
    background_color VARCHAR(30) NOT NULL DEFAULT 'transparent',
    background_image_url TEXT,
    theme_preset VARCHAR(50) NOT NULL DEFAULT 'clean-light',
    auto_recall_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    opacity DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    overlay_color VARCHAR(30) NOT NULL DEFAULT 'transparent',
    overlay_opacity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    sector_type VARCHAR(50) NOT NULL DEFAULT 'HOSPITAL',
    ticket_label VARCHAR(50) NOT NULL DEFAULT 'Nomor Antrian',
    counter_label VARCHAR(50) NOT NULL DEFAULT 'Loket',
    tts_template_call TEXT,
    tts_template_recall TEXT,
    tts_template_break TEXT,
    current_sequence INT NOT NULL DEFAULT 0,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_displays_corp ON components_queue_displays(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_displays_branch ON components_queue_displays(branch_id);
