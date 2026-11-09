CREATE TABLE IF NOT EXISTS components_webviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    url TEXT NOT NULL,
    refresh_interval_seconds INT NOT NULL DEFAULT 60,
    zoom_scale INT NOT NULL DEFAULT 100,
    bypass_cache BOOLEAN NOT NULL DEFAULT TRUE,
    orientation VARCHAR(20) NOT NULL DEFAULT 'landscape',
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webviews_corp ON components_webviews(corporation_id);
CREATE INDEX IF NOT EXISTS idx_webviews_branch ON components_webviews(branch_id);
