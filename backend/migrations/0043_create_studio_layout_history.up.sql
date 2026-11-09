CREATE TABLE IF NOT EXISTS studio_layout_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
    version_hash VARCHAR(64) NOT NULL,
    snapshot_json JSONB NOT NULL,
    description TEXT,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layout_hist_corp ON studio_layout_history(corporation_id);
CREATE INDEX IF NOT EXISTS idx_layout_hist_layout ON studio_layout_history(layout_id);
CREATE INDEX IF NOT EXISTS idx_layout_hist_hash ON studio_layout_history(version_hash);
