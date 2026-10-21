CREATE TABLE IF NOT EXISTS iam_role_group_roles (
    role_group_id UUID NOT NULL REFERENCES iam_role_groups(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES iam_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_group_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_rgr_group ON iam_role_group_roles(role_group_id);
CREATE INDEX IF NOT EXISTS idx_rgr_role ON iam_role_group_roles(role_id);
