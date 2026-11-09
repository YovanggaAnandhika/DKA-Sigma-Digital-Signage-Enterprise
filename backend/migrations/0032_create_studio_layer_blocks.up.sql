CREATE TABLE IF NOT EXISTS studio_layer_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    layer_id UUID NOT NULL REFERENCES studio_layers(id) ON DELETE CASCADE,
    start_time_seconds INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 10,
    playlist_id UUID REFERENCES studio_playlists(id) ON DELETE SET NULL,
    media_item_id UUID REFERENCES studio_media_items(id) ON DELETE SET NULL,
    ticker_id UUID REFERENCES components_tickers(id) ON DELETE SET NULL,
    clock_id UUID REFERENCES components_clocks(id) ON DELETE SET NULL,
    webview_id UUID REFERENCES components_webviews(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES components_queue_displays(id) ON DELETE SET NULL,
    album_id UUID REFERENCES components_albums(id) ON DELETE SET NULL,
    trim_start_seconds INT DEFAULT 0,
    trim_end_seconds INT,
    transition_id UUID,
    visual_filter_id UUID,
    order_index INT NOT NULL DEFAULT 0,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    volume_level INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layer_blocks_corp ON studio_layer_blocks(corporation_id);
CREATE INDEX IF NOT EXISTS idx_layer_blocks_layer ON studio_layer_blocks(layer_id);
CREATE INDEX IF NOT EXISTS idx_layer_blocks_playlist ON studio_layer_blocks(playlist_id);
