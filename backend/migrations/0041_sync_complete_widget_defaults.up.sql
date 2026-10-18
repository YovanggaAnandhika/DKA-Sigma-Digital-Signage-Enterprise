-- 0041_sync_complete_widget_defaults.up.sql
UPDATE tickers 
SET name = 'Pengumuman Promo Kasir & Diskon Member', 
    badge = 'PROMO HARI INI', 
    messages = ARRAY['Dapatkan diskon 20% untuk semua produk segar buah & sayur setiap hari Jumat hingga Minggu!', 'Gunakan kartu member DKASigma Point untuk mendapatkan poin ganda di seluruh kasir.'], 
    theme = 'blue' 
WHERE id = 'c0000000-0000-0000-0000-000000000001';

UPDATE queue_displays 
SET name = 'Layar Antrian Baru', 
    theme_preset = 'medical-green', 
    background_color = '#0f172a' 
WHERE id = '76a3e570-9807-40a5-ad74-e7bb28e382dc';

UPDATE clocks 
SET name = 'Widget Jam Utama Makassar' 
WHERE id = 'd0000000-0000-0000-0000-000000000001';

