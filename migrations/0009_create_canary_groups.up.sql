CREATE TABLE IF NOT EXISTS canary_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rollout_percentage INT NOT NULL DEFAULT 10 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    target_layout_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canary_groups_active ON canary_groups(is_active);
