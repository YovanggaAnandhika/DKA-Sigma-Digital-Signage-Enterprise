CREATE TABLE IF NOT EXISTS roles_groups_roles (
    role_group_id UUID NOT NULL REFERENCES roles_groups(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_group_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_rgr_group ON roles_groups_roles(role_group_id);
CREATE INDEX IF NOT EXISTS idx_rgr_role ON roles_groups_roles(role_id);
