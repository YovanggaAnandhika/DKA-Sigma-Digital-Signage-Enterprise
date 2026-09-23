CREATE TABLE IF NOT EXISTS layer_playlist_item_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_block_id UUID NOT NULL REFERENCES layer_blocks(id) ON DELETE CASCADE,
    playlist_item_id UUID NOT NULL REFERENCES playlist_items(id) ON DELETE CASCADE,
    is_muted BOOLEAN DEFAULT false,
    volume_level INT DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(layer_block_id, playlist_item_id)
);

CREATE INDEX IF NOT EXISTS idx_lpio_block ON layer_playlist_item_overrides(layer_block_id);
CREATE INDEX IF NOT EXISTS idx_lpio_item ON layer_playlist_item_overrides(playlist_item_id);
