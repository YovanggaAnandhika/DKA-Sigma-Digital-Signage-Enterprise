/*
 * =========================================================================================
 * HND Digital Signage Enterprise - IoT Queue Controller Firmware
 * Modul: NodeMCU ESP32 (ESP-WROOM-32 / ESP32 Dev Module)
 * Protokol: MQTT (PubSubClient) + JSON (ArduinoJson)
 *
 * Fitur:
 * - Multi-tombol fisik berbasis pin GPIO (INPUT_PULLUP)
 * - Otomatis mendeteksi MAC Address sebagai Device UID (tanpa perlu setting
 * manual)
 * - Anti-bouncing presisi berbasis millis() (50ms debouncing)
 * - Tombol BOOT mendukung aksi 1-4 klik cepat dan tahan 5 detik untuk pairing reset
 * - Indikator GPIO 2 untuk status Wi-Fi, MQTT, reset, pairing, dan heartbeat
 *   lembut; ACK aksi tetap ditandai dengan kedipan
 * - Telemetri periodik (Wi-Fi RSSI, IP address, uptime) tiap 30 detik
 * =========================================================================================
 */

#include <ArduinoJson.h>
#include <DNSServer.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WebServer.h>
#include <math.h>

// =========================================================================================
// 1. WI-FI SETUP & MQTT CONFIGURATION
// =========================================================================================
char wifiSsid[33] = "";
char wifiPassword[65] = "";
char mqttServer[128] = "";
char mqttUser[64] = "";
char mqttPassword[64] = "";
uint16_t mqttPort = 1883;

Preferences settings;
bool settingsReady = false;
WebServer configServer(80);
DNSServer dnsServer;
bool configPortalActive = false;
bool configPending = false;
bool configFailed = false;
bool configStorageFailed = false;
bool configRoutesRegistered = false;
String pendingSsid;
String pendingWifiPassword;
String pendingMqttServer;
String pendingMqttUser;
String pendingMqttPassword;
uint16_t pendingMqttPort = 1883;
unsigned long configAttemptStartedAt = 0;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 20000;
unsigned long lastMqttAttempt = 0;
unsigned long lastWifiRetry = 0;
unsigned long bootPressStartedAt = 0;
bool bootPressActive = false;
bool bootResetTriggered = false;
int bootLastReading = HIGH;
int bootCurrentState = HIGH;
unsigned long bootLastDebounceTime = 0;
const unsigned long BOOT_RESET_HOLD_MS = 5000;
const unsigned long BOOT_MULTI_CLICK_WINDOW_MS = 450;
uint8_t bootClickCount = 0;
unsigned long bootLastClickAt = 0;
bool bootPressContinuesClickSequence = false;

// =========================================================================================
// 2. KONFIGURASI PIN HARDWARE
// =========================================================================================
// Pin LED Indikator Onboard (Umumnya GPIO 2 pada modul NodeMCU ESP32)
const int PIN_LED_STATUS = 2;
const uint8_t STATUS_LED_HEARTBEAT_BRIGHTNESS = 24; // 0-255; redup = lebih soft
const unsigned long STATUS_LED_HEARTBEAT_PERIOD_MS = 1800;

// Pin Buzzer Piezo Pasif / Aktif (Opsional, hubungkan ke GND dan GPIO 4, set -1
// jika tidak ada)
const int PIN_BUZZER = 4;

// Daftar pin GPIO yang dipantau untuk tombol pushbutton (terhubung antara GPIO
// dan GND) Pin 0 adalah tombol fisik bawaan "BOOT" di atas board ESP32 (bisa
// langsung ditekan tanpa kabel!)
const int MONITORED_PINS[] = {0, 13, 12, 14, 27, 26, 25, 33};
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
char topicCommand[64];
char topicResetRequest[64];
char topicResetAck[64];
String pendingResetRequestId;
bool resetRequestPending = false;
bool pairingResetReady = false;
bool pairingResetFromBoot = false;
bool resetServerConfirmed = false;
unsigned long resetRequestStartedAt = 0;
unsigned long resetLastPublishAt = 0;
const unsigned long RESET_REQUEST_TIMEOUT_MS = 10000;
const unsigned long RESET_REQUEST_RETRY_MS = 1000;
bool resetSuccessFeedback = false;
unsigned long resetSuccessStartedAt = 0;

void requestPairingReset(const String &serverRequestId = "");
void finishPairingReset();
bool publishPairingResetRequest();

uint8_t statusPulseTrain(unsigned long elapsed, unsigned long period,
                         uint8_t count, unsigned long pulseMs,
                         unsigned long gapMs) {
  const unsigned long phase = elapsed % period;
  const unsigned long pulseCycle = pulseMs + gapMs;
  return phase < count * pulseCycle && phase % pulseCycle < pulseMs ? 255 : 0;
}

void writeStatusLed(uint8_t brightness) {
  analogWrite(PIN_LED_STATUS, brightness);
}

