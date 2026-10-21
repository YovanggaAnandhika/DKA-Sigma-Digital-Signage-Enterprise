CREATE TABLE IF NOT EXISTS device_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    input_output JSONB NOT NULL DEFAULT '{}'::jsonb,
    assets_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks timeseries untuk agregasi dan chart
CREATE INDEX IF NOT EXISTS idx_device_analytics_device_time 
    ON device_analytics (device_id, recorded_at DESC);

-- GIN Indexes untuk query pencarian fleksibel di dalam JSONB
CREATE INDEX IF NOT EXISTS idx_device_analytics_io 
    ON device_analytics USING GIN (input_output);

CREATE INDEX IF NOT EXISTS idx_device_analytics_assets 
    ON device_analytics USING GIN (assets_stats);
