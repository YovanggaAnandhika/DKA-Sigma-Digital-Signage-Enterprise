-- 0042_add_visual_styling_columns.down.sql

DELETE FROM queue_layout_items
WHERE id IN (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104'
);

ALTER TABLE clocks
    DROP COLUMN IF EXISTS background_color,
    DROP COLUMN IF EXISTS text_color,
    DROP COLUMN IF EXISTS subtitle_color,
    DROP COLUMN IF EXISTS border_color,
    DROP COLUMN IF EXISTS border_radius,
    DROP COLUMN IF EXISTS time_font_size,
    DROP COLUMN IF EXISTS date_font_size;

ALTER TABLE tickers
    DROP COLUMN IF EXISTS background_color,
    DROP COLUMN IF EXISTS text_color,
    DROP COLUMN IF EXISTS badge_background_color,
    DROP COLUMN IF EXISTS badge_text_color,
    DROP COLUMN IF EXISTS border_color,
    DROP COLUMN IF EXISTS border_radius;