void updateStatusLed() {
  const unsigned long now = millis();
  uint8_t brightness = 0;
  bool showingResetFeedback = false;

  if (resetSuccessFeedback) {
    if (now - resetSuccessStartedAt < 2000) {
      brightness = statusPulseTrain(now - resetSuccessStartedAt, 1200, 3, 90, 110);
      showingResetFeedback = true;
    } else {
      resetSuccessFeedback = false;
    }
  }

  if (!showingResetFeedback) {
    if ((!configPortalActive && bootResetTriggered) || resetRequestPending) {
      brightness = statusPulseTrain(now, 900, 3, 65, 120);
    } else if (configPortalActive && settingsReady && wifiSsid[0] == '\0') {
      brightness = statusPulseTrain(now, 1400, 2, 65, 180);
    } else if (WiFi.status() != WL_CONNECTED) {
      brightness = statusPulseTrain(now, 300, 1, 75, 0);
    } else if (!mqttClient.connected()) {
      brightness = statusPulseTrain(now, 1200, 1, 90, 0);
    } else {
      const unsigned long phase = now % STATUS_LED_HEARTBEAT_PERIOD_MS;
      const unsigned long firstPulseMs = 300;
      const unsigned long secondPulseStartMs = 430;
      const unsigned long secondPulseMs = 420;
      float pulse = 0.0f;
      if (phase < firstPulseMs) {
        pulse = sinf(PI * phase / firstPulseMs);
      } else if (phase >= secondPulseStartMs &&
                 phase < secondPulseStartMs + secondPulseMs) {
        pulse = sinf(PI * (phase - secondPulseStartMs) / secondPulseMs);
      }
      brightness = static_cast<uint8_t>(STATUS_LED_HEARTBEAT_BRIGHTNESS * pulse);
    }
  }

  writeStatusLed(brightness);
}

// Debounce arrays per pin
int pinLastState[NUM_PINS];
int pinCurrentState[NUM_PINS];
unsigned long pinLastDebounceTime[NUM_PINS];
const unsigned long DEBOUNCE_DELAY_MS = 30;

void resetButtonStates() {
  while (Serial.available() > 0) {
    Serial.read();
  }
  unsigned long now = millis();
  for (int i = 0; i < NUM_PINS; i++) {
    int state = digitalRead(MONITORED_PINS[i]);
    pinLastState[i] = state;
    pinCurrentState[i] = state;
    pinLastDebounceTime[i] = now;
  }
}

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
      writeStatusLed(255);
      delay(80);
      writeStatusLed(0);
      delay(80);
    }
    triggerBuzzer(100, 2400);
  } else {
    // Kedip 1x panjang (Diabaikan / Dinonaktifkan di Dashboard)
    writeStatusLed(0);
    delay(400);
    writeStatusLed(255);
    triggerBuzzer(300, 800);
  }
}

// =========================================================================================
// 5. MQTT CALLBACK & SUBSCRIPTION
// =========================================================================================
void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  char message[256];
  if (length >= sizeof(message))
    length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.print("[MQTT RX] Topik: ");
  Serial.print(topic);
  Serial.print(" | Payload: ");
  Serial.println(message);

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (err)
    return;

  if (strcmp(topic, topicCommand) == 0) {
    const char *command = doc["command"] | "";
    const char *requestId = doc["request_id"] | "";
    if (strcmp(command, "RESET_PAIRING") == 0 && requestId[0] != '\0') {
      requestPairingReset(String(requestId));
    }
    return;
  }

  if (strcmp(topic, topicResetAck) == 0 && resetRequestPending) {
    const char *requestId = doc["request_id"] | "";
    const char *status = doc["status"] | "";
    if (pendingResetRequestId == requestId) {
      resetRequestPending = false;
      if (strcmp(status, "OK") == 0) {
        resetServerConfirmed = true;
        pairingResetReady = true;
      } else if (pairingResetFromBoot) {
        Serial.println("[Reset] Server gagal menghapus perangkat; melanjutkan reset lokal.");
        pairingResetReady = true;
      } else {
        Serial.println("[Reset] Server menolak reset; konfigurasi dipertahankan.");
        blinkFeedback(false);
      }
    }
    return;
  }

  const char *status = doc["status"] | "OK";
  const char *action = doc["action"] | "";
  const char *msg = doc["message"] | "";
  Serial.printf("[ACK] Status: %s, Aksi: %s, Pesan: %s\n", status, action, msg);
  blinkFeedback(strcmp(status, "OK") == 0);
}

