CREATE TABLE IF NOT EXISTS queue_layout_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_display_id UUID NOT NULL REFERENCES queue_displays(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    x INT NOT NULL DEFAULT 0,
    y INT NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 400,
    height INT NOT NULL DEFAULT 200,
    z_index INT NOT NULL DEFAULT 1,
    background_color VARCHAR(50) DEFAULT 'transparent',
    text_color VARCHAR(50) DEFAULT '#0f172a',
    font_size INT DEFAULT 24,
    font_weight VARCHAR(20) DEFAULT 'bold',
    text_align VARCHAR(20) DEFAULT 'center',
    template_content TEXT NOT NULL DEFAULT '',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    opacity FLOAT NOT NULL DEFAULT 1.0,
    border_radius INT NOT NULL DEFAULT 0,
    border_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    border_width INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_layout_items_parent ON queue_layout_items(queue_display_id, z_index ASC);
