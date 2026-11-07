CREATE TABLE IF NOT EXISTS iam_role_permissions (
    role_id UUID NOT NULL REFERENCES iam_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES iam_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON iam_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON iam_role_permissions(permission_id);
