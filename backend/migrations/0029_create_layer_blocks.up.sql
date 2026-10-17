CREATE TABLE IF NOT EXISTS layer_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    ticker_id UUID REFERENCES tickers(id) ON DELETE CASCADE,
    clock_id UUID REFERENCES clocks(id) ON DELETE CASCADE,
    webview_id UUID REFERENCES webviews(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES queue_displays(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    start_time_seconds INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 10,
    trim_start_seconds INT NOT NULL DEFAULT 0,
    trim_end_seconds INT,
    transition_id UUID REFERENCES transitions(id) ON DELETE SET NULL,
    visual_filter_id UUID REFERENCES visual_filters(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_lb_layer ON layer_blocks(layer_id);
CREATE INDEX IF NOT EXISTS idx_lb_playlist ON layer_blocks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_lb_media ON layer_blocks(media_item_id);
CREATE INDEX IF NOT EXISTS idx_lb_ticker ON layer_blocks(ticker_id);
CREATE INDEX IF NOT EXISTS idx_lb_clock ON layer_blocks(clock_id);
CREATE INDEX IF NOT EXISTS idx_lb_webview ON layer_blocks(webview_id);
CREATE INDEX IF NOT EXISTS idx_lb_queue ON layer_blocks(queue_id);
CREATE INDEX IF NOT EXISTS idx_lb_album ON layer_blocks(album_id);
CREATE INDEX IF NOT EXISTS idx_lb_order ON layer_blocks(layer_id, order_index);
