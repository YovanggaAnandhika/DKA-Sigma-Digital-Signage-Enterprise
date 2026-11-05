CREATE TABLE components_queue_iot_bindings (
    iot_device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES components_queue_counters(id) ON DELETE SET NULL,
    ticket_prefix VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (iot_device_id, queue_display_id)
);

CREATE INDEX idx_queue_iot_bindings_queue ON components_queue_iot_bindings(queue_display_id);
