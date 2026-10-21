/*
 * =========================================================================================
 * DKASigma Digital Signage Enterprise - IoT Queue Controller Firmware
 * Modul: NodeMCU ESP32 (ESP-WROOM-32 / ESP32 Dev Module)
 * Protokol: MQTT (PubSubClient) + JSON (ArduinoJson)
 * 
 * Fitur:
 * - Multi-tombol fisik berbasis pin GPIO (INPUT_PULLUP)
 * - Otomatis mendeteksi MAC Address sebagai Device UID (tanpa perlu setting manual)
 * - Anti-bouncing presisi berbasis millis() (50ms debouncing)
 * - Penanganan ACK visual LED: Kedip 2x jika aksi berhasil, kedip lambat jika dinonaktifkan
 * - Telemetri periodik (Wi-Fi RSSI, IP address, uptime) tiap 30 detik
 * =========================================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// =========================================================================================
// 1. KONFIGURASI WI-FI & MQTT BROKER
// =========================================================================================
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// Alamat IP atau Hostname MQTT Broker (Server DKASigma / Nginx Proxy)
// Contoh jika di jaringan lokal: "192.168.1.100" atau "mqtt.local.sigma.dkaapis.com"
const char* MQTT_SERVER   = "192.168.1.100";
const int   MQTT_PORT     = 1883;

// Autentikasi MQTT (Kosongkan jika broker disetel mode anonymous)
const char* MQTT_USER     = "";
const char* MQTT_PASSWORD = "";

// =========================================================================================
// 2. KONFIGURASI PIN HARDWARE
// =========================================================================================
// Pin LED Indikator Onboard (Umumnya GPIO 2 pada modul NodeMCU ESP32)
const int PIN_LED_STATUS = 2;

// Pin Buzzer Piezo Pasif / Aktif (Opsional, hubungkan ke GND dan GPIO 4, set -1 jika tidak ada)
const int PIN_BUZZER     = 4;

// Daftar pin GPIO yang dipantau untuk tombol pushbutton (terhubung antara GPIO dan GND)
// Pin-pin ini dapat dipetakan langsung dari web dashboard DKASigma Studio!
const int MONITORED_PINS[] = {13, 12, 14, 27, 26, 25, 33};
const int NUM_PINS = sizeof(MONITORED_PINS) / sizeof(MONITORED_PINS[0]);

// =========================================================================================
// 3. VARIABEL INTERNAL & DEBOUNCING
// =========================================================================================
WiFiClient espClient;
PubSubClient mqttClient(espClient);

char deviceUid[32];
char topicAction[64];
char topicAck[64];
char topicTelemetry[64];

// Debounce arrays per pin
int pinLastState[NUM_PINS];
int pinCurrentState[NUM_PINS];
unsigned long pinLastDebounceTime[NUM_PINS];
const unsigned long DEBOUNCE_DELAY_MS = 50;

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 30000; // Tiap 30 detik

// =========================================================================================
// 4. HELPER SOUND & LED FEEDBACK
// =========================================================================================
void triggerBuzzer(int durationMs, int toneFreq = 2000) {
  if (PIN_BUZZER >= 0) {
    #if defined(ESP32)
      // Gunakan tone sederhana jika hardware mendukung
      tone(PIN_BUZZER, toneFreq, durationMs);
    #endif
  }
}

void blinkFeedback(bool success) {
  if (success) {
    // Kedip 2x cepat (Sukses diterima server)
    for (int i = 0; i < 2; i++) {
      digitalWrite(PIN_LED_STATUS, HIGH);
      delay(80);
      digitalWrite(PIN_LED_STATUS, LOW);
      delay(80);
    }
    digitalWrite(PIN_LED_STATUS, HIGH); // Kembalikan ke solid ON
    triggerBuzzer(100, 2400);
  } else {
    // Kedip 1x panjang (Diabaikan / Dinonaktifkan di Dashboard)
    digitalWrite(PIN_LED_STATUS, LOW);
    delay(400);
    digitalWrite(PIN_LED_STATUS, HIGH);
    triggerBuzzer(300, 800);
  }
}

// =========================================================================================
// 5. MQTT CALLBACK & SUBSCRIPTION
// =========================================================================================
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  char message[256];
  if (length >= sizeof(message)) length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.print("[MQTT RX] Topik: ");
  Serial.print(topic);
  Serial.print(" | Payload: ");
  Serial.println(message);

  // Parsing respon ACK dari server
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (!err) {
    const char* status = doc["status"] | "OK";
    const char* action = doc["action"] | "";
    const char* msg    = doc["message"] | "";

    Serial.printf("[ACK] Status: %s, Aksi: %s, Pesan: %s\n", status, action, msg);

    if (strcmp(status, "OK") == 0) {
      blinkFeedback(true);
    } else {
      blinkFeedback(false);
    }
  }
}

// =========================================================================================
// 6. KONEKSI WI-FI & MQTT
// =========================================================================================
void setupWifi() {
  delay(10);
  Serial.println();
  Serial.print("Menghubungkan ke Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Dapatkan MAC address dan bentuk Device UID
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  snprintf(deviceUid, sizeof(deviceUid), "ESP32_%s", mac.c_str());

  // Siapkan topik MQTT
  snprintf(topicAction, sizeof(topicAction), "dka/iot/%s/action", deviceUid);
  snprintf(topicAck, sizeof(topicAck), "dka/iot/%s/ack", deviceUid);
  snprintf(topicTelemetry, sizeof(topicTelemetry), "dka/iot/%s/telemetry", deviceUid);

  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    delay(250);
    Serial.print(".");
  }

  digitalWrite(PIN_LED_STATUS, HIGH);
  Serial.println("\n[Wi-Fi] Terhubung!");
  Serial.print("[Wi-Fi] Alamat IP ESP32: ");
  Serial.println(WiFi.localIP());

  Serial.println("=================================================");
  Serial.println("   DKASigma Digital Signage - IoT Controller    ");
  Serial.print("   DEVICE UID : ");
  Serial.println(deviceUid);
  Serial.println("   (Salin UID ini ke tab 'Perangkat IoT' di Web)");
  Serial.println("=================================================");
}

void reconnectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Menghubungkan ke MQTT Broker (");
    Serial.print(MQTT_SERVER);
    Serial.print(")... ");

    bool connected = false;
    if (strlen(MQTT_USER) > 0) {
      connected = mqttClient.connect(deviceUid, MQTT_USER, MQTT_PASSWORD);
    } else {
      connected = mqttClient.connect(deviceUid);
    }

    if (connected) {
      Serial.println("BERHASIL!");
      digitalWrite(PIN_LED_STATUS, HIGH);

      // Subscribe ke topik ACK konfirmasi
      mqttClient.subscribe(topicAck);
      Serial.printf("[MQTT Sub] Berlangganan: %s\n", topicAck);

      // Kirim telemetri awal saat online
      sendTelemetry();
    } else {
      Serial.print("GAGAL, rc=");
      Serial.print(mqttClient.state());
      Serial.println(". Mencoba lagi dalam 5 detik...");
      digitalWrite(PIN_LED_STATUS, LOW);
      delay(5000);
    }
  }
}

void sendTelemetry() {
  StaticJsonDocument<200> doc;
  doc["device_uid"] = deviceUid;
  doc["ip"]         = WiFi.localIP().toString();
  doc["rssi"]       = WiFi.RSSI();
  doc["fw"]         = "1.0.0";
  doc["uptime_ms"]  = millis();

  char buffer[200];
  serializeJson(doc, buffer);
  mqttClient.publish(topicTelemetry, buffer);
  Serial.printf("[Telemetri] Dikirim: %s\n", buffer);
}

void sendButtonPress(int pin) {
  StaticJsonDocument<200> doc;
  doc["device_uid"] = deviceUid;
  doc["pin"]        = pin;
  doc["event"]      = "PRESS";
  doc["uptime_ms"]  = millis();

  char buffer[200];
  serializeJson(doc, buffer);
  mqttClient.publish(topicAction, buffer);

  Serial.printf("[Tombol Ditekan] GPIO %d dipublikasikan ke %s: %s\n", pin, topicAction, buffer);
}

// =========================================================================================
// 7. SETUP & LOOP
// =========================================================================================
void setup() {
  Serial.begin(115200);

  // Inisialisasi LED status
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_LED_STATUS, LOW);

  // Inisialisasi buzzer jika ada
  if (PIN_BUZZER >= 0) {
    pinMode(PIN_BUZZER, OUTPUT);
    digitalWrite(PIN_BUZZER, LOW);
  }

  // Inisialisasi pin tombol input dengan INTERNAL PULLUP
  for (int i = 0; i < NUM_PINS; i++) {
    pinMode(MONITORED_PINS[i], INPUT_PULLUP);
    pinLastState[i] = HIGH;
    pinCurrentState[i] = HIGH;
    pinLastDebounceTime[i] = 0;
  }

  setupWifi();

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWifi();
  }

  if (!mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop();

  // Kirim telemetri periodik tiap 30 detik
  if (millis() - lastTelemetryTime > TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();
    sendTelemetry();
  }

  // Deteksi penekanan tombol fisik (Active LOW dengan internal pullup)
  for (int i = 0; i < NUM_PINS; i++) {
    int pin = MONITORED_PINS[i];
    int reading = digitalRead(pin);

    if (reading != pinLastState[i]) {
      pinLastDebounceTime[i] = millis();
    }

    if ((millis() - pinLastDebounceTime[i]) > DEBOUNCE_DELAY_MS) {
      if (reading != pinCurrentState[i]) {
        pinCurrentState[i] = reading;

        // Tombol baru saja ditekan (transisi dari HIGH ke LOW)
        if (pinCurrentState[i] == LOW) {
          sendButtonPress(pin);
        }
      }
    }

    pinLastState[i] = reading;
  }
}
