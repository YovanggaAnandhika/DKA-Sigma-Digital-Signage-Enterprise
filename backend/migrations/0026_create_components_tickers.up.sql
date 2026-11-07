CREATE TABLE IF NOT EXISTS components_tickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    text_content TEXT NOT NULL,
    speed VARCHAR(20) NOT NULL DEFAULT 'normal',
    direction VARCHAR(20) NOT NULL DEFAULT 'left',
    font_family VARCHAR(100) NOT NULL DEFAULT 'Inter',
    font_size INT NOT NULL DEFAULT 24,
    font_weight VARCHAR(20) NOT NULL DEFAULT 'normal',
    text_color VARCHAR(30) NOT NULL DEFAULT '#ffffff',
    background_color VARCHAR(30) NOT NULL DEFAULT '#000000',
    badge_label VARCHAR(50),
    badge_bg_color VARCHAR(30) DEFAULT '#ff0000',
    badge_text_color VARCHAR(30) DEFAULT '#ffffff',
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickers_corp ON components_tickers(corporation_id);
CREATE INDEX IF NOT EXISTS idx_tickers_branch ON components_tickers(branch_id);
