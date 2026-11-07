CREATE TABLE IF NOT EXISTS system_corporations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active_until TIMESTAMPTZ,
    max_screens INT NOT NULL DEFAULT 10,
    max_branches INT NOT NULL DEFAULT 5,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'standard',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corporations_slug ON system_corporations(slug);
CREATE INDEX IF NOT EXISTS idx_corporations_active ON system_corporations(is_active);
