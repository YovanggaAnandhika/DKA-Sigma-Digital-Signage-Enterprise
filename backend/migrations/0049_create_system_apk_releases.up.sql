CREATE TABLE system_apk_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_code INT NOT NULL UNIQUE,
    version_name VARCHAR(50) NOT NULL,
    apk_file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    release_notes TEXT,
    is_force_update BOOLEAN NOT NULL DEFAULT false,
    min_supported_version_code INT DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apk_releases_version_code ON system_apk_releases(version_code DESC);
CREATE INDEX idx_apk_releases_active ON system_apk_releases(is_active);

