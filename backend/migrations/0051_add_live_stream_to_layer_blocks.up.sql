ALTER TABLE studio_layer_blocks
ADD COLUMN IF NOT EXISTS live_stream_id UUID REFERENCES components_live_streams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_layer_blocks_live_stream ON studio_layer_blocks(live_stream_id);

