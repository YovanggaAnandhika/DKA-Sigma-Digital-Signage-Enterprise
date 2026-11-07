CREATE TABLE IF NOT EXISTS iam_role_group_permissions (
    role_group_id UUID NOT NULL REFERENCES iam_role_groups(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES iam_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_group_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_rgp_group ON iam_role_group_permissions(role_group_id);
CREATE INDEX IF NOT EXISTS idx_rgp_permission ON iam_role_group_permissions(permission_id);
