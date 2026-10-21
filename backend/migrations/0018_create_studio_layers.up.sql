CREATE TABLE IF NOT EXISTS studio_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Layer',
    x INT NOT NULL DEFAULT 0,
    y INT NOT NULL DEFAULT 0,
    width INT NOT NULL,
    height INT NOT NULL,
    z_index INT NOT NULL DEFAULT 0,
    background_color VARCHAR(30) NOT NULL DEFAULT 'transparent',
    opacity FLOAT NOT NULL DEFAULT 1.0,
    overlay_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    overlay_opacity FLOAT NOT NULL DEFAULT 0.0,
    border_radius INT NOT NULL DEFAULT 0,
    border_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    border_width INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layers_layout ON studio_layers(layout_id);
