ALTER TABLE hardware_devices
ADD COLUMN assigned_layout_manifest JSONB,
ADD COLUMN assigned_layout_version_hash VARCHAR(64);
