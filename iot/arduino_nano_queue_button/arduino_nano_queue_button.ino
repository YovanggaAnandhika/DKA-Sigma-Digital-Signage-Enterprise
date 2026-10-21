/*
 * =========================================================================================
 * DKASigma Digital Signage Enterprise - Arduino Nano USB Queue Button
 * Modul: Arduino Nano (ATmega328P / CH340 / FT232R)
 * Komunikasi: USB Serial (Baudrate 115200 bps)
 * 
 * Skema Pin Hardware:
 * - Pin D2: Pushbutton Panggil Berikutnya / NEXT CALL (Mode INPUT_PULLUP -> GND)
 * - Pin D3: Pushbutton Panggil Ulang / RECALL (Opsional) (INPUT_PULLUP -> GND)
 * - Pin D4: Pushbutton Istirahat Loket / BREAK (Opsional) (INPUT_PULLUP -> GND)
 * - Pin D13: LED Indikator Onboard (berkedip saat tombol ditekan & respon ACK)
 * 
 * Cara Kerja:
 * 1. Hubungkan Arduino Nano ke komputer loket via kabel USB.
 * 2. Saat tombol D2 ditekan ke GND, Arduino mendeteksi dan mengirim pesan "CALL_NEXT\n"
 *    melalui Serial USB.
 * 3. Konsol Loket DKASigma di browser (Chrome/Edge via Web Serial) otomatis memanggil antrean!
 * 4. Komputer membalas "OK\n", dan LED Pin 13 berkedip 2x sebagai konfirmasi.
 * =========================================================================================
 */

// =========================================================================================
// 1. DEFINISI PIN
// =========================================================================================
const int PIN_BTN_NEXT   = 2;   // Tombol Utama: Panggil Berikutnya (Next Call)
const int PIN_BTN_RECALL = 3;   // Tombol Opsional: Panggil Ulang (Recall)
const int PIN_BTN_BREAK  = 4;   // Tombol Opsional: Toggle Istirahat (Break)
const int PIN_LED_STATUS = 13;  // LED Onboard Arduino Nano

// =========================================================================================
// 2. DEBOUNCING KONFIGURASI
// =========================================================================================
const unsigned long DEBOUNCE_DELAY_MS = 60; // 60ms debouncing presisi anti double-click

struct ButtonWatcher {
  int pin;
  int lastState;
  int stableState;
  unsigned long lastDebounceTime;
  const char* actionCommand;
};

ButtonWatcher buttons[] = {
  { PIN_BTN_NEXT,   HIGH, HIGH, 0, "CALL_NEXT" },
  { PIN_BTN_RECALL, HIGH, HIGH, 0, "RECALL" },
  { PIN_BTN_BREAK,  HIGH, HIGH, 0, "TOGGLE_BREAK" }
};
const int NUM_BUTTONS = sizeof(buttons) / sizeof(buttons[0]);

// =========================================================================================
// 3. SETUP
// =========================================================================================
void setup() {
  // Inisialisasi Serial USB dengan baudrate tinggi 115200 bps
  Serial.begin(115200);

  // Inisialisasi pin tombol sebagai INPUT_PULLUP (Internal 20k resistor pull-up aktif)
  // Kaki tombol cukup disambungkan ke Pin D2/D3/D4 dan kaki lainnya ke pin GND!
  for (int i = 0; i < NUM_BUTTONS; i++) {
    pinMode(buttons[i].pin, INPUT_PULLUP);
    buttons[i].lastState = digitalRead(buttons[i].pin);
    buttons[i].stableState = buttons[i].lastState;
    buttons[i].lastDebounceTime = 0;
  }

  // Pin LED onboard
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_LED_STATUS, LOW);

  // Kedipkan LED 3x saat pertama kali booting
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_LED_STATUS, HIGH);
    delay(70);
    digitalWrite(PIN_LED_STATUS, LOW);
    delay(70);
  }

  Serial.println(F("[DKASigma] Arduino Nano USB Queue Button Siap (Baud: 115200)"));
}

// =========================================================================================
// 4. LOOP UTAMA
// =========================================================================================
void loop() {
  unsigned long now = millis();

  // 1. Baca status tiap tombol dengan software debouncing
  for (int i = 0; i < NUM_BUTTONS; i++) {
    int reading = digitalRead(buttons[i].pin);

    if (reading != buttons[i].lastState) {
      buttons[i].lastDebounceTime = now;
    }

    if ((now - buttons[i].lastDebounceTime) > DEBOUNCE_DELAY_MS) {
      if (reading != buttons[i].stableState) {
        buttons[i].stableState = reading;

        // Tombol ditekan (Logika LOW karena INPUT_PULLUP)
        if (buttons[i].stableState == LOW) {
          onButtonPressed(buttons[i].actionCommand, buttons[i].pin);
        }
      }
    }

    buttons[i].lastState = reading;
  }

  // 2. Baca respon ACK serial dari browser/komputer (jika ada balasan "OK")
  if (Serial.available() > 0) {
    String incoming = Serial.readStringUntil('\n');
    incoming.trim();
    if (incoming == "OK" || incoming.startsWith("OK")) {
      blinkAckSuccess();
    }
  }
}

// =========================================================================================
// 5. EVENT SAAT TOMBOL DITEKAN
// =========================================================================================
void onButtonPressed(const char* action, int pin) {
  // Nyalakan LED sesaat tanda tombol fisik terpicu
  digitalWrite(PIN_LED_STATUS, HIGH);

  // Kirim perintah Serial ke komputer
  Serial.println(action);

  delay(40);
  digitalWrite(PIN_LED_STATUS, LOW);
}

// Kedip 2x cepat saat server/browser merespon konfirmasi aksi berhasil
void blinkAckSuccess() {
  for (int i = 0; i < 2; i++) {
    digitalWrite(PIN_LED_STATUS, HIGH);
    delay(50);
    digitalWrite(PIN_LED_STATUS, LOW);
    delay(50);
  }
}
