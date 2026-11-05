/*
 * =========================================================================================
 * DKASigma Digital Signage Enterprise - IoT Queue Controller Firmware
 * Modul: NodeMCU ESP32 (ESP-WROOM-32 / ESP32 Dev Module)
 * Protokol: MQTT (PubSubClient) + JSON (ArduinoJson)
 *
 * Fitur:
 * - Multi-tombol fisik berbasis pin GPIO (INPUT_PULLUP)
 * - Otomatis mendeteksi MAC Address sebagai Device UID (tanpa perlu setting
 * manual)
 * - Anti-bouncing presisi berbasis millis() (50ms debouncing)
 * - Penanganan ACK visual LED: Kedip 2x jika aksi berhasil, kedip lambat jika
 * dinonaktifkan
 * - Telemetri periodik (Wi-Fi RSSI, IP address, uptime) tiap 30 detik
 * =========================================================================================
 */

#include <ArduinoJson.h>
#include <DNSServer.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WebServer.h>

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
const unsigned long BOOT_RESET_HOLD_MS = 15000;

// =========================================================================================
// 2. KONFIGURASI PIN HARDWARE
// =========================================================================================
// Pin LED Indikator Onboard (Umumnya GPIO 2 pada modul NodeMCU ESP32)
const int PIN_LED_STATUS = 2;

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

  // Parsing respon ACK dari server
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (!err) {
    const char *status = doc["status"] | "OK";
    const char *action = doc["action"] | "";
    const char *msg = doc["message"] | "";

    Serial.printf("[ACK] Status: %s, Aksi: %s, Pesan: %s\n", status, action,
                  msg);

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

  Serial.println("=================================================");
  Serial.println("   DKASigma Digital Signage - IoT Controller    ");
  Serial.print("   DEVICE UID : ");
  Serial.println(deviceUid);
  Serial.println("=================================================");
}

