CREATE TABLE IF NOT EXISTS studio_media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 10,
    width INT,
    height INT,
    sha256_hash VARCHAR(64) NOT NULL,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_corp ON studio_media_items(corporation_id);
CREATE INDEX IF NOT EXISTS idx_media_branch ON studio_media_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_media_hash ON studio_media_items(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_media_type ON studio_media_items(file_type);
