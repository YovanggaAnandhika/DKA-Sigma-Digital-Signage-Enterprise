CREATE TABLE IF NOT EXISTS components_live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    stream_mode VARCHAR(30) NOT NULL DEFAULT 'EXTERNAL_EMBED',
    source_type VARCHAR(30) NOT NULL DEFAULT 'HLS',
    source_url TEXT NOT NULL,
    server_hls_endpoint VARCHAR(500) NOT NULL DEFAULT '',
    is_relay_active BOOLEAN NOT NULL DEFAULT FALSE,
    auto_reconnect BOOLEAN NOT NULL DEFAULT TRUE,
    low_latency_mode BOOLEAN NOT NULL DEFAULT TRUE,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    poster_image_url VARCHAR(500) NOT NULL DEFAULT '',
    requires_auth BOOLEAN NOT NULL DEFAULT FALSE,
    ingest_username VARCHAR(100) NOT NULL DEFAULT '',
    ingest_password VARCHAR(100) NOT NULL DEFAULT '',
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_corp ON components_live_streams(corporation_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_branch ON components_live_streams(branch_id);

