CREATE TABLE IF NOT EXISTS components_queue_layout_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    x INT NOT NULL DEFAULT 0,
    y INT NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 200,
    height INT NOT NULL DEFAULT 100,
    z_index INT NOT NULL DEFAULT 1,
    background_color VARCHAR(30) DEFAULT 'transparent',
    text_color VARCHAR(30) DEFAULT '#ffffff',
    font_size INT DEFAULT 24,
    font_weight VARCHAR(20) DEFAULT 'normal',
    text_align VARCHAR(20) DEFAULT 'left',
    template_content TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    opacity NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    border_radius INT NOT NULL DEFAULT 0,
    border_color VARCHAR(30) NOT NULL DEFAULT 'transparent',
    border_width INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_items_corp ON components_queue_layout_items(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_display ON components_queue_layout_items(queue_display_id);
