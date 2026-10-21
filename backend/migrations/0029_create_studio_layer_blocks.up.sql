CREATE TABLE IF NOT EXISTS studio_layer_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_id UUID NOT NULL REFERENCES studio_layers(id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES studio_playlists(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES studio_media_items(id) ON DELETE CASCADE,
    ticker_id UUID REFERENCES components_tickers(id) ON DELETE CASCADE,
    clock_id UUID REFERENCES components_clocks(id) ON DELETE CASCADE,
    webview_id UUID REFERENCES components_webviews(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    album_id UUID REFERENCES components_albums(id) ON DELETE CASCADE,
    start_time_seconds INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 10,
    trim_start_seconds INT NOT NULL DEFAULT 0,
    trim_end_seconds INT,
    transition_id UUID REFERENCES studio_transitions(id) ON DELETE SET NULL,
    visual_filter_id UUID REFERENCES studio_visual_filters(id) ON DELETE SET NULL,
    order_index INT NOT NULL DEFAULT 0,
    is_muted BOOLEAN NOT NULL DEFAULT false,
    volume_level INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_block_content CHECK (
        (playlist_id IS NOT NULL)::int + 
        (media_item_id IS NOT NULL)::int + 
        (ticker_id IS NOT NULL)::int + 
        (clock_id IS NOT NULL)::int +
        (webview_id IS NOT NULL)::int +
        (queue_id IS NOT NULL)::int +
        (album_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_lb_layer ON studio_layer_blocks(layer_id);
CREATE INDEX IF NOT EXISTS idx_lb_playlist ON studio_layer_blocks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_lb_media ON studio_layer_blocks(media_item_id);
CREATE INDEX IF NOT EXISTS idx_lb_ticker ON studio_layer_blocks(ticker_id);
CREATE INDEX IF NOT EXISTS idx_lb_clock ON studio_layer_blocks(clock_id);
CREATE INDEX IF NOT EXISTS idx_lb_webview ON studio_layer_blocks(webview_id);
CREATE INDEX IF NOT EXISTS idx_lb_queue ON studio_layer_blocks(queue_id);
CREATE INDEX IF NOT EXISTS idx_lb_album ON studio_layer_blocks(album_id);
CREATE INDEX IF NOT EXISTS idx_lb_order ON studio_layer_blocks(layer_id, order_index);
