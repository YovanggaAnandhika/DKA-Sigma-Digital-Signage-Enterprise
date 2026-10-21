CREATE TABLE IF NOT EXISTS studio_layout_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
    version_hash VARCHAR(64) NOT NULL,
    snapshot_json JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layout_history_layout_id ON studio_layout_history(layout_id);
CREATE INDEX IF NOT EXISTS idx_layout_history_created_at ON studio_layout_history(created_at DESC);
