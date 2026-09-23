CREATE TABLE IF NOT EXISTS zone_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    start_time_seconds INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 10,
    transition_type VARCHAR(50),
    order_index INT NOT NULL DEFAULT 0,
    is_muted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_block_content CHECK (
        (playlist_id IS NOT NULL AND media_item_id IS NULL) OR 
        (playlist_id IS NULL AND media_item_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_zb_zone ON zone_blocks(zone_id);
CREATE INDEX IF NOT EXISTS idx_zb_playlist ON zone_blocks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_zb_media ON zone_blocks(media_item_id);
CREATE INDEX IF NOT EXISTS idx_zb_order ON zone_blocks(zone_id, order_index);
