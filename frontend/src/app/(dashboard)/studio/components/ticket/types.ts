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
  waitingTicketsCount?: number;
  items: QueueLayoutItem[];
  counters: QueueCounter[];
  audios: QueueAudio[];
  createdAt?: string;
}

export interface QueueSector {
  id: string;
  name: string;
  description?: string;
  defaultPrefix?: string;
  ticketLabel: string;
  counterLabel: string;
  ttsTemplateCall: string;
  ttsTemplateRecall: string;
  ttsTemplateBreak: string;
  icon?: string;
  sortOrder?: number;
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

// Re-export constants, helpers, and presets
export {
  QUEUE_STORAGE_KEY,
  QUEUE_HISTORY_STORAGE_KEY,
  injectQueueVariables,
} from './utils/queueInterpolation';

export {
  SECTOR_PRESETS,
  createDefaultQueueLayoutItems,
  DEFAULT_QUEUES,
} from './utils/queuePresets';

export {
  buildQueueSpokenText,
  getIndonesianVoice,
  stopQueueAnnouncement,
  playQueueAnnouncementAudio,
  speakQueueAnnouncement,
  speakCounterStatusAnnouncement,
} from './utils/queueTts';
