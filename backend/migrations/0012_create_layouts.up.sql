CREATE TABLE IF NOT EXISTS layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    resolution_id UUID REFERENCES resolutions(id) ON DELETE SET NULL,
    orientation_id UUID NOT NULL REFERENCES orientations(id),
    canvas_width INT NOT NULL DEFAULT 1920,
    canvas_height INT NOT NULL DEFAULT 1080,
    background_color VARCHAR(30) NOT NULL DEFAULT '#000000',
    background_image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layouts_resolution_id ON layouts(resolution_id);
CREATE INDEX IF NOT EXISTS idx_layouts_orientation_id ON layouts(orientation_id);