void requestPairingReset(const String &serverRequestId) {
  if (resetRequestPending) {
    Serial.println("[Reset] Tidak dapat meminta reset: MQTT belum siap.");
    return;
  }

  pairingResetFromBoot = serverRequestId.length() == 0;
  if (!mqttClient.connected() && !pairingResetFromBoot) {
    Serial.println("[Reset] Tidak dapat meminta reset: MQTT belum siap.");
    return;
  }

  if (serverRequestId.length() > 0) {
    pendingResetRequestId = serverRequestId;
  } else {
    char requestId[40];
    snprintf(requestId, sizeof(requestId), "%08lx-%08lx-%08lx",
             static_cast<unsigned long>(esp_random()),
             static_cast<unsigned long>(esp_random()),
             static_cast<unsigned long>(millis()));
    pendingResetRequestId = requestId;
  }

  resetRequestPending = true;
  resetRequestStartedAt = millis();
  resetLastPublishAt = 0;
  if (mqttClient.connected() && !publishPairingResetRequest() &&
      !pairingResetFromBoot) {
    resetRequestPending = false;
    pendingResetRequestId = "";
    pairingResetFromBoot = false;
    return;
  }
  Serial.println(mqttClient.connected()
                     ? "[Reset] Menunggu konfirmasi penghapusan dari server..."
                     : "[Reset] Server tidak terjangkau; menunggu sebelum reset lokal.");
}

bool publishPairingResetRequest() {
  StaticJsonDocument<128> doc;
  doc["request_id"] = pendingResetRequestId;
  char payload[128];
  serializeJson(doc, payload);
  if (!mqttClient.publish(topicResetRequest, payload)) {
    resetLastPublishAt = millis();
    Serial.println("[Reset] Gagal mengirim permintaan ke server.");
    return false;
  }
  resetLastPublishAt = millis();
  return true;
}

void finishPairingReset() {
  if (!pairingResetReady)
    return;

  pairingResetReady = false;
  resetRequestPending = false;
  pendingResetRequestId = "";
  mqttClient.disconnect();
  WiFi.disconnect(false, false);
  bool cleared = settingsReady && settings.clear();
  if (!cleared) {
    Serial.println("[Reset] Server sudah menghapus perangkat, tetapi NVS gagal dihapus.");
    blinkFeedback(false);
    return;
  }

  wifiSsid[0] = '\0';
  wifiPassword[0] = '\0';
  mqttServer[0] = '\0';
  mqttUser[0] = '\0';
  mqttPassword[0] = '\0';
  mqttPort = 1883;
  pairingResetFromBoot = false;
  if (configPortalActive)
    stopConfigPortal();
  Serial.println(resetServerConfirmed
                     ? "[Reset] Server mengonfirmasi penghapusan. Pairing ulang dimulai."
                     : "[Reset] Pairing lokal direset; record server mungkin masih ada.");
  resetServerConfirmed = false;
  resetSuccessFeedback = true;
  resetSuccessStartedAt = millis();
  startConfigPortal();
}

void processPairingReset() {
  if (resetRequestPending &&
      millis() - resetRequestStartedAt > RESET_REQUEST_TIMEOUT_MS) {
    resetRequestPending = false;
    pendingResetRequestId = "";
    if (pairingResetFromBoot) {
      Serial.println("[Reset] Server tidak mengonfirmasi; melanjutkan reset lokal.");
      pairingResetReady = true;
    } else {
      pairingResetFromBoot = false;
      Serial.println("[Reset] Server tidak mengonfirmasi; konfigurasi dipertahankan.");
      blinkFeedback(false);
    }
  } else if (resetRequestPending && mqttClient.connected() &&
             millis() - resetLastPublishAt > RESET_REQUEST_RETRY_MS) {
    publishPairingResetRequest();
  }
  finishPairingReset();
}

// =========================================================================================
// 6. KONEKSI WI-FI & MQTT
// =========================================================================================
String escapeHtml(const String &value) {
  String escaped;
  escaped.reserve(value.length());
  for (size_t i = 0; i < value.length(); i++) {
    switch (value[i]) {
    case '&':
      escaped += F("&amp;");
      break;
    case '<':
      escaped += F("&lt;");
      break;
    case '>':
      escaped += F("&gt;");
      break;
    case '"':
      escaped += F("&quot;");
      break;
    case '\'':
      escaped += F("&#39;");
      break;
    default:
      escaped += value[i];
    }
  }
  return escaped;
}

void initializeDeviceIdentity() {
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  snprintf(deviceUid, sizeof(deviceUid), "ESP32_%s", mac.c_str());
  snprintf(topicAction, sizeof(topicAction), "dka/iot/%s/action", deviceUid);
  snprintf(topicAck, sizeof(topicAck), "dka/iot/%s/ack", deviceUid);
  snprintf(topicTelemetry, sizeof(topicTelemetry), "dka/iot/%s/telemetry",
           deviceUid);
  snprintf(topicCommand, sizeof(topicCommand), "dka/iot/%s/command", deviceUid);
  snprintf(topicResetRequest, sizeof(topicResetRequest),
           "dka/iot/%s/reset_request", deviceUid);
  snprintf(topicResetAck, sizeof(topicResetAck), "dka/iot/%s/reset_ack",
           deviceUid);

  Serial.println("=================================================");
  Serial.println("   HND Digital Signage - IoT Controller    ");
  Serial.print("   DEVICE UID : ");
  Serial.println(deviceUid);
  Serial.println("=================================================");
}

