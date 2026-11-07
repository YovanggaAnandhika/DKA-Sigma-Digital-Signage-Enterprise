CREATE TABLE IF NOT EXISTS components_queue_audios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    sound_type VARCHAR(50) NOT NULL DEFAULT 'chime',
    file_url TEXT NOT NULL,
    media_item_id UUID REFERENCES studio_media_items(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_audios_corp ON components_queue_audios(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_audios_branch ON components_queue_audios(branch_id);
CREATE INDEX IF NOT EXISTS idx_queue_audios_display ON components_queue_audios(queue_display_id);
