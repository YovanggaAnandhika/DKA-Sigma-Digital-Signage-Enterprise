CREATE TABLE IF NOT EXISTS common_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    aspect_ratio VARCHAR(20) NOT NULL DEFAULT '16:9',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_resolution_dimensions UNIQUE (width, height)
);
