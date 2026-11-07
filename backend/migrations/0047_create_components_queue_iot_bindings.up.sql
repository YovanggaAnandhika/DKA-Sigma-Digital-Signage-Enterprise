CREATE TABLE IF NOT EXISTS components_queue_iot_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    queue_counter_id UUID NOT NULL REFERENCES components_queue_counters(id) ON DELETE CASCADE,
    iot_device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (queue_counter_id, iot_device_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_iot_corp ON components_queue_iot_bindings(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_iot_counter ON components_queue_iot_bindings(queue_counter_id);
CREATE INDEX IF NOT EXISTS idx_queue_iot_device ON components_queue_iot_bindings(iot_device_id);