String configPage() {
  String page = F(
      "<!doctype html><html lang='id'><head><meta charset='utf-8'>"
      "<meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1'>"
      "<title>HND IoT Setup</title>"
      "<style>"
      ":root{--bg:#f8fafc;--card:#ffffff;--text:#0f172a;--sub:#64748b;--border:#cbd5e1;"
      "--primary:#2563eb;--primary-hover:#1d4ed8;--ring:rgba(37,99,235,0.15);--radius:10px}"
      "*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"
      "'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}"
      "body{background:var(--bg);color:var(--text);display:flex;width:100vw;min-height:100vh;align-items:center;"
      "justify-content:center;padding:10px}"
      ".container{background:var(--card);width:100%;max-width:100%;height:100%;padding:16px 20px;"
      "display:flex;flex-direction:column;justify-content:space-between;border-radius:var(--radius);"
      "box-shadow:0 4px 12px -2px rgba(0,0,0,0.05);border:1px solid var(--border)}"
      ".header-group{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}"
      ".brand{display:flex;align-items:center;gap:8px}"
      ".brand-icon{width:30px;height:30px;background:var(--primary);border-radius:8px;"
      "display:grid;place-items:center;color:#fff;font-weight:700;font-size:15px}"
      "h1{font-size:16px;font-weight:700;letter-spacing:-0.02em;color:var(--text)}"
      "p.desc{font-size:11.5px;color:var(--sub);margin-bottom:12px;line-height:1.3}"
      "form{display:flex;flex-direction:column;gap:8px;flex-grow:1}"
      ".form-group{display:flex;flex-direction:column;gap:3px}"
      "label{font-size:11.5px;font-weight:600;color:#334155}"
      "input,select{width:100%;padding:8px 10px;font-size:13px;background:#fff;"
      "border:1px solid var(--border);border-radius:var(--radius);color:var(--text);"
      "outline:none;transition:all .2s ease}"
      "input:focus,select:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--ring)}"
      ".input-pass-wrap{position:relative;display:flex;align-items:center}"
      ".input-pass-wrap input{padding-right:36px}"
      ".toggle-pass{position:absolute;right:8px;background:none;border:none;cursor:pointer;"
      "color:var(--sub);font-size:13px;padding:4px}"
      ".grid-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}"
      ".input-group{display:flex;gap:6px}"
      ".btn-scan{padding:0 12px;background:#f1f5f9;color:#334155;border:1px solid var(--border);"
      "border-radius:var(--radius);font-weight:600;font-size:12px;cursor:pointer;white-space:nowrap;"
      "transition:all .2s ease}"
      ".btn-scan:hover{background:#e2e8f0}"
      "button[type='submit']{width:100%;padding:10px;background:var(--primary);color:#fff;"
      "border:none;border-radius:var(--radius);font-size:13px;font-weight:600;cursor:pointer;"
      "margin-top:4px;box-shadow:0 2px 8px rgba(37,99,235,0.2);transition:all .2s ease}"
      "button[type='submit']:hover{background:var(--primary-hover)}"
      "#status{margin-top:8px;padding:6px 10px;border-radius:6px;font-size:11px;"
      "text-align:center;background:#f8fafc;color:var(--sub);border:1px solid var(--border)}"
      "</style></head><body>"
      "<div class='container'>"
      "<div>"
      "<div class='header-group'>"
      "<div class='brand'><div class='brand-icon'>D</div>"
      "<div><h1>HND Signage IoT Setup</h1></div></div>"
      "<span style='font-size:10px;color:var(--sub);background:#f1f5f9;padding:2px 6px;border-radius:4px'>Captive Portal</span>"
      "</div>"
      "<p class='desc'>Hubungkan modul ke Wi-Fi dan tentukan broker MQTT tujuan.</p>"
      "<form id='setup'>"
      "<div class='form-group'><label>Jaringan Wi-Fi (SSID)</label>"
      "<div class='input-group'>"
      "<select id='networks'><option value=''>Pilih Wi-Fi terdekat...</option></select>"
      "<button type='button' id='scan' class='btn-scan'>Pindai</button></div>"
      "<input name='ssid' id='ssid' maxlength='32' required placeholder='atau ketik SSID manual' style='margin-top:3px'>"
      "</div>"
      "<div class='form-group'><label>Password Wi-Fi</label>"
      "<div class='input-pass-wrap'>"
      "<input name='wifi_password' id='wifi_pass' type='password' maxlength='64' placeholder='••••••••' autocomplete='new-password'>"
      "<button type='button' class='toggle-pass' onclick=\"togglePass('wifi_pass', this)\">👁</button>"
      "</div></div>"
      "<div class='grid-2'>"
      "<div class='form-group'><label>Endpoint MQTT</label>"
      "<input name='mqtt_server' maxlength='127' required value='");
  page += escapeHtml(String(mqttServer));
  page += F("'></div>"
            "<div class='form-group'><label>Port MQTT</label>"
            "<input name='mqtt_port' type='number' min='1' max='65535' required value='");
  page += String(mqttPort);
  page += F("'></div>"
            "</div>"
            "<div class='grid-2'>"
            "<div class='form-group'><label>User (Opt)</label>"
            "<input name='mqtt_user' maxlength='63' placeholder='Username' autocomplete='username'></div>"
            "<div class='form-group'><label>Pass (Opt)</label>"
            "<div class='input-pass-wrap'>"
            "<input name='mqtt_password' id='mqtt_pass_user' type='password' maxlength='63' placeholder='••••••••' autocomplete='new-password'>"
            "<button type='button' class='toggle-pass' onclick=\"togglePass('mqtt_pass_user', this)\">👁</button>"
            "</div></div>"
            "</div>"
            "<button type='submit'>Simpan & Hubungkan</button>"
            "</form>"
            "</div>"
            "<div id='status'>Access point aktif di http://192.168.4.1/</div>"
            "</div>"
            "<script>"
            "function togglePass(id, btn){"
            "let el=document.getElementById(id);"
            "if(el.type==='password'){el.type='text';btn.textContent='🙈';}"
            "else{el.type='password';btn.textContent='👁';}"
            "}"
            "const s=document.querySelector('#status'),n=document.querySelector('#networks'),ssid=document.querySelector('#ssid');"
            "document.querySelector('#scan').onclick=async()=>{s.textContent='Memindai jaringan...';"
            "try{let r=await fetch('/scan'),a=await r.json();"
            "n.innerHTML='<option value=\"\">Pilih Wi-Fi terdekat...</option>';"
            "a.forEach(x=>{let o=document.createElement('option');o.value=x.ssid;o.textContent=x.ssid+' ('+x.rssi+' dBm)';n.append(o)});"
            "s.textContent=a.length?'Pilih jaringan dari daftar.':'Tidak ada jaringan.';}"
            "catch(e){s.textContent='Gagal memindai.'}};"
            "n.onchange=()=>{if(n.value)ssid.value=n.value};"
            "document.querySelector('#setup').onsubmit=async e=>{"
            "e.preventDefault();s.textContent='Menyimpan & menghubungkan...';"
            "try{let r=await fetch('/save',{method:'POST',body:new URLSearchParams(new FormData(e.target))});"
            "let d=await r.json();s.textContent=d.message;"
            "if(d.state==='connecting'){"
            "let t=setInterval(async me=>{"
            "try{let x=await(await fetch('/status')).json();"
            "if(x.state==='failed'){clearInterval(t);s.textContent=x.message}}"
            "catch(_){clearInterval(t);s.textContent='Tersambung! AP ditutup.'}"
            "},1000)}"
            "}catch(_){s.textContent='Terkirim. Menghubungkan...'}"
            "};"
            "</script></body></html>");
  return page;
}

