CREATE TABLE IF NOT EXISTS transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    css_class VARCHAR(255) NOT NULL,
    duration_ms INT NOT NULL DEFAULT 500,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert some default transitions
INSERT INTO transitions (name, css_class, duration_ms) VALUES
('Crossfade', 'transition-crossfade', 500),
('Slide Left', 'transition-slide-left', 800),
('Slide Right', 'transition-slide-right', 800),
('Slide Up', 'transition-slide-up', 800),
('Slide Down', 'transition-slide-down', 800),
('Wipe Left', 'transition-wipe-left', 600),
('Wipe Right', 'transition-wipe-right', 600)
ON CONFLICT DO NOTHING;
