# Panduan Prompt Gemini Veo: Scene 04 — Studio Tata Letak Multi-Zona
### Blueprint Video Generatif AI (Google Gemini Veo / Veo 2) dengan Standar Nol Distorsi Teks (*Zero Text Distortion*)

Dokumen ini memuat instruksi prompt terstruktur dan siap pakai (*copy-paste ready*) untuk menghasilkan video generasi AI berkualitas tinggi (**Photorealistic 4K Cinematic**) menggunakan **Google Gemini Veo / Veo 2** khusus untuk **Scene 04: Studio Tata Letak Multi-Zona (`/studio/layouts`)**.

Durasi total scene adalah **20 detik**. Dokumen ini telah disesuaikan dengan **instruksi wajib anti-distorsi teks (*zero typographical deformation*)** agar teks antarmuka UI, angka jam, nomor antrean, dan running text tampil tajam, terbaca jelas, stabil, dan tidak mengalami *glitch/morphing*.

---

## 🚨 Aturan Wajib Anti-Distorsi Teks (Zero Text Distortion Guidelines)

Model video AI generatif sering kali mengalami kelemahan pada teks kecil (huruf meleleh, bergeser, atau berubah menjadi karakter aneh). Untuk mengatasi hal ini, terapkan **3 lapis pengamanan wajib**:

1. **Explicit Text Prompting**: Seluruh teks penting ditulis diapit tanda petik tunggal (`'...'`) dengan instruksi eksplisit ketajaman font:  
   *`"crystal-clear typography, razor-sharp vector-grade text rendering, zero letter warping, static legible characters without morphing or glyph distortion"`*.
2. **Negative Prompt Hardening**: Seluruh token anomali tipografi diblokir total di parameter negatif.
3. **Standar Produksi Industri (Dual Workflow)**:
   - **Metode A (Direct AI Generation)**: Gunakan prompt presisi di bawah dengan *Prompt Weight 8.5–9.0*.
   - **Metode B (VFX Screen Replacement / Planar Tracking — 100% Akurat)**: Model Veo meng-generate interaksi kreator dan laptop; layar laptop ditempel rekaman layar asli (*screen recording*) dari `sigma.dkaapis.test` menggunakan teknik *corner pin / planar tracking* di Premiere Pro / After Effects / DaVinci Resolve.

---

## 📋 Informasi Scene & Parameter Teknis

- **Nomor Scene**: Scene 04
- **Judul**: Desain Tata Letak Multi-Zona Bebas Atur
- **Durasi Total**: 20 Detik (00:00 – 00:20)
- **Halaman Aplikasi**: HNDSigma Layout Designer (`/studio/layouts`) & Android TV Player Display
- **Rasio Aspek**: `16:9` (1920x1080 / 3840x2160)
- **Gaya Visual**: *Cinematic Tech Commercial, Photorealistic 8K, Clean Modern Scandinavian Workspace & Premium Retail Aesthetic*
- **Kamera & Lensa**: *Arri Alexa 35 aesthetic, 50mm prime lens at f/2.0, subtle motorized slider tracking, shallow depth of field with creamy background bokeh*
- **Tata Cahaya**: *Soft natural morning daylight, warm 3200K interior accent lights, and subtle #0284c7 cyan-blue ambient reflections on screen glass*
- **Integritas Tipografi**: *Pixel-perfect anti-aliasing, static unwarped characters, razor-sharp vector legibility, zero typographic hallucination*

---

## ⏱️ Timeline Narasi & Sinkronisasi Suara (VO Perempuan)

| Waktu | Cuplikan Visual (Sub-Shot) | Naskah Voice Over (VO Suara Perempuan) | Efek Suara (SFX) |
|---|---|---|---|
| **00:00 – 00:05** | **Shot 4A**: Buka kanvas 16:9 & drag zona video utama | *"Bebaskan kreativitas Anda merancang tata letak layar..."* | Desir udara halus (*whoosh*), klik mouse renyah |
| **00:05 – 00:10** | **Shot 4B**: Pasang widget Jam Digital kaca & kartu Antrean | *"...tambahkan jam dinding elegan dan nomor antrean aktif..."* | Klik magnetik (*soft snap*), denting halus |
| **00:10 – 00:15** | **Shot 4C**: Pasang Running Text & klik Publikasikan | *"...lengkapi dengan teks promo berjalan di bagian bawah..."* | Gesekan teks mulus, bunyi klik tombol *glow* |
| **00:15 – 00:20** | **Shot 4D**: Transisi laptop ke TV Komersial di gerai toko | *"...dalam satu tampilan memikat yang siap memukau pelanggan Anda!"* | Transisi dinamis, denting simbal orkestra megah |

---

## 🎬 Prompt Gemini Veo per Sub-Shot (5 Detik Tiap Klip)

Setiap prompt telah diperkaya dengan klausa **Wajib Nol Distorsi Teks** dan detail antarmuka HNDSigma.

---

### Shot 4A (Detik 00:00 – 00:05): Buka Kanvas & Drag Zona Video Promo

