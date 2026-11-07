CREATE TABLE IF NOT EXISTS components_clocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
    clock_format VARCHAR(20) NOT NULL DEFAULT '24h',
    show_seconds BOOLEAN NOT NULL DEFAULT TRUE,
    show_date BOOLEAN NOT NULL DEFAULT TRUE,
    date_format VARCHAR(50) NOT NULL DEFAULT 'dddd, D MMMM YYYY',
    font_family VARCHAR(100) NOT NULL DEFAULT 'Inter',
    font_size INT NOT NULL DEFAULT 48,
    text_color VARCHAR(30) NOT NULL DEFAULT '#ffffff',
    background_color VARCHAR(30) NOT NULL DEFAULT 'transparent',
    weather_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    weather_city VARCHAR(100),
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clocks_corp ON components_clocks(corporation_id);
CREATE INDEX IF NOT EXISTS idx_clocks_branch ON components_clocks(branch_id);
