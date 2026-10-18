-- 0042_add_visual_styling_columns.up.sql

-- 1. Tickers styling columns
ALTER TABLE tickers
    ADD COLUMN IF NOT EXISTS background_color VARCHAR(50) NOT NULL DEFAULT '#1e3a8a',
    ADD COLUMN IF NOT EXISTS text_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
    ADD COLUMN IF NOT EXISTS badge_background_color VARCHAR(50) NOT NULL DEFAULT '#2563eb',
    ADD COLUMN IF NOT EXISTS badge_text_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
    ADD COLUMN IF NOT EXISTS border_color VARCHAR(50) NOT NULL DEFAULT '#60a5fa',
    ADD COLUMN IF NOT EXISTS border_radius INT NOT NULL DEFAULT 8;

-- 2. Clocks styling columns
ALTER TABLE clocks
    ADD COLUMN IF NOT EXISTS background_color VARCHAR(50) NOT NULL DEFAULT '#0f172a',
    ADD COLUMN IF NOT EXISTS text_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
    ADD COLUMN IF NOT EXISTS subtitle_color VARCHAR(50) NOT NULL DEFAULT '#94a3b8',
    ADD COLUMN IF NOT EXISTS border_color VARCHAR(50) NOT NULL DEFAULT '#1e3a8a',
    ADD COLUMN IF NOT EXISTS border_radius INT NOT NULL DEFAULT 12,
    ADD COLUMN IF NOT EXISTS time_font_size INT NOT NULL DEFAULT 52,
    ADD COLUMN IF NOT EXISTS date_font_size INT NOT NULL DEFAULT 14;

-- 3. Seed exact Queue Layout Items for default queue display
INSERT INTO queue_layout_items (
    id, queue_display_id, item_type, name, x, y, width, height, z_index,
    background_color, text_color, font_size, font_weight, text_align,
    template_content, config, is_visible
)
VALUES
    (
        '11111111-1111-1111-1111-111111111101',
        '76a3e570-9807-40a5-ad74-e7bb28e382dc',
        'text_label',
        'Judul Antrian',
        60, 60, 1800, 70, 1,
        'transparent', '#10b981', 36, '800', 'center',
        '$queue_name$', '{}'::jsonb, true
    ),
    (
        '11111111-1111-1111-1111-111111111102',
        '76a3e570-9807-40a5-ad74-e7bb28e382dc',
        'ticket_number',
        'Nomor Antrian Panggilan',
        360, 190, 1200, 440, 2,
        'transparent', '#10b981', 150, '900', 'center',
        '$queue_number$', '{"pulseOnCall": true}'::jsonb, true
    ),
    (
        '11111111-1111-1111-1111-111111111103',
        '76a3e570-9807-40a5-ad74-e7bb28e382dc',
        'counter_loket',
        'Label Loket',
        710, 680, 500, 90, 3,
        '#059669', '#ffffff', 32, '800', 'center',
        '$queue_counter$', '{"borderRadius": 14, "badge": "LOKET TUJUAN"}'::jsonb, true
    ),
    (
        '11111111-1111-1111-1111-111111111104',
        '76a3e570-9807-40a5-ad74-e7bb28e382dc',
        'marquee',
        'Running Text Footer',
        0, 990, 1920, 90, 4,
        '#064e3b', '#ffffff', 24, 'bold', 'left',
        'PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil. Terima kasih.',
        '{"speed": "normal", "direction": "left", "badge": "INFORMASI", "badgeColor": "#10b981"}'::jsonb, true
    )
ON CONFLICT (id) DO UPDATE SET
    x = EXCLUDED.x,
    y = EXCLUDED.y,
    width = EXCLUDED.width,
    height = EXCLUDED.height,
    background_color = EXCLUDED.background_color,
    text_color = EXCLUDED.text_color,
    font_size = EXCLUDED.font_size,
    template_content = EXCLUDED.template_content,
    config = EXCLUDED.config;
