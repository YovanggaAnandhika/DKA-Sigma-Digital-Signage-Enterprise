CREATE TABLE IF NOT EXISTS studio_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    resolution_id UUID REFERENCES common_resolutions(id) ON DELETE SET NULL,
    orientation_id UUID REFERENCES common_orientations(id) ON DELETE SET NULL,
    canvas_width INT NOT NULL DEFAULT 1920,
    canvas_height INT NOT NULL DEFAULT 1080,
    background_color VARCHAR(30) DEFAULT '#000000',
    background_image_url TEXT,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layouts_corp ON studio_layouts(corporation_id);
CREATE INDEX IF NOT EXISTS idx_layouts_branch ON studio_layouts(branch_id);
CREATE INDEX IF NOT EXISTS idx_layouts_resolution ON studio_layouts(resolution_id);
CREATE INDEX IF NOT EXISTS idx_layouts_orientation ON studio_layouts(orientation_id);