#### Prompt Gemini Veo (Copy-Paste Ready):
```text
Cinematic close-up, over-the-shoulder shot of a stylish female creative director seated at a clean minimalist wooden desk working on a slim modern 16-inch laptop. On the laptop screen, the modern web UI of 'HNDSigma Studio' is displayed in dark mode with a dark slate-gray canvas in 16:9 ratio. All UI text, headers, and sidebar labels are razor-sharp, perfectly legible, with zero letter distortion or character morphing. A smooth white mouse cursor clicks on a library widget labeled 'Video Player' from the left sidebar and smoothly drags a glowing blue rectangle onto the center-left canvas. The dragged box snaps into place with a crisp boundary outline and instantly displays a vibrant, mouth-watering 4K video preview of gourmet grilled burgers with rising steam. Subtle camera push-in dolly forward. 50mm lens, f/2.2, soft bokeh background, natural office daylight with subtle cyan screen rim lighting on her fingers, 4k resolution, photorealistic, pristine typographic clarity, 60fps cinematic commercial quality.
```

#### Detail Anti-Distorsi Teks:
- Label sidebar `'Video Player'` dan title bar `'HNDSigma Studio'` harus rendered sebagai teks sans-serif tajam tanpa peleburan huruf.
- Garis tepi kanvas 16:9 lurus presisi tanpa gelombang distorsi.

---

### Shot 4B (Detik 00:05 – 00:10): Pasang Jam Glassmorphism & Kartu Antrean

#### Prompt Gemini Veo (Copy-Paste Ready):
```text
Tight macro shot focusing directly on the glowing laptop screen showing the HNDSigma Canvas Editor. The mouse cursor smoothly drags a translucent frosted-glass clock widget into the top-right corner of the canvas; the clock widget displays crisp, razor-sharp static white digital numbers '14:25' with perfect typographic definition and zero character morphing or blur. Immediately below the clock, the cursor drags and drops a sleek interactive Queue Card widget displaying the exact static legible text 'Nomor Antrean A-12'. The letters and numbers remain immaculately stable with zero typographic warping. The UI elements align with subtle magnetic guideline indicators in emerald green (#10b981). Smooth pan right following the cursor. Extremely sharp font rendering, frosted glass blur effect (glassmorphism), realistic anti-aliasing, warm studio ambient lighting reflecting softly on the screen glass, photorealistic, 4k UHD, commercial broadcast finish.
```

#### Detail Anti-Distorsi Teks:
- Angka jam `'14:25'` wajib berupa angka modern digital yang statis dan tegas, bukan angka acak yang berubah-ubah tiap frame.
- Teks `'Nomor Antrean A-12'` harus terbaca sempurna dari awal diletakkan hingga akhir shot tanpa perubahan bentuk huruf.

---

### Shot 4C (Detik 00:10 – 00:15): Pasang Ticker Text & Klik Simpan

#### Prompt Gemini Veo (Copy-Paste Ready):
```text
Medium close-up shot angled slightly from the side. On the lower portion of the 16:9 canvas layout, a horizontal banner ticker snaps into the bottom edge. Ultra-sharp, perfectly legible white sans-serif text scrolls smoothly from right to left across the dark navy banner reading: 'Spesial Hari Ini: Diskon Member 20% di Seluruh Menu'. Every letter and punctuation mark is stable, crisp, and completely free from text distortion or motion blur artifacts. The mouse cursor then glides to the top-right corner of the interface and clicks a glowing primary blue button labeled 'Simpan & Publikasikan' with a checkmark icon. Upon clicking, a subtle cyan ripple wave effect illuminates the button, followed by a sleek green floating notification: 'Tata Letak Berhasil Diterbitkan ke 100 Layar'. Smooth rack focus from the screen to the smiling, satisfied expression of the female creator. Cinematic lighting, photorealistic 8k, pristine UI typography, commercial color grading.
```

#### Detail Anti-Distorsi Teks:
- Teks berjalan `'Spesial Hari Ini: Diskon Member 20% di Seluruh Menu'` bergerak stabil dengan kecepatan konstan tanpa huruf melar atau berkedip.
- Tombol `'Simpan & Publikasikan'` dan notifikasi `'Tata Letak Berhasil Diterbitkan ke 100 Layar'` memiliki keterbacaan huruf 100% jelas.

---

### Shot 4D (Detik 00:15 – 00:20): Transisi Layar Laptop ke TV Komersial Toko

#### Prompt Gemini Veo (Copy-Paste Ready):
```text
Seamless fast camera whip-pan transition that zooms out from the laptop screen and seamlessly matches onto a massive 65-inch 4K commercial Android TV display mounted on a warm architectural brick wall inside a bustling, elegant modern café. The large TV screen is flawlessly displaying the exact multi-zone layout just created: full-motion steaming food video on the left, glowing frosted glass digital clock showing '14:25' on top right, queue number 'A-12' in the middle right, and the razor-sharp running text ticker at the bottom. All typography on the TV screen is crisp, high-contrast, perfectly legible from a distance, with zero pixelation or typographic deformation. Happy customers in the café look up admiringly at the vibrant display. Dynamic slow-motion tracking shot moving laterally past tables. Warm golden hour lighting, rich contrast, photorealistic textures, depth of field, high-end commercial ad aesthetic.
```

