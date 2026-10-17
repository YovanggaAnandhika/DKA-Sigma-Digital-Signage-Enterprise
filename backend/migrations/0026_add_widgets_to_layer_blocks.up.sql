-- Up Migration: Add ticker_id and clock_id to layer_blocks
ALTER TABLE layer_blocks 
    ADD COLUMN IF NOT EXISTS ticker_id UUID REFERENCES tickers(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS clock_id UUID REFERENCES clocks(id) ON DELETE CASCADE;

-- Update constraint to allow exactly one of playlist, media, ticker, or clock
ALTER TABLE layer_blocks DROP CONSTRAINT IF EXISTS chk_block_content;
ALTER TABLE layer_blocks ADD CONSTRAINT chk_block_content CHECK (
    (playlist_id IS NOT NULL)::int + 
    (media_item_id IS NOT NULL)::int + 
    (ticker_id IS NOT NULL)::int + 
    (clock_id IS NOT NULL)::int = 1
);

CREATE INDEX IF NOT EXISTS idx_lb_ticker ON layer_blocks(ticker_id);
CREATE INDEX IF NOT EXISTS idx_lb_clock ON layer_blocks(clock_id);
