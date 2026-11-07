CREATE TABLE IF NOT EXISTS system_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_corp_code UNIQUE (corporation_id, code)
);

CREATE INDEX IF NOT EXISTS idx_branches_corp ON system_branches(corporation_id);
CREATE INDEX IF NOT EXISTS idx_branches_code ON system_branches(code);
