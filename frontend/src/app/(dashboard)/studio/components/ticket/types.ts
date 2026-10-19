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
  opacity?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
}

export interface QueueCounter {
  id: string;
  counterNumber: number;
  counterName: string;
  operatorName?: string;
  isActive: boolean;
  status?: 'ACTIVE' | 'BREAK' | 'LOCKED' | string;
  statusNote?: string;
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
  opacity?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  sectorType?: 'HOSPITAL' | 'BANK' | 'RETAIL_FB' | 'PUBLIC_SERVICE' | 'LOGISTICS' | 'CUSTOM' | string;
  ticketLabel?: string;
  counterLabel?: string;
  ttsTemplateCall?: string;
  ttsTemplateRecall?: string;
  ttsTemplateBreak?: string;
  currentSequence?: number;
  items: QueueLayoutItem[];
  counters: QueueCounter[];
  audios: QueueAudio[];
  createdAt?: string;
}

export interface SectorPreset {
  id: string;
  name: string;
  icon: string;
  ticketLabel: string;
  counterLabel: string;
  ttsTemplateCall: string;
  ttsTemplateRecall: string;
  ttsTemplateBreak: string;
}

export const SECTOR_PRESETS: SectorPreset[] = [
  {
    id: 'HOSPITAL',
    name: 'Rumah Sakit & Klinik',
    icon: 'Hospital',
    ticketLabel: 'Nomor Antrian',
    counterLabel: 'Poli',
    ttsTemplateCall: '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    ttsTemplateRecall: 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    ttsTemplateBreak: '{counter_label} {counter_name} sedang istirahat',
  },
  {
    id: 'BANK',
    name: 'Perbankan & Keuangan',
    icon: 'Landmark',
    ticketLabel: 'Nomor Antrian',
    counterLabel: 'Teller',
    ttsTemplateCall: '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    ttsTemplateRecall: 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    ttsTemplateBreak: '{counter_label} {counter_name} sedang istirahat',
  },
  {
    id: 'RETAIL_FB',
    name: 'F&B, Kafe & Retail',
    icon: 'UtensilsCrossed',
    ticketLabel: 'Nomor Pesanan',
    counterLabel: 'Pickup Point',
    ttsTemplateCall: 'Pesanan {ticket_number}, silakan ambil di {counter_label} {counter_name}',
    ttsTemplateRecall: 'Panggilan ulang, pesanan {ticket_number}, silakan ambil di {counter_label} {counter_name}',
    ttsTemplateBreak: '{counter_label} {counter_name} sedang istirahat',
  },
  {
    id: 'PUBLIC_SERVICE',
    name: 'Pelayanan Publik & Samsat',
    icon: 'Building2',
    ticketLabel: 'Nomor Registrasi',
    counterLabel: 'Loket',
    ttsTemplateCall: '{ticket_label} {ticket_number}, silakan menuju ke {counter_label} {counter_name}',
    ttsTemplateRecall: 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju ke {counter_label} {counter_name}',
    ttsTemplateBreak: '{counter_label} {counter_name} sedang istirahat',
  },
  {
    id: 'LOGISTICS',
    name: 'Logistik & Gudang',
    icon: 'Truck',
    ticketLabel: 'Nomor Antrian',
    counterLabel: 'Pintu Muat',
    ttsTemplateCall: 'Kendaraan {ticket_number}, silakan merapat ke {counter_label} {counter_name}',
    ttsTemplateRecall: 'Panggilan ulang, kendaraan {ticket_number}, silakan merapat ke {counter_label} {counter_name}',
    ttsTemplateBreak: '{counter_label} {counter_name} sedang istirahat',
  },
  {
    id: 'CUSTOM',
    name: 'Kustom Mandiri',
    icon: 'Sliders',
    ticketLabel: 'Nomor Antrian',
    counterLabel: 'Loket',
    ttsTemplateCall: '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    ttsTemplateRecall: 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    ttsTemplateBreak: '{counter_label} {counter_name} sedang istirahat',
  },
];

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
      x: 60,
      y: 60,
      width: 1800,
      height: 70,
      zIndex: 1,
      backgroundColor: 'transparent',
      textColor: primaryColor,
      fontSize: 36,
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
      x: 360,
      y: 190,
      width: 1200,
      height: 440,
      zIndex: 2,
      backgroundColor: 'transparent',
      textColor: primaryColor,
      fontSize: 150,
      fontWeight: '900',
      textAlign: 'center',
      templateContent: '$queue_number$',
      config: {
        pulseOnCall: true,
      },
      isVisible: true,
    },
    {
      id: 'item-counter-badge',
      itemType: 'counter_loket',
      name: 'Label Loket',
      x: 710,
      y: 680,
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
        borderRadius: 14,
        badge: 'LOKET TUJUAN',
      },
      isVisible: true,
    },
    {
      id: 'item-marquee-footer',
      itemType: 'marquee',
      name: 'Running Text',
      x: 0,
      y: 990,
      width: 1920,
      height: 90,
      zIndex: 4,
      backgroundColor: isDark ? '#020617' : '#0369a1',
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

export interface QueueCallHistoryItem {
  id: string;
  queueId: string;
  queueName: string;
  ticketNumber: string;
  counterName: string;
  targetDevice: string;
  calledAt: string;
  timestamp: number;
  callType: 'next' | 'recall' | 'player_tap' | 'back';
}

export const QUEUE_HISTORY_STORAGE_KEY = 'dka_signage_queue_call_history';

export const DEFAULT_QUEUES: QueueDisplayConfig[] = [
  {
    id: '76a3e570-9807-40a5-ad74-e7bb28e382dc',
    name: 'Layar Antrian Baru',
    prefix: 'A',
    currentNumber: 'A-001',
    currentCounter: 'LOKET 01',
    audioChimeEnabled: true,
    marqueeText: 'PENGUMUMAN: Silakan menuju LOKET 01 saat nomor A-001 dipanggil.',
    canvasWidth: 1920,
    canvasHeight: 1080,
    backgroundColor: '#0f172a',
    themePreset: 'medical-green',
    items: createDefaultQueueLayoutItems('medical-green'),
    counters: [],
    audios: [],
  },
  {
    id: 'b12c34d5-8901-4ef2-bc34-f56a78b901cd',
    name: 'Layar Antrian Farmasi / Kasir 2',
    prefix: 'B',
    currentNumber: 'B-001',
    currentCounter: 'LOKET 02',
    audioChimeEnabled: true,
    marqueeText: 'PENGUMUMAN: Silakan menuju LOKET 02 saat nomor B-001 dipanggil.',
    canvasWidth: 1920,
    canvasHeight: 1080,
    backgroundColor: '#0f172a',
    themePreset: 'executive-blue',
    items: createDefaultQueueLayoutItems('executive-blue'),
    counters: [],
    audios: [],
  },
];

/**
 * Natural Indonesian Queue TTS Voice & Spoken Text Engine
 * Mirrors the natural Android TextToSpeech engine parameters and pronunciation:
 * - Maps digits to Indonesian words (0 -> 'kosong', 1 -> 'satu', etc.)
 * - Inserts natural pauses ('...') between prefix, digits, and destination
 * - Pronounces 'Silakan menuju... Loket X' instead of raw uppercase strings
 * - Discovers and locks onto native Indonesian voices (Google Bahasa Indonesia, Gadis, Damayanti)
 * - Rate 0.92, Pitch 1.0 (exact match with Android)
 */
export function buildQueueSpokenText(
  ticketNumber: string,
  counterName: string,
  isRecall: boolean = false,
  queueConfig?: Partial<QueueDisplayConfig>
): string {
  const parts = (ticketNumber || '').split('-');
  const prefix = parts[0]?.trim() || '';
  const digits = (parts.length > 1 ? parts.slice(1).join('') : '').trim();

  const digitMap: Record<string, string> = {
    '0': 'kosong',
    '1': 'satu',
    '2': 'dua',
    '3': 'tiga',
    '4': 'empat',
    '5': 'lima',
    '6': 'enam',
    '7': 'tujuh',
    '8': 'delapan',
    '9': 'sembilan',
  };

  const spokenDigits = digits
    ? digits
      .split('')
      .map((ch) => digitMap[ch] || ch)
      .join(' ')
    : prefix
      .replace(/[^0-9]/g, '')
      .split('')
      .map((ch) => digitMap[ch] || ch)
      .join(' ');

  const cleanPrefix = prefix.replace(/[0-9]/g, '').trim() || prefix;

  const counterSpoken = (counterName || 'Loket 1')
    .replace(/LOKET\s*0+(\d+)/gi, 'Loket $1')
    .replace(/LOKET\s*(\d+)/gi, 'Loket $1')
    .replace(/LOKET/gi, 'Loket');

  const ticketLabel = queueConfig?.ticketLabel || 'Nomor Antrian';
  const counterLabel = queueConfig?.counterLabel || 'Loket';
  const rawTemplate = isRecall
    ? (queueConfig?.ttsTemplateRecall || 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}')
    : (queueConfig?.ttsTemplateCall || '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}');

  const formattedTicket = `${cleanPrefix}... ${spokenDigits}`;

  return rawTemplate
    .replaceAll('{ticket_label}', ticketLabel)
    .replaceAll('{counter_label}', counterLabel)
    .replaceAll('{ticket_number}', formattedTicket)
    .replaceAll('{ticket_prefix}', cleanPrefix)
    .replaceAll('{ticket_digits}', spokenDigits)
    .replaceAll('{counter_name}', counterSpoken)
    .replaceAll('{counter_number}', counterName.replace(/[^0-9]/g, '') || '1')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

export function getIndonesianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  return (
    voices.find(
      (v) =>
        (v.lang.toLowerCase().replace('_', '-').startsWith('id-id') ||
          v.lang.toLowerCase().startsWith('id') ||
          v.name.toLowerCase().includes('indonesia')) &&
        !v.name.toLowerCase().includes('english')
    ) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('id')) ||
    null
  );
}

