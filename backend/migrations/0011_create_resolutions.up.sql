CREATE TABLE IF NOT EXISTS resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    aspect_ratio VARCHAR(20) NOT NULL DEFAULT '16:9',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_resolution_dimensions UNIQUE (width, height)
);

INSERT INTO resolutions (name, width, height, aspect_ratio) VALUES
    ('Full HD (1080p)', 1920, 1080, '16:9'),
    ('4K Ultra HD (2160p)', 3840, 2160, '16:9'),
    ('HD (720p)', 1280, 720, '16:9'),
    ('Portrait Full HD (1080x1920)', 1080, 1920, '9:16'),
    ('Portrait 4K (2160x3840)', 2160, 3840, '9:16')
ON CONFLICT (width, height) DO NOTHING;