void startConfigPortal() {
  if (configPortalActive)
    return;

  WiFi.disconnect(false, false);
  WiFi.mode(WIFI_AP_STA);
  if (!WiFi.softAPConfig(IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 1),
                         IPAddress(255, 255, 255, 0))) {
    Serial.println("[Setup] Gagal mengatur alamat access point.");
    return;
  }
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  String apName = "HND-Setup-" + mac.substring(mac.length() - 6);
  if (!WiFi.softAP(apName.c_str())) {
    Serial.println("[Setup] Gagal membuat access point konfigurasi.");
    WiFi.mode(WIFI_STA);
    return;
  }

  if (!dnsServer.start(53, "*", IPAddress(192, 168, 4, 1))) {
    Serial.println("[Setup] Gagal menjalankan DNS captive portal.");
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_STA);
    return;
  }
  if (!configRoutesRegistered) {
    configServer.on("/", HTTP_GET, []() {
      configServer.send(200, "text/html; charset=utf-8", configPage());
    });
    configServer.on("/scan", HTTP_GET, []() {
      int count = WiFi.scanNetworks();
      DynamicJsonDocument doc(4096);
      JsonArray networks = doc.to<JsonArray>();
      for (int i = 0; i < count; i++) {
        if (WiFi.SSID(i).length() == 0)
          continue;
        JsonObject network = networks.createNestedObject();
        network["ssid"] = WiFi.SSID(i);
        network["rssi"] = WiFi.RSSI(i);
      }
      String response;
      serializeJson(doc, response);
      WiFi.scanDelete();
      configServer.send(200, "application/json", response);
    });
    configServer.on("/save", HTTP_POST, []() {
      if (configPending) {
        configServer.send(409, "application/json",
                          "{\"state\":\"connecting\",\"message\":\"Koneksi "
                          "Wi-Fi sedang dicoba.\"}");
        return;
      }
      String ssid = configServer.arg("ssid");
      String host = configServer.arg("mqtt_server");
      String portValue = configServer.arg("mqtt_port");
      String wifiPass = configServer.arg("wifi_password");
      String user = configServer.arg("mqtt_user");
      String pass = configServer.arg("mqtt_password");
      if (!settingsReady) {
        configServer.send(503, "application/json",
                          "{\"state\":\"failed\",\"message\":\"Penyimpanan "
                          "perangkat tidak tersedia.\"}");
        return;
      }
      bool validPort = portValue.length() > 0;
      for (size_t i = 0; i < portValue.length(); i++) {
        validPort = validPort && isDigit(portValue[i]);
      }
      unsigned long port =
          validPort ? strtoul(portValue.c_str(), nullptr, 10) : 0;
      bool validHost = host.length() > 0 && host.length() < sizeof(mqttServer);
      for (size_t i = 0; i < host.length(); i++) {
        char c = host[i];
        validHost = validHost &&
                    ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
                     (c >= '0' && c <= '9') || c == '.' || c == '-');
      }
      if (ssid.length() == 0 || ssid.length() > 32 ||
          wifiPass.length() > 64 || !validHost ||
          user.length() >= sizeof(mqttUser) ||
          pass.length() >= sizeof(mqttPassword) || port < 1 || port > 65535) {
        configServer.send(400, "application/json",
                          "{\"state\":\"failed\",\"message\":\"SSID, "
                          "endpoint, password, atau port tidak valid.\"}");
        return;
      }

      pendingSsid = ssid;
      pendingWifiPassword = wifiPass;
      pendingMqttServer = host;
      pendingMqttUser = user;
      pendingMqttPassword = pass;
      pendingMqttPort = static_cast<uint16_t>(port);
      configPending = true;
      configFailed = false;
      configStorageFailed = false;
      configAttemptStartedAt = millis();
      WiFi.mode(WIFI_AP_STA);
      WiFi.begin(pendingSsid.c_str(), pendingWifiPassword.c_str());
      configServer.send(200, "application/json",
                        "{\"state\":\"connecting\",\"message\":\"Mencoba "
                        "tersambung ke Wi-Fi...\"}");
    });
    configServer.on("/status", HTTP_GET, []() {
      if (configPending) {
        configServer.send(200, "application/json",
                          "{\"state\":\"connecting\",\"message\":\"Mencoba "
                          "tersambung ke Wi-Fi...\"}");
      } else if (configFailed) {
        configServer.send(
            200, "application/json",
            configStorageFailed
                ? "{\"state\":\"failed\",\"message\":\"Gagal menyimpan "
                  "konfigurasi. Periksa penyimpanan perangkat.\"}"
                : "{\"state\":\"failed\",\"message\":\"Wi-Fi gagal "
                  "tersambung. Periksa password dan coba lagi.\"}");
      } else {
        configServer.send(200, "application/json",
                          "{\"state\":\"setup\",\"message\":\"Masukkan "
                          "konfigurasi perangkat.\"}");
      }
    });
    auto redirectToPortal = []() {
      configServer.sendHeader("Location", "http://192.168.4.1/", true);
      configServer.send(302, "text/plain", "");
    };
    configServer.on("/generate_204", HTTP_GET, redirectToPortal);
    configServer.on("/gen_204", HTTP_GET, redirectToPortal);
    configServer.on("/hotspot-detect.html", HTTP_GET, redirectToPortal);
    configServer.on("/connecttest.txt", HTTP_GET, redirectToPortal);
    configServer.on("/ncsi.txt", HTTP_GET, redirectToPortal);
    configServer.onNotFound(redirectToPortal);
    configRoutesRegistered = true;
  }
  configServer.begin();
  configPortalActive = true;
  Serial.printf("[Setup] Wi-Fi: %s (terbuka), buka http://192.168.4.1/\n",
                apName.c_str());
}