String configPage() {
  String page = F(
      "<!doctype html><html lang='id'><meta name='viewport' "
      "content='width=device-width,initial-scale=1'><title>Setup IoT</title>"
      "<style>body{font:16px system-ui;max-width:520px;margin:32px auto;"
      "padding:0 16px;color:#172033}label{display:block;margin:14px 0 5px}"
      "input,select,button{box-sizing:border-box;width:100%;padding:11px;"
      "font:inherit}button{margin-top:12px;cursor:pointer}.hint{color:#596579}"
      "</style><h1>Setup IoT Queue Button</h1><p>Pilih Wi-Fi dan isi endpoint "
      "MQTT server signage.</p><p><strong>Setup Wi-Fi terbuka dan tidak "
      "terenkripsi. Lakukan di lokasi terkontrol.</strong></p><p>MQTT saat ini "
      "tanpa TLS; jangan gunakan broker plaintext di internet.</p><form id='setup'>"
      "<label>Nama Wi-Fi (SSID)</label><div style='display:flex;gap:8px'>"
      "<select id='networks'><option value=''>Pilih hasil pemindaian</option>"
      "</select><button type='button' id='scan' style='width:auto'>Pindai</button>"
      "</div><input name='ssid' id='ssid' maxlength='32' required "
      "placeholder='SSID Wi-Fi'>"
      "<label>Password Wi-Fi</label><input name='wifi_password' type='password' "
      "maxlength='64' autocomplete='new-password'>"
      "<label>Endpoint broker MQTT (hostname/IP)</label><input "
      "name='mqtt_server' maxlength='127' required value='");
  page += escapeHtml(String(mqttServer));
  page += F("' placeholder='mqtt.example.com'>"
            "<label>Port MQTT (TCP tanpa TLS)</label><input name='mqtt_port' type='number' "
            "min='1' max='65535' required value='");
  page += String(mqttPort);
  page += F("'><label>Username MQTT (opsional)</label><input name='mqtt_user' "
            "maxlength='63' autocomplete='username'>"
            "<label>Password MQTT (opsional)</label><input name='mqtt_password' "
            "type='password' maxlength='63' autocomplete='new-password'>"
            "<button type='submit'>Simpan dan sambungkan</button></form>"
            "<p class='hint' id='status'>Access point setup akan mati setelah "
            "Wi-Fi berhasil tersambung.</p>"
            "<script>const s=document.querySelector('#status'),n=document."
            "querySelector('#networks'),ssid=document.querySelector('#ssid');"
            "document.querySelector('#scan').onclick=async()=>{s.textContent="
            "'Memindai Wi-Fi...';try{let r=await fetch('/scan'),a=await r.json();"
            "n.innerHTML='<option value=\"\">Pilih hasil pemindaian</option>';"
            "a.forEach(x=>{let o=document.createElement('option');o.value=x.ssid;"
            "o.textContent=x.ssid+' ('+x.rssi+' dBm)';n.append(o)});"
            "s.textContent=a.length?'Pilih jaringan atau masukkan SSID manual.':"
            "'Tidak ada jaringan ditemukan.'}catch(e){s.textContent='Gagal "
            "memindai Wi-Fi.'}};n.onchange=()=>{if(n.value)ssid.value=n.value};"
            "document.querySelector('#setup').onsubmit=async e=>{e.preventDefault();"
            "s.textContent='Mencoba menghubungkan ke Wi-Fi...';try{let r=await "
            "fetch('/save',{method:'POST',body:new URLSearchParams(new "
            "FormData(e.target))});let d=await r.json();s.textContent=d.message;"
            "if(d.state==='connecting'){let t=setInterval(async()=>{try{let x="
            "await(await fetch('/status')).json();if(x.state==='failed'){"
            "clearInterval(t);s.textContent=x.message}}catch(_){clearInterval(t);"
            "s.textContent='ESP32 tersambung; access point setup ditutup.'}},"
            "1000)}}catch(_){s.textContent='Koneksi dimulai. Jika Wi-Fi berhasil,"
            " access point setup akan ditutup.'}};</script></html>");
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
  String apName = "DKASigma-Setup-" + mac.substring(mac.length() - 6);
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
  digitalWrite(PIN_LED_STATUS, HIGH);
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
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    delay(250);
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Wi-Fi] Gagal tersambung; membuka setup.");
    startConfigPortal();
    return;
  }

  digitalWrite(PIN_LED_STATUS, HIGH);
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
    digitalWrite(PIN_LED_STATUS, LOW);
    return;
  }

  Serial.println("BERHASIL!");
  digitalWrite(PIN_LED_STATUS, HIGH);
  mqttClient.subscribe(topicAck);
  Serial.printf("[MQTT Sub] Berlangganan: %s\n", topicAck);
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
    } else if (bootPressActive) {
      unsigned long heldFor = millis() - bootPressStartedAt;
      if (!bootResetTriggered && heldFor < BOOT_RESET_HOLD_MS &&
          !configPortalActive) {
        sendButtonPress(13);
      }
      bootPressActive = false;
      bootResetTriggered = false;
    }
  }

  if (bootPressActive && !bootResetTriggered &&
      millis() - bootPressStartedAt > BOOT_RESET_HOLD_MS) {
    bootResetTriggered = true;
    bool wifiSettingsRemoved =
        settingsReady &&
        ((!settings.isKey("ssid") || settings.remove("ssid")) &&
         (!settings.isKey("wifi_pass") || settings.remove("wifi_pass")));
    wifiSsid[0] = '\0';
    wifiPassword[0] = '\0';
    mqttClient.disconnect();
    WiFi.disconnect(false, false);
    if (configPortalActive) {
      stopConfigPortal();
    }
    Serial.println(wifiSettingsRemoved
                       ? "[Setup] Wi-Fi direset. Kepemilikan dan endpoint MQTT tetap."
                       : "[Setup] Gagal mereset Wi-Fi dari NVS; periksa penyimpanan.");
    startConfigPortal();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.persistent(false);

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

    if (mqttClient.connected() &&
        millis() - lastTelemetryTime > TELEMETRY_INTERVAL_MS) {
      lastTelemetryTime = millis();
      sendTelemetry();
    }
  }

  if (configPortalActive)
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
