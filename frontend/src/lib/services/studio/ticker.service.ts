import { invokeApi } from '../../core/invokeApi';
import { TickerConfig } from '../../../app/(dashboard)/studio/components/ticker/types';

type TickerProtoObject = {
  id: string;
  name: string;
  badge: string;
  messagesList?: string[];
  messages?: string[];
  speed?: string;
  theme?: string;
  fontSize?: number;
  font_size?: number;
  backgroundColor?: string;
  textColor?: string;
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  borderColor?: string;
  borderRadius?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

function mapTicker(item: TickerProtoObject): TickerConfig {
  return {
    id: item.id,
    name: item.name,
    badge: item.badge || '',
    messages: item.messagesList || item.messages || [],
    speed: (item.speed as any) || 'normal',
    theme: (item.theme as any) || 'blue',
    fontSize: item.fontSize || item.font_size || 16,
    backgroundColor: item.backgroundColor,
    textColor: item.textColor,
    badgeBackgroundColor: item.badgeBackgroundColor,
    badgeTextColor: item.badgeTextColor,
    borderColor: item.borderColor,
    borderRadius: item.borderRadius,
    createdAt: item.createdAt || item.created_at,
  };
}

export async function getTickers(search = ''): Promise<TickerConfig[]> {
  const res = await invokeApi<{ itemsList?: TickerProtoObject[] }>('/api/grpc/studio/ticker/ListTickers', {});
  const list = (res.itemsList || []).map(mapTicker);
  if (!search) return list;
  const q = search.toLowerCase();
  return list.filter((t) => t.name.toLowerCase().includes(q) || t.badge.toLowerCase().includes(q));
}

export async function getTicker(id: string): Promise<TickerConfig> {
  const res = await invokeApi<TickerProtoObject>('/api/grpc/studio/ticker/GetTicker', { id });
  return mapTicker(res);
}

export async function createTicker(payload: Partial<TickerConfig>): Promise<TickerConfig> {
  const res = await invokeApi<TickerProtoObject>('/api/grpc/studio/ticker/CreateTicker', {
    name: payload.name,
    badge: payload.badge,
    messages: payload.messages,
    speed: payload.speed,
    theme: payload.theme,
    fontSize: payload.fontSize,
  });
  return mapTicker(res);
}

export async function updateTicker(id: string, payload: Partial<TickerConfig>): Promise<TickerConfig> {
  const res = await invokeApi<TickerProtoObject>('/api/grpc/studio/ticker/UpdateTicker', {
    id,
    name: payload.name,
    badge: payload.badge,
    messages: payload.messages,
    speed: payload.speed,
    theme: payload.theme,
    fontSize: payload.fontSize,
  });
  return mapTicker(res);
}

export async function deleteTicker(id: string): Promise<{ success: boolean }> {
  return invokeApi<{ success: boolean }>('/api/grpc/studio/ticker/DeleteTicker', { id });
}
