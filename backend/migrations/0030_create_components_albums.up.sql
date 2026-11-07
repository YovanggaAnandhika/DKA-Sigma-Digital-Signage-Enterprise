CREATE TABLE IF NOT EXISTS components_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    slide_duration_seconds INT NOT NULL DEFAULT 5,
    transition_effect VARCHAR(50) NOT NULL DEFAULT 'fade',
    shuffle BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_albums_corp ON components_albums(corporation_id);
CREATE INDEX IF NOT EXISTS idx_albums_branch ON components_albums(branch_id);
