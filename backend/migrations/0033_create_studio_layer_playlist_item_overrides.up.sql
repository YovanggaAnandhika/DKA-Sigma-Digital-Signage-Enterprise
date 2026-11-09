CREATE TABLE IF NOT EXISTS studio_layer_playlist_item_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    layer_block_id UUID NOT NULL REFERENCES studio_layer_blocks(id) ON DELETE CASCADE,
    playlist_item_id UUID NOT NULL REFERENCES studio_playlist_items(id) ON DELETE CASCADE,
    duration_seconds INT,
    trim_start_seconds INT,
    trim_end_seconds INT,
    transition_id UUID,
    visual_filter_id UUID,
    is_muted BOOLEAN,
    volume_level INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (layer_block_id, playlist_item_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_item_overrides_corp ON studio_layer_playlist_item_overrides(corporation_id);
CREATE INDEX IF NOT EXISTS idx_lp_item_overrides_block ON studio_layer_playlist_item_overrides(layer_block_id);