#### Detail Anti-Distorsi Teks:
- Tampilan TV komersial 65 inci menampilkan teks yang sama persis dengan apa yang didesain di laptop, tanpa penurunan kualitas atau teks buram.

---

## 🌟 Master Prompt Komprehensif (All-in-One 20-Second Sequence)

Jika Anda menggunakan Gemini Veo dalam mode *Single Prompt Sequence* (pembacaan skenario utuh sekaligus):

```text
A photorealistic 20-second cinematic commercial sequence demonstrating the 'HNDSigma Digital Signage' Multi-Zone Canvas Studio with 100% pristine, zero-distortion UI typography.

[00:00-00:05] Cinematic over-the-shoulder shot of a modern female marketing manager working on a sleek laptop displaying the HNDSigma web editor in dark mode. All UI labels are razor-sharp. She drags a 16:9 4K video widget of gourmet food onto the center canvas.
[00:05-00:10] Camera punches in closer as she drops a glassmorphism digital clock showing crisp static numbers '14:25' in the top-right and an interactive customer queue card reading 'Nomor Antrean A-12' underneath it, snapping with magnetic green alignment guides without any letter morphing.
[00:10-00:15] She adds a bottom running text ticker with smooth, perfectly legible scrolling text 'Spesial Hari Ini: Diskon Member 20%', then confidently clicks the glowing blue 'Simpan & Publikasikan' button, triggering a crisp green published notification.
[00:15-00:20] Fast seamless transition zooming out into a bustling, stylish flagship café where a large 65-inch wall-mounted Android TV screen displays the exact newly published multi-zone layout in full 4K clarity with sharp vector-quality text while customers smile and watch.

Arri Alexa 35 aesthetic, 50mm lens at f/2.0, photorealistic 8k, immaculate zero-distortion typography, natural daylight mixed with warm boutique indoor lighting, fluid camera motion, commercial grade color grading.
```

---

## 🚫 Negative Prompts Diperkuat (Wajib Disertakan di Gemini Veo)

Seluruh token penyebab kerusakan teks wajib dimasukkan ke kolom Negative Prompt:

```text
distorted text, warped typography, melted letters, misspelled words, blurry characters, text morphing, shifting glyphs, gibberish letters, pseudo-alphabet, hallucinated text, illegible UI labels, smeared fonts, flickering typography, deformed numbers, noisy characters, unreadable text, low resolution, pixelated edges, deformed hands, extra fingers, jittery motion, stuttering text, flickers, overexposed highlights, plastic skin, cheap graphics, watermarks, bad anatomy, messy layout, laggy animation, cartoon, 3D render look.
```

---

## 🎛️ Panduan Pengaturan Parameter di Gemini Veo

| Parameter | Nilai Rekomendasi | Alasan Khusus Anti-Distorsi Teks |
|---|---|---|
| **Aspect Ratio** | `16:9` | Format standar layar TV & kanvas aplikasi |
| **Resolution** | `4K UHD (3840 x 2160)` | Resolusi tinggi memberikan densitas piksel ekstra agar garis tepi huruf tajam |
| **Frame Rate** | `60 fps` | Menghilangkan *stutter* dan *motion blur* pada teks berjalan (*running text*) |
| **Motion Strength** | `4 / 10` (Low-Medium) | Meredam getaran kamera berlebih yang berisiko membuat teks buram |
| **Prompt Weight (CFG)** | `9.0 / 10` | Mengunci kepatuhan model AI terhadap teks di dalam tanda petik |
| **Duration per Generation** | `5 seconds` | Durasi pendek per klip meminimalkan risiko mutasi huruf di tengah video |

---

## 💡 Trik Studio Pascaproduksi: Planar Tracking Screen Replacement (100% Fail-Proof)

Jika Anda menginginkan **kemurnian visual 100% identik dengan aplikasi asli tanpa mengandalkan AI untuk merender huruf kecil**:

1. **Ambil Tangkapan Layar / Rekaman Layar Asli**: Buka `sigma.dkaapis.test/studio/layouts` di browser, rekam interaksi drag-and-drop asli dalam resolusi 4K.
2. **Generasi Veo Sebagai Background & Aktor**: Biarkan Gemini Veo merender suasana kantor, kreator wanita, gerakan tangan, dan bodi laptop.
3. **Planar Tracking di Editing**: Di software editing (*DaVinci Resolve / After Effects*), gunakan fitur *Planar Tracker (Mocha)* pada layar laptop, lalu tempelkan (*corner pin*) rekaman layar asli ke atas monitor laptop.
4. **Hasil**: Aktor dan atmosfer tetap sinematik kelas dunia dari Gemini Veo, sementara antarmuka UI dan teks dijamin **100% tajam, otentik, dan bebas distorsi apapun**.
