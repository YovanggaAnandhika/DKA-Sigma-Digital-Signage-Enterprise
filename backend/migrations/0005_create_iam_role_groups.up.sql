CREATE TABLE IF NOT EXISTS iam_role_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    created_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_groups_corp_slug UNIQUE (corporation_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_role_groups_corp ON iam_role_groups(corporation_id);
CREATE INDEX IF NOT EXISTS idx_role_groups_slug ON iam_role_groups(slug);
