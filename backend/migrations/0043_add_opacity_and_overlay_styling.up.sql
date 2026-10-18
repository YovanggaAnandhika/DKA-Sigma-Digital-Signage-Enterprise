-- 0043_add_opacity_and_overlay_styling.up.sql

-- 1. Tambah styling opacity dan overlay ke queue_displays
ALTER TABLE queue_displays
    ADD COLUMN IF NOT EXISTS opacity FLOAT NOT NULL DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS overlay_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    ADD COLUMN IF NOT EXISTS overlay_opacity FLOAT NOT NULL DEFAULT 0.0;

-- Ubah default background_color queue_displays menjadi transparan
ALTER TABLE queue_displays 
    ALTER COLUMN background_color SET DEFAULT 'transparent';

-- 2. Tambah styling opacity, overlay, dan border ke layers (zones)
ALTER TABLE layers
    ADD COLUMN IF NOT EXISTS opacity FLOAT NOT NULL DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS overlay_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    ADD COLUMN IF NOT EXISTS overlay_opacity FLOAT NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS border_radius INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS border_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    ADD COLUMN IF NOT EXISTS border_width INT NOT NULL DEFAULT 0;

-- 3. Tambah styling opacity dan border ke queue_layout_items
ALTER TABLE queue_layout_items
    ADD COLUMN IF NOT EXISTS opacity FLOAT NOT NULL DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS border_radius INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS border_color VARCHAR(50) NOT NULL DEFAULT 'transparent',
    ADD COLUMN IF NOT EXISTS border_width INT NOT NULL DEFAULT 0;

-- Pastikan default background_color pada queue_layout_items tetap transparan
ALTER TABLE queue_layout_items
    ALTER COLUMN background_color SET DEFAULT 'transparent';
