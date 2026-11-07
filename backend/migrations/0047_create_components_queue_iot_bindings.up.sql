CREATE TABLE IF NOT EXISTS components_queue_iot_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES components_queue_counters(id) ON DELETE SET NULL,
    iot_device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    ticket_prefix VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (iot_device_id, queue_display_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_iot_corp ON components_queue_iot_bindings(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_iot_display ON components_queue_iot_bindings(queue_display_id);
CREATE INDEX IF NOT EXISTS idx_queue_iot_counter ON components_queue_iot_bindings(counter_id);
CREATE INDEX IF NOT EXISTS idx_queue_iot_device ON components_queue_iot_bindings(iot_device_id);
