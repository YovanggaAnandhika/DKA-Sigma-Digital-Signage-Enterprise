import { invokeApi } from '@/lib/core/invokeApi';

export interface QueueLayoutItemData {
  id?: string;
  queueDisplayId?: string;
  itemType: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  templateContent?: string;
  configJson?: string;
  isVisible?: boolean;
}

export interface QueueCounterData {
  id?: string;
  queueDisplayId?: string;
  counterNumber: number;
  counterName: string;
  operatorName?: string;
  isActive?: boolean;
  status?: 'ACTIVE' | 'BREAK' | 'LOCKED' | string;
  statusNote?: string;
  currentTicketNumber?: string;
  lastCalledAt?: string;
}

export interface QueueAudioData {
  id?: string;
  queueDisplayId?: string;
  name: string;
  audioType: string;
  mediaItemId?: string;
  fileUrl?: string;
  volumePercent?: number;
  isActive?: boolean;
}

export interface QueueDisplayData {
  id?: string;
  name: string;
  prefix: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundImageUrl?: string;
  themePreset: string;
  autoRecallEnabled: boolean;
  sectorType?: string;
  ticketLabel?: string;
  counterLabel?: string;
  ttsTemplateCall?: string;
  ttsTemplateRecall?: string;
  ttsTemplateBreak?: string;
  currentSequence?: number;
  items?: QueueLayoutItemData[];
  counters?: QueueCounterData[];
  audios?: QueueAudioData[];
}

export async function createQueueDisplay(data: QueueDisplayData): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/CreateQueueDisplay', data);
}

export async function getQueueDisplay(id: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/GetQueueDisplay', { id });
}

export async function listQueueDisplays(search: string = ''): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/ListQueueDisplays', { search });
}

export async function updateQueueDisplay(id: string, data: Partial<QueueDisplayData>): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/UpdateQueueDisplay', { id, ...data });
}

export async function deleteQueueDisplay(id: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/DeleteQueueDisplay', { id });
}

export async function saveQueueLayout(queueDisplayId: string, items: QueueLayoutItemData[]): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/SaveQueueLayout', { queueDisplayId, items });
}

export async function getQueueLayout(queueDisplayId: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/GetQueueLayout', { queueDisplayId });
}

export async function callNextTicket(queueDisplayId: string, counterId: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/CallNextTicket', { queueDisplayId, counterId });
}

export async function callPreviousTicket(queueDisplayId: string, counterId: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/CallPreviousTicket', { queueDisplayId, counterId });
}

export async function resetQueue(queueDisplayId: string, startSequence: number = 0, counterId?: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/ResetQueue', { queueDisplayId, startSequence, counterId });
}

export async function setCounterStatus(counterId: string, status: 'ACTIVE' | 'BREAK' | 'LOCKED' | string, statusNote: string = ''): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/SetCounterStatus', { counterId, status, statusNote });
}

export async function getQueueSyncState(queueDisplayId: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/GetQueueSyncState', { queueDisplayId });
}

export async function addCounter(queueDisplayId: string, counterNumber: number, counterName: string, operatorName: string = ''): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/AddCounter', { queueDisplayId, counterNumber, counterName, operatorName });
}

export async function updateCounter(id: string, counterNumber: number, counterName: string, operatorName: string, isActive: boolean = true, status: string = 'ACTIVE', statusNote: string = ''): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/UpdateCounter', { id, counterNumber, counterName, operatorName, isActive, status, statusNote });
}

export async function deleteCounter(id: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/DeleteCounter', { id });
}

export async function listCounters(queueDisplayId: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/ListCounters', { queueDisplayId });
}
