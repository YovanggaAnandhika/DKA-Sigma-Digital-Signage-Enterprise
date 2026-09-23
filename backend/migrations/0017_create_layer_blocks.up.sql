CREATE TABLE IF NOT EXISTS layer_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    start_time_seconds INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 10,
    transition_type VARCHAR(50),
    order_index INT NOT NULL DEFAULT 0,
    is_muted BOOLEAN NOT NULL DEFAULT false,
    volume_level INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_block_content CHECK (
        (playlist_id IS NOT NULL AND media_item_id IS NULL) OR 
        (playlist_id IS NULL AND media_item_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_lb_layer ON layer_blocks(layer_id);
CREATE INDEX IF NOT EXISTS idx_lb_playlist ON layer_blocks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_lb_media ON layer_blocks(media_item_id);
CREATE INDEX IF NOT EXISTS idx_lb_order ON layer_blocks(layer_id, order_index);
