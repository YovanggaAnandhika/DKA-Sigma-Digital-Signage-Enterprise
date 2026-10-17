CREATE TABLE IF NOT EXISTS orientations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    value VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO orientations (name, value) VALUES
    ('Landscape', 'landscape'),
    ('Portrait', 'portrait')
ON CONFLICT (value) DO NOTHING;
