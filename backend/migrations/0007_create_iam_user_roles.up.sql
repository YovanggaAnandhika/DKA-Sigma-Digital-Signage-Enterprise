CREATE TABLE IF NOT EXISTS iam_user_roles (
    user_id UUID NOT NULL REFERENCES iam_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES iam_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON iam_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON iam_user_roles(role_id);
