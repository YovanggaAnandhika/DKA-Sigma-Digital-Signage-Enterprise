-- 0043_add_opacity_and_overlay_styling.down.sql

ALTER TABLE queue_layout_items
    DROP COLUMN IF EXISTS border_width,
    DROP COLUMN IF EXISTS border_color,
    DROP COLUMN IF EXISTS border_radius,
    DROP COLUMN IF EXISTS opacity;

ALTER TABLE layers
    DROP COLUMN IF EXISTS border_width,
    DROP COLUMN IF EXISTS border_color,
    DROP COLUMN IF EXISTS border_radius,
    DROP COLUMN IF EXISTS overlay_opacity,
    DROP COLUMN IF EXISTS overlay_color,
    DROP COLUMN IF EXISTS opacity;

ALTER TABLE queue_displays
    DROP COLUMN IF EXISTS overlay_opacity,
    DROP COLUMN IF EXISTS overlay_color,
    DROP COLUMN IF EXISTS opacity;
