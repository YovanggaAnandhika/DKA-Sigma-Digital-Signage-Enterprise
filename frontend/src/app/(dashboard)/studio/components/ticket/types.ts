export interface QueueDisplayConfig {
  id: string;
  name: string;
  prefix: string;
  currentNumber: string;
  currentCounter: string;
  audioChimeEnabled: boolean;
  marqueeText: string;
  createdAt?: string;
}

export const QUEUE_STORAGE_KEY = 'dka_signage_queue_displays';

export const DEFAULT_QUEUES: QueueDisplayConfig[] = [
  {
    id: 'q-1',
    name: 'Antrian Kasir Utama & CS',
    prefix: 'A',
    currentNumber: 'A-024',
    currentCounter: 'LOKET 02',
    audioChimeEnabled: true,
    marqueeText: 'Silakan menuju loket saat nomor Anda dipanggil. Terima kasih atas kesabaran Anda.',
    createdAt: '2026-10-08',
  },
  {
    id: 'q-2',
    name: 'Antrian Pengambilan Obat / Farmasi',
    prefix: 'B',
    currentNumber: 'B-015',
    currentCounter: 'LOKET 01',
    audioChimeEnabled: true,
    marqueeText: 'Harap persiapkan struk resep Anda sebelum menuju loket kasir.',
    createdAt: '2026-10-08',
  },
];
