import type { QueueDisplayConfig } from '../types';

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

  const counterObj = queueConfig?.counters?.find((c) => c.counterName === counterName);
  const operatorName = counterObj?.operatorName || '';

  const hour = new Date().getHours();
  const timeGreeting = hour >= 4 && hour < 11 ? 'selamat pagi' : hour >= 11 && hour < 15 ? 'selamat siang' : hour >= 15 && hour < 18 ? 'selamat sore' : 'selamat malam';
  const timePeriod = hour >= 4 && hour < 11 ? 'pagi' : hour >= 11 && hour < 15 ? 'siang' : hour >= 15 && hour < 18 ? 'sore' : 'malam';
  const queueName = queueConfig?.name || '';
  const waitingCount = queueConfig?.waitingTicketsCount ?? 0;

  // Label pos/loket murni diambil dari konfigurasi (contoh: Poli, Kasir, Teller, Loket)
  const ticketLabel = (queueConfig?.ticketLabel || 'Nomor Antrian').trim();
  const counterLabel = (queueConfig?.counterLabel || 'Loket').trim();
  const rawTemplate = isRecall
    ? (queueConfig?.ttsTemplateRecall || 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}')
    : (queueConfig?.ttsTemplateCall || '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}');

  const formattedTicket = `${cleanPrefix}... ${spokenDigits}`;

  // Ekstrak nama/nomor unik pos tanpa kata awalan (contoh: "LOKET 01" -> "1", "POLI 02" -> "2", "Poli Gigi" -> "Gigi")
  const labelPrefixRegex = new RegExp(`^(?:${counterLabel}|loket|poli|teller|kasir|meja|counter)\\s*`, 'i');
  let cleanCounterName = (counterName || '1').trim().replace(labelPrefixRegex, '').trim();
  if (/^0+\d+$/.test(cleanCounterName)) {
    cleanCounterName = cleanCounterName.replace(/^0+/, '');
  }
  if (!cleanCounterName) {
    cleanCounterName = counterName.replace(/[^0-9]/g, '') || '1';
  }

  const counterNameInTemplate = rawTemplate.includes('{counter_label}')
    ? cleanCounterName
    : `${counterLabel} ${cleanCounterName}`.trim();

  return rawTemplate
    .replaceAll('{ticket_label}', ticketLabel)
    .replaceAll('{counter_label}', counterLabel)
    .replaceAll('{ticket_number}', formattedTicket)
    .replaceAll('{ticket_prefix}', cleanPrefix)
    .replaceAll('{ticket_digits}', spokenDigits)
    .replaceAll('{counter_name}', counterNameInTemplate)
    .replaceAll('{counter_number}', counterName.replace(/[^0-9]/g, '') || cleanCounterName)
    .replaceAll('{operator_name}', operatorName)
    .replaceAll('{petugas}', operatorName)
    .replaceAll('{queue_name}', queueName)
    .replaceAll('{nama_antrian}', queueName)
    .replaceAll('{salam}', timeGreeting)
    .replaceAll('{waktu}', timePeriod)
    .replaceAll('{waiting_count}', String(waitingCount))
    .replaceAll('{sisa_antrian}', String(waitingCount))
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
  const counterLabel = (queueConfig?.counterLabel || 'Loket').trim();
  const counterObj = queueConfig?.counters?.find((c) => c.counterName === counterName);
  const operatorName = counterObj?.operatorName || '';

  const labelPrefixRegex = new RegExp(`^(?:${counterLabel}|loket|poli|teller|kasir|meja|counter)\\s*`, 'i');
  let cleanCounterName = (counterName || '1').trim().replace(labelPrefixRegex, '').trim();
  if (/^0+\d+$/.test(cleanCounterName)) {
    cleanCounterName = cleanCounterName.replace(/^0+/, '');
  }
  if (!cleanCounterName) {
    cleanCounterName = counterName.replace(/[^0-9]/g, '') || '1';
  }

  const hour = new Date().getHours();
  const timeGreeting = hour >= 4 && hour < 11 ? 'selamat pagi' : hour >= 11 && hour < 15 ? 'selamat siang' : hour >= 15 && hour < 18 ? 'selamat sore' : 'selamat malam';
  const timePeriod = hour >= 4 && hour < 11 ? 'pagi' : hour >= 11 && hour < 15 ? 'siang' : hour >= 15 && hour < 18 ? 'sore' : 'malam';
  const queueName = queueConfig?.name || '';

  const rawTemplate =
    status === 'BREAK'
      ? (queueConfig?.ttsTemplateBreak || '{counter_label} {counter_name} sedang istirahat')
      : status === 'LOCKED'
      ? '{counter_label} {counter_name} telah ditutup'
      : '{counter_label} {counter_name} siap melayani';

  const counterNameInTemplate = rawTemplate.includes('{counter_label}')
    ? cleanCounterName
    : `${counterLabel} ${cleanCounterName}`.trim();

  const text = rawTemplate
    .replaceAll('{counter_label}', counterLabel)
    .replaceAll('{counter_name}', counterNameInTemplate)
    .replaceAll('{counter_number}', counterName.replace(/[^0-9]/g, '') || cleanCounterName)
    .replaceAll('{operator_name}', operatorName)
    .replaceAll('{petugas}', operatorName)
    .replaceAll('{queue_name}', queueName)
    .replaceAll('{nama_antrian}', queueName)
    .replaceAll('{salam}', timeGreeting)
    .replaceAll('{waktu}', timePeriod)
    .replaceAll(/\s+/g, ' ')
    .trim();

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
