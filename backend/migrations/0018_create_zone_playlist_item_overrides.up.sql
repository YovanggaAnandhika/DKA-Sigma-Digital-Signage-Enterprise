CREATE TABLE IF NOT EXISTS zone_playlist_item_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_block_id UUID NOT NULL REFERENCES zone_blocks(id) ON DELETE CASCADE,
    playlist_item_id UUID NOT NULL REFERENCES playlist_items(id) ON DELETE CASCADE,
    is_muted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(zone_block_id, playlist_item_id)
);

CREATE INDEX IF NOT EXISTS idx_zpio_block ON zone_playlist_item_overrides(zone_block_id);
CREATE INDEX IF NOT EXISTS idx_zpio_item ON zone_playlist_item_overrides(playlist_item_id);
