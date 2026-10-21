CREATE TABLE IF NOT EXISTS hardware_device_pairings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    pairing_code VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paired', 'rejected', 'expired'
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    approved_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    paired_at TIMESTAMPTZ,
    device_token VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_pairings_device ON hardware_device_pairings(device_id);
CREATE INDEX IF NOT EXISTS idx_device_pairings_code_status ON hardware_device_pairings(pairing_code, status);
CREATE INDEX IF NOT EXISTS idx_device_pairings_expires ON hardware_device_pairings(expires_at);