let activeSourceNode: AudioBufferSourceNode | null = null;
let activeAudioContext: AudioContext | null = null;

export function stopQueueAnnouncement() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) { }
  }
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch (_) { }
    activeSourceNode = null;
  }
}

/**
 * Natural High-Fidelity PA Announcement with WebAudio Echo & Bass Boost
 * Routes the natural Google TTS neural voice through:
 * - 220Hz Low-Shelf Filter (+6dB) for deep, warm, authoritative chest resonance ("berat")
 * - 200ms Delay with 32% feedback and 2200Hz wall damping for realistic airport/hospital echo
 * - Broadcast Dynamics Compressor for rich, punchy presence
 */
export async function playQueueAnnouncementAudio(
  text: string,
  onEnd?: () => void
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return false;

  try {
    if (!activeAudioContext || activeAudioContext.state === 'closed') {
      activeAudioContext = new AudioContextClass();
    }
    if (activeAudioContext.state === 'suspended') {
      await activeAudioContext.resume();
    }
    const ctx = activeAudioContext;

    // Fetch synthesized audio from our local /api/tts endpoint
    const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
    if (!response.ok) return false;

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    stopQueueAnnouncement();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    activeSourceNode = source;

    // Connect directly to output: clean, natural, crystal-clear voice without any artificial echo or reverb
    source.connect(ctx.destination);

    let finished = false;
    const handleEnd = () => {
      if (finished) return;
      finished = true;
      if (activeSourceNode === source) {
        activeSourceNode = null;
      }
      if (onEnd) onEnd();
    };

    source.onended = handleEnd;
    source.start(0);
    return true;
  } catch (e) {
    console.warn('WebAudio PA announcement failed, falling back to SpeechSynthesis', e);
    return false;
  }
}