void stopConfigPortal() {
  dnsServer.stop();
  configServer.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);
  configPortalActive = false;
  configPending = false;
}

bool storeSettingString(const char *key, const String &value) {
  settings.putString(key, value);
  return settings.getString(key, "\x01") == value;
}

void savePendingConfiguration() {
  bool saved = settings.putBool("configured", false) &&
               storeSettingString("ssid", pendingSsid) &&
               storeSettingString("wifi_pass", pendingWifiPassword) &&
               storeSettingString("mqtt_host", pendingMqttServer) &&
               settings.putUShort("mqtt_port", pendingMqttPort) > 0 &&
               storeSettingString("mqtt_user", pendingMqttUser) &&
               storeSettingString("mqtt_pass", pendingMqttPassword) &&
               settings.putBool("configured", true);
  if (!saved) {
    Serial.println("[Setup] Gagal menyimpan konfigurasi ke NVS.");
    configPending = false;
    configFailed = true;
    configStorageFailed = true;
    WiFi.disconnect(false, false);
    WiFi.mode(WIFI_AP_STA);
    return;
  }

  strlcpy(wifiSsid, pendingSsid.c_str(), sizeof(wifiSsid));
  strlcpy(wifiPassword, pendingWifiPassword.c_str(), sizeof(wifiPassword));
  strlcpy(mqttServer, pendingMqttServer.c_str(), sizeof(mqttServer));
  strlcpy(mqttUser, pendingMqttUser.c_str(), sizeof(mqttUser));
  strlcpy(mqttPassword, pendingMqttPassword.c_str(), sizeof(mqttPassword));
  mqttPort = pendingMqttPort;
  mqttClient.setServer(mqttServer, mqttPort);
  initializeDeviceIdentity();
  Serial.println("[Setup] Wi-Fi dan endpoint MQTT tersimpan.");
  stopConfigPortal();
  resetButtonStates();
}

