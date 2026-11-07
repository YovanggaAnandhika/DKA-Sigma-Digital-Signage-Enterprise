CREATE TABLE IF NOT EXISTS iam_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roles_corp_slug UNIQUE (corporation_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_roles_corp ON iam_roles(corporation_id);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON iam_roles(slug);