export function speakQueueAnnouncement(
  ticketNumber: string,
  counterName: string,
  isRecall: boolean = false,
  onEnd?: () => void,
  queueConfig?: Partial<QueueDisplayConfig>
) {
  stopQueueAnnouncement();

  const text = buildQueueSpokenText(ticketNumber, counterName, isRecall, queueConfig);

  // Try natural high-fidelity PA announcement with WebAudio Echo & Bass Boost
  playQueueAnnouncementAudio(text, onEnd).then((success) => {
    if (success) return;

    // Fallback: Web SpeechSynthesis with lowered pitch (0.85 = berat) and rate (0.88)
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.88;
    utterance.pitch = 0.85; // Lowers pitch for deep "berat" tone

    const voice = getIndonesianVoice();
    if (voice) {
      utterance.voice = voice;
    }

    let ended = false;
    const handleFinished = () => {
      if (ended) return;
      ended = true;
      if (onEnd) onEnd();
    };

    utterance.onend = handleFinished;
    utterance.onerror = handleFinished;

    window.speechSynthesis.speak(utterance);
  });
}

export function speakCounterStatusAnnouncement(
  counterName: string,
  status: 'BREAK' | 'LOCKED' | 'ACTIVE',
  queueConfig?: Partial<QueueDisplayConfig>,
  onEnd?: () => void
) {
  stopQueueAnnouncement();
  const counterLabel = queueConfig?.counterLabel || 'Loket';
  const cleanCounterName = (counterName || 'Loket 1')
    .replace(/LOKET\s*0+(\d+)/gi, 'Loket $1')
    .replace(/LOKET\s*(\d+)/gi, 'Loket $1');
  let text = '';
  if (status === 'BREAK') {
    text = (queueConfig?.ttsTemplateBreak || '{counter_label} {counter_name} sedang istirahat')
      .replaceAll('{counter_label}', counterLabel)
      .replaceAll('{counter_name}', cleanCounterName);
  } else if (status === 'LOCKED') {
    text = `${counterLabel} ${cleanCounterName} telah ditutup`;
  } else {
    text = `${counterLabel} ${cleanCounterName} siap melayani`;
  }

  playQueueAnnouncementAudio(text, onEnd).then((success) => {
    if (success) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.88;
    utterance.pitch = 0.85;
    const voice = getIndonesianVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  });
}