void processConfigPortal() {
  if (!configPortalActive)
    return;
  dnsServer.processNextRequest();
  configServer.handleClient();
  if (!configPending)
    return;
  if (WiFi.status() == WL_CONNECTED) {
    savePendingConfiguration();
  } else if (millis() - configAttemptStartedAt > WIFI_CONNECT_TIMEOUT_MS) {
    WiFi.disconnect(false, false);
    WiFi.mode(WIFI_AP_STA);
    configPending = false;
    configFailed = true;
  }
}

void setupWifi() {
  settingsReady = settings.begin("dka-iot", false);
  if (!settingsReady) {
    Serial.println("[Setup] Gagal membuka penyimpanan konfigurasi NVS.");
    startConfigPortal();
    return;
  }
  strlcpy(wifiSsid, settings.getString("ssid", "").c_str(), sizeof(wifiSsid));
  strlcpy(wifiPassword, settings.getString("wifi_pass", "").c_str(),
          sizeof(wifiPassword));
  strlcpy(mqttServer, settings.getString("mqtt_host", "").c_str(),
          sizeof(mqttServer));
  mqttPort = settings.getUShort("mqtt_port", 1883);
  strlcpy(mqttUser, settings.getString("mqtt_user", "").c_str(),
          sizeof(mqttUser));
  strlcpy(mqttPassword, settings.getString("mqtt_pass", "").c_str(),
          sizeof(mqttPassword));

  if (!settings.getBool("configured", false) || wifiSsid[0] == '\0' ||
      mqttServer[0] == '\0') {
    startConfigPortal();
    return;
  }

  Serial.printf("[Wi-Fi] Menghubungkan ke %s...\n", wifiSsid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSsid, wifiPassword);
  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED &&
         millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    updateStatusLed();
    delay(20);
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Wi-Fi] Gagal tersambung; membuka setup.");
    startConfigPortal();
    return;
  }

  Serial.print("[Wi-Fi] Terhubung, IP ESP32: ");
  Serial.println(WiFi.localIP());
  initializeDeviceIdentity();
}

void sendTelemetry();

void reconnectMqtt() {
  if (mqttServer[0] == '\0' || WiFi.status() != WL_CONNECTED ||
      millis() - lastMqttAttempt < 5000) {
    return;
  }
  lastMqttAttempt = millis();
  Serial.printf("[MQTT] Menghubungkan ke %s:%u... ", mqttServer, mqttPort);

  bool connected = strlen(mqttUser) > 0
                       ? mqttClient.connect(deviceUid, mqttUser, mqttPassword)
                       : mqttClient.connect(deviceUid);
  if (!connected) {
    Serial.printf("GAGAL, rc=%d. Mencoba lagi.\n", mqttClient.state());
    return;
  }

  Serial.println("BERHASIL!");
  mqttClient.subscribe(topicAck);
  Serial.printf("[MQTT Sub] Berlangganan: %s\n", topicAck);
  mqttClient.subscribe(topicCommand);
  mqttClient.subscribe(topicResetAck);
  if (!resetRequestPending)
    sendTelemetry();
  resetButtonStates();
  Serial.println("[Siap] Tekan tombol BOOT singkat atau tombol GPIO untuk aksi.");
}

void sendTelemetry() {
  StaticJsonDocument<200> doc;
  doc["device_uid"] = deviceUid;
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["fw"] = "1.1.0";
  doc["uptime_ms"] = millis();

  char buffer[200];
  serializeJson(doc, buffer);
  mqttClient.publish(topicTelemetry, buffer);
  Serial.printf("[Telemetri] Dikirim: %s\n", buffer);
}

void sendButtonPress(int pin) {
  StaticJsonDocument<200> doc;
  doc["device_uid"] = deviceUid;
  doc["pin"] = pin;
  doc["event"] = "PRESS";
  doc["uptime_ms"] = millis();

  char buffer[200];
  serializeJson(doc, buffer);
  mqttClient.publish(topicAction, buffer);

  Serial.printf("[Tombol Ditekan] GPIO %d dipublikasikan ke %s: %s\n", pin,
                topicAction, buffer);
}

// =========================================================================================
// 7. SETUP & LOOP
// =========================================================================================
void dispatchBootClicks(uint8_t clickCount) {
  int pin = -1;
  switch (clickCount) {
  case 1:
    pin = 13;
    break;
  case 2:
    pin = 27;
    break;
  case 3:
    pin = 14;
    break;
  case 4:
    pin = 26;
    break;
  default:
    Serial.printf("[BOOT] Kombinasi %u klik belum dipetakan.\n", clickCount);
    return;
  }
  sendButtonPress(pin);
}

