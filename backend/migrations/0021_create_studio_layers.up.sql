CREATE TABLE IF NOT EXISTS studio_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    x INT NOT NULL DEFAULT 0,
    y INT NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 1920,
    height INT NOT NULL DEFAULT 1080,
    z_index INT NOT NULL DEFAULT 1,
    background_color VARCHAR(30) DEFAULT 'transparent',
    opacity DOUBLE PRECISION DEFAULT 1.0,
    overlay_color VARCHAR(30) DEFAULT 'transparent',
    overlay_opacity DOUBLE PRECISION DEFAULT 0.0,
    border_radius INT DEFAULT 0,
    border_color VARCHAR(30) DEFAULT 'transparent',
    border_width INT DEFAULT 0,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layers_corp ON studio_layers(corporation_id);
CREATE INDEX IF NOT EXISTS idx_layers_layout ON studio_layers(layout_id);
CREATE INDEX IF NOT EXISTS idx_layers_z_index ON studio_layers(z_index);
