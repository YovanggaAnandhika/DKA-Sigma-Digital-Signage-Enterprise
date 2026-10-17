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

-- Insert some default visual filter templates
INSERT INTO visual_filters (name, brightness, contrast, saturation, hue_rotate, blur_px) VALUES
('Normal', 100, 100, 100, 0, 0),
('Cinematic', 95, 120, 85, 0, 0),
('Vintage', 110, 90, 70, 30, 0),
('Black & White', 100, 110, 0, 0, 0),
('Vivid', 105, 115, 130, 0, 0),
('Cool Blue', 100, 105, 95, 210, 0),
('Warm Sunrise', 105, 105, 110, 20, 0),
('Blurred Background', 80, 100, 100, 0, 10)
ON CONFLICT DO NOTHING;
