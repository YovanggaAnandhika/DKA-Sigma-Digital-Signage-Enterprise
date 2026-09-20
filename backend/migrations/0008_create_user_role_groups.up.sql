CREATE TABLE IF NOT EXISTS user_role_groups (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_group_id UUID NOT NULL REFERENCES roles_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_group_id)
);

CREATE INDEX IF NOT EXISTS idx_user_role_groups_user ON user_role_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_groups_group ON user_role_groups(role_group_id);
