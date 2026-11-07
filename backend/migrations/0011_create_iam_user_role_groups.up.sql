CREATE TABLE IF NOT EXISTS iam_user_role_groups (
    user_id UUID NOT NULL REFERENCES iam_users(id) ON DELETE CASCADE,
    role_group_id UUID NOT NULL REFERENCES iam_role_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_group_id)
);

CREATE INDEX IF NOT EXISTS idx_urg_user ON iam_user_role_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_urg_group ON iam_user_role_groups(role_group_id);
