CREATE TABLE IF NOT EXISTS hardware_device_pairings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    pairing_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    device_token VARCHAR(255),
    expires_at TIMESTAMPTZ,
    approved_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    paired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_pairings_corp ON hardware_device_pairings(corporation_id);
CREATE INDEX IF NOT EXISTS idx_pairings_code ON hardware_device_pairings(pairing_code);
CREATE INDEX IF NOT EXISTS idx_pairings_device ON hardware_device_pairings(device_id);
CREATE INDEX IF NOT EXISTS idx_pairings_status ON hardware_device_pairings(status);
