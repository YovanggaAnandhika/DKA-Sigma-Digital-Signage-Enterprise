CREATE TABLE IF NOT EXISTS visual_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brightness INT NOT NULL DEFAULT 100,
    contrast INT NOT NULL DEFAULT 100,
    saturation INT NOT NULL DEFAULT 100,
    hue_rotate INT NOT NULL DEFAULT 0,
    blur_px INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