void handleBootButton() {
  int reading = digitalRead(0);
  if (reading != bootLastReading) {
    bootLastDebounceTime = millis();
    bootLastReading = reading;
  }

  if (millis() - bootLastDebounceTime > DEBOUNCE_DELAY_MS &&
      reading != bootCurrentState) {
    bootCurrentState = reading;
    if (bootCurrentState == LOW) {
      bootPressStartedAt = millis();
      bootPressActive = true;
      bootResetTriggered = false;
      bootPressContinuesClickSequence =
          bootClickCount > 0 &&
          millis() - bootLastClickAt <= BOOT_MULTI_CLICK_WINDOW_MS;
      if (bootClickCount > 0 && !bootPressContinuesClickSequence) {
        dispatchBootClicks(bootClickCount);
        bootClickCount = 0;
      }
    } else if (bootPressActive) {
      unsigned long heldFor = millis() - bootPressStartedAt;
      if (!bootResetTriggered && heldFor < BOOT_RESET_HOLD_MS &&
          !configPortalActive) {
        if (!bootPressContinuesClickSequence)
          bootClickCount = 0;
        bootClickCount++;
        bootLastClickAt = millis();
        if (bootClickCount == 4) {
          dispatchBootClicks(bootClickCount);
          bootClickCount = 0;
        }
      }
      bootPressActive = false;
      bootResetTriggered = false;
      bootPressContinuesClickSequence = false;
    }
  }

  if (bootPressActive && !bootResetTriggered &&
      millis() - bootPressStartedAt > BOOT_RESET_HOLD_MS) {
    bootResetTriggered = true;
    bootClickCount = 0;
    bootPressContinuesClickSequence = false;
    if (!configPortalActive)
      requestPairingReset();
  }

  if (!bootPressActive && bootClickCount > 0 &&
      millis() - bootLastClickAt > BOOT_MULTI_CLICK_WINDOW_MS) {
    dispatchBootClicks(bootClickCount);
    bootClickCount = 0;
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.persistent(false);

  // Inisialisasi LED status
  pinMode(PIN_LED_STATUS, OUTPUT);
  writeStatusLed(0);

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
  resetButtonStates();

  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setSocketTimeout(3);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  handleBootButton();
  processConfigPortal();

  if (!configPortalActive) {
    if (WiFi.status() != WL_CONNECTED &&
        millis() - lastWifiRetry > 5000) {
      lastWifiRetry = millis();
      WiFi.reconnect();
    }

    if (!mqttClient.connected()) {
      reconnectMqtt();
    } else {
      mqttClient.loop();
    }

    processPairingReset();
    if (!resetRequestPending && !configPortalActive && mqttClient.connected() &&
        millis() - lastTelemetryTime > TELEMETRY_INTERVAL_MS) {
      lastTelemetryTime = millis();
      sendTelemetry();
    }
  }

  updateStatusLed();
  if (configPortalActive || resetRequestPending)
    return;

  // Simulasi via Serial Monitor Arduino IDE (Tanpa kabel jumper!)
  // Ketik angka pin (misal: 13, 12, 14) atau huruf:
  // 'n' = Next (Pin 13), 'r' = Recall (Pin 12), 'b' = Break (Pin 14), 'c' =
  // Close (Pin 27), 'p' = Prev (Pin 26)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() > 0) {
      int targetPin = -1;
      if (cmd.equalsIgnoreCase("n") || cmd.equalsIgnoreCase("next") ||
          cmd == "13" || cmd == "0")
        targetPin = 13;
      else if (cmd.equalsIgnoreCase("r") || cmd.equalsIgnoreCase("recall") ||
               cmd == "12")
        targetPin = 12;
      else if (cmd.equalsIgnoreCase("b") || cmd.equalsIgnoreCase("break") ||
               cmd == "14")
        targetPin = 14;
      else if (cmd.equalsIgnoreCase("c") || cmd.equalsIgnoreCase("close") ||
               cmd == "27")
        targetPin = 27;
      else if (cmd.equalsIgnoreCase("p") || cmd.equalsIgnoreCase("prev") ||
               cmd == "26")
        targetPin = 26;
      else if (cmd == "25")
        targetPin = 25;
      else if (cmd == "33")
        targetPin = 33;

      if (targetPin > 0) {
        Serial.printf("[Serial Trigger] Mensimulasikan penekanan GPIO %d...\n",
                      targetPin);
        sendButtonPress(targetPin);
      }
    }
  }

  // Deteksi penekanan tombol fisik (Active LOW dengan internal pullup)
  for (int i = 0; i < NUM_PINS; i++) {
    int pin = MONITORED_PINS[i];
    if (pin == 0)
      continue;
    int reading = digitalRead(pin);

    if (reading != pinLastState[i]) {
      pinLastDebounceTime[i] = millis();
    }

    if ((millis() - pinLastDebounceTime[i]) > DEBOUNCE_DELAY_MS) {
      if (reading != pinCurrentState[i]) {
        pinCurrentState[i] = reading;

        if (pinCurrentState[i] == LOW) {
          sendButtonPress(pin);
        }
      }
    }

    pinLastState[i] = reading;
  }
}
