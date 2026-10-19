-- 0048_create_queue_sectors.up.sql

CREATE TABLE IF NOT EXISTS queue_sectors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    default_prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    ticket_label VARCHAR(100) NOT NULL DEFAULT 'Nomor Antrian',
    counter_label VARCHAR(100) NOT NULL DEFAULT 'Loket',
    tts_template_call TEXT NOT NULL,
    tts_template_recall TEXT NOT NULL,
    tts_template_break TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'layers',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial sector configurations (Resto/Kafe, Retail, Hospital, Bank, Public Service, Custom)
INSERT INTO queue_sectors (id, name, description, default_prefix, ticket_label, counter_label, tts_template_call, tts_template_recall, tts_template_break, icon, sort_order)
VALUES
    (
        'RETAIL_FB',
        'Restoran, Kafe & F&B',
        'Kedai kopi, kafe, resto cepat saji, dan pickup counter pesanan',
        'B',
        'Nomor Pesanan',
        'Pickup Point',
        'Pesanan {ticket_number}, silakan ambil di {counter_label} {counter_name}',
        'Panggilan ulang, pesanan {ticket_number}, silakan ambil di {counter_label} {counter_name}',
        '{counter_label} {counter_name} sedang istirahat',
        'coffee',
        1
    ),
    (
        'RETAIL',
        'Retail, Swalayan & Toko',
        'Kasir supermarket, toko ritel, dan layanan kasir antrian belanja',
        'R',
        'Nomor Antrian',
        'Kasir',
        '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
        'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
        '{counter_label} {counter_name} sedang istirahat',
        'shopping-bag',
        2
    ),
    (
        'HOSPITAL',
        'Rumah Sakit & Klinik',
        'Antrian poli dokter, pendaftaran pasien, instalasi farmasi & kasir medis',
        'A',
        'Nomor Antrian',
        'Poli',
        '{ticket_label} {ticket_number}, silakan masuk ke {counter_label} {counter_name}',
        'Panggilan ulang pasien, {ticket_label} {ticket_number}, silakan masuk ke {counter_label} {counter_name}',
        '{counter_label} {counter_name} sedang istirahat pelayanan',
        'activity',
        3
    ),
    (
        'BANK',
        'Perbankan & Keuangan',
        'Teller transaksi tunai, customer service pembukaan rekening & pembiayaan',
        'A',
        'Nomor Antrian',
        'Teller',
        '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
        'Panggilan ulang nasabah, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
        '{counter_label} {counter_name} sedang tutup sementara',
        'landmark',
        4
    ),
    (
        'PUBLIC_SERVICE',
        'Pelayanan Publik & Instansi',
        'Dukcapil, Samsat, Imigrasi, Mal Pelayanan Publik (MPP)',
        'C',
        'Nomor Antrian',
        'Loket',
        '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
        'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
        '{counter_label} {counter_name} sedang istirahat',
        'building',
        5
    ),
    (
        'CUSTOM',
        'Kustom / Sektor Lainnya',
        'Konfigurasi fleksibel dan penamaan label bebas sesuai kebutuhan spesifik Anda',
        'A',
        'Nomor Antrian',
        'Loket',
        '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
        'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
        '{counter_label} {counter_name} sedang istirahat',
        'settings',
        6
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_prefix = EXCLUDED.default_prefix,
    ticket_label = EXCLUDED.ticket_label,
    counter_label = EXCLUDED.counter_label,
    tts_template_call = EXCLUDED.tts_template_call,
    tts_template_recall = EXCLUDED.tts_template_recall,
    tts_template_break = EXCLUDED.tts_template_break,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
