# IoT Queue Button Firmware Guidelines

These rules supplement the repository-root `AGENTS.md`.

## Directory Pattern

- `esp32_queue_button/`: ESP32 firmware communicating over Wi-Fi/MQTT, plus wiring and flashing documentation.
- `arduino_nano_queue_button/`: Arduino Nano firmware communicating over USB serial, plus wiring and setup documentation.

## Implementation Rules

- Preserve board-specific communication: ESP32 uses MQTT; Nano uses USB serial/Web Serial. Do not silently change the protocol or payload/topic names.
- Before changing MQTT topics, payload fields, or action names, compare with the backend IoT worker and update both sides and the setup docs together.
- Keep button input wiring and polarity consistent with `INPUT_PULLUP` and the documented GPIO/pin-to-GND arrangement.
- Preserve debounce and acknowledgment behavior; test button actions and reconnect/ACK behavior on the target board when hardware is available.
- Do not commit Wi-Fi or broker credentials. Use non-routable/example placeholders in firmware examples and keep deployment values configurable.
- Update the matching board README whenever pin assignments, setup steps, protocol, or required libraries change.
