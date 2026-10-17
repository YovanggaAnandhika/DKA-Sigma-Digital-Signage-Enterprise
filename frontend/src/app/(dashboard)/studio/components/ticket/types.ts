export type QueueItemType = 'ticket_number' | 'counter_loket' | 'marquee' | 'text_label' | 'media_asset';

export interface QueueLayoutItem {
  id: string;
  itemType: QueueItemType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '800' | '900';
  textAlign: 'left' | 'center' | 'right';
  templateContent: string;
  config: {
    speed?: 'slow' | 'normal' | 'fast';
    direction?: 'left' | 'right';
    badge?: string;
    badgeColor?: string;
    pulseOnCall?: boolean;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    mediaUrl?: string;
  };
  isVisible: boolean;
}

export interface QueueCounter {
  id: string;
  counterNumber: number;
  counterName: string;
  operatorName?: string;
  isActive: boolean;
  currentTicketNumber?: string;
  lastCalledAt?: string;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  prefix: string;
  sequenceNumber: number;
  status: 'waiting' | 'calling' | 'serving' | 'completed' | 'skipped';
  counterId?: string;
  calledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface QueueAudio {
  id: string;
  name: string;
  audioType: 'preset' | 'media_item' | 'custom_url';
  mediaItemId?: string;
  fileUrl?: string;
  volumePercent: number;
  isActive: boolean;
}

export interface QueueDisplayConfig {
  id: string;
  name: string;
  prefix: string;
  currentNumber: string;
  currentCounter: string;
  audioChimeEnabled: boolean;
  marqueeText: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundImageUrl?: string;
  themePreset: 'clean-light' | 'solid-dark' | 'medical-green' | 'executive-blue';
  autoRecallEnabled?: boolean;
  items: QueueLayoutItem[];
  counters: QueueCounter[];
  audios: QueueAudio[];
  createdAt?: string;
}

export const QUEUE_STORAGE_KEY = 'dka_signage_queue_displays';

export function injectQueueVariables(
  template: string,
  data: {
    queueNumber?: string;
    queueCounter?: string;
    queuePrefix?: string;
    queueName?: string;
    operatorName?: string;
    waitingCount?: number;
  }
): string {
  if (!template) return '';
  return template
    .replaceAll('$queue_number$', data.queueNumber || 'A-001')
    .replaceAll('$queue_counter$', data.queueCounter || 'LOKET 01')
    .replaceAll('$queue_prefix$', data.queuePrefix || 'A')
    .replaceAll('$queue_name$', data.queueName || 'Layar Antrian')
    .replaceAll('$operator_name$', data.operatorName || 'Petugas')
    .replaceAll('$waiting_count$', String(data.waitingCount ?? 0));
}

export function createDefaultQueueLayoutItems(theme: 'clean-light' | 'solid-dark' | 'medical-green' | 'executive-blue' = 'clean-light'): QueueLayoutItem[] {
  const isDark = theme === 'solid-dark' || theme === 'executive-blue';
  const primaryColor = theme === 'medical-green' ? '#059669' : isDark ? '#38bdf8' : '#0284c7';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const borderCol = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  return [
    {
      id: 'item-header',
      itemType: 'text_label',
      name: 'Judul Antrian',
      x: 40,
      y: 40,
      width: 1840,
      height: 70,
      zIndex: 1,
      backgroundColor: 'transparent',
      textColor: primaryColor,
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
      templateContent: '$queue_name$',
      config: {},
      isVisible: true,
    },
    {
      id: 'item-number-card',
      itemType: 'ticket_number',
      name: 'Nomor Antrian Panggilan',
      x: 460,
      y: 160,
      width: 1000,
      height: 520,
      zIndex: 2,
      backgroundColor: cardBg,
      textColor: primaryColor,
      fontSize: 120,
      fontWeight: '900',
      textAlign: 'center',
      templateContent: '$queue_number$',
      config: {
        pulseOnCall: true,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: borderCol,
      },
      isVisible: true,
    },
    {
      id: 'item-counter-badge',
      itemType: 'counter_loket',
      name: 'Label Meja / Loket',
      x: 710,
      y: 720,
      width: 500,
      height: 90,
      zIndex: 3,
      backgroundColor: '#f59e0b',
      textColor: '#ffffff',
      fontSize: 32,
      fontWeight: '800',
      textAlign: 'center',
      templateContent: '$queue_counter$',
      config: {
        borderRadius: 12,
        badge: 'LOKET TUJUAN',
      },
      isVisible: true,
    },
    {
      id: 'item-marquee-footer',
      itemType: 'marquee',
      name: 'Teks Informasi Berjalan (Marquee)',
      x: 0,
      y: 990,
      width: 1920,
      height: 90,
      zIndex: 4,
      backgroundColor: isDark ? '#020617' : '#0f172a',
      textColor: '#ffffff',
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'left',
      templateContent: 'PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil. Terima kasih.',
      config: {
        speed: 'normal',
        direction: 'left',
        badge: 'INFORMASI',
        badgeColor: '#ec4899',
      },
      isVisible: true,
    },
  ];
}

export const DEFAULT_QUEUES: QueueDisplayConfig[] = [];
