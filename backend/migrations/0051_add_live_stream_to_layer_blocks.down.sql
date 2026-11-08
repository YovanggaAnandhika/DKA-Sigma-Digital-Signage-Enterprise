DROP INDEX IF EXISTS idx_layer_blocks_live_stream;
ALTER TABLE studio_layer_blocks DROP COLUMN IF EXISTS live_stream_id;

