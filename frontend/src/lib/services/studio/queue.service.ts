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

export async function addCounter(queueDisplayId: string, counterNumber: number, counterName: string, operatorName: string = ''): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/AddCounter', { queueDisplayId, counterNumber, counterName, operatorName });
}

export async function updateCounter(id: string, counterNumber: number, counterName: string, operatorName: string, isActive: boolean = true): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/UpdateCounter', { id, counterNumber, counterName, operatorName, isActive });
}

export async function deleteCounter(id: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/DeleteCounter', { id });
}

export async function listCounters(queueDisplayId: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/queue/ListCounters', { queueDisplayId });
}
