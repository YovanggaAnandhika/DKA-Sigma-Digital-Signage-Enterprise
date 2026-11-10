import { invokeApi } from '../../core/invokeApi';
import { CLOCK_THEME_STYLES, ClockWeatherConfig, getClockTimezone } from '../../../app/(dashboard)/studio/components/clock/types';

type ClockProtoObject = {
  id: string;
  name: string;
  city: string;
  timezone?: string;
  showSeconds?: boolean;
  show_seconds?: boolean;
  is24Hour?: boolean;
  is_24_hour?: boolean;
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  subtitleColor?: string;
  borderColor?: string;
  borderRadius?: number;
  timeFontSize?: number;
  dateFontSize?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

function mapClock(item: ClockProtoObject): ClockWeatherConfig {
  return {
    id: item.id,
    name: item.name,
    city: item.city || 'Makassar',
    timezone: getClockTimezone(item.city || 'Makassar', item.timezone || 'Asia/Jakarta'),
    showSeconds: Boolean(item.showSeconds ?? item.show_seconds ?? true),
    is24Hour: Boolean(item.is24Hour ?? item.is_24_hour ?? true),
    theme: (item.theme as any) || 'glass',
    backgroundColor: item.backgroundColor,
    textColor: item.textColor,
    subtitleColor: item.subtitleColor,
    borderColor: item.borderColor,
    borderRadius: item.borderRadius,
    timeFontSize: item.timeFontSize,
    dateFontSize: item.dateFontSize,
    createdAt: item.createdAt || item.created_at,
  };
}

export async function getClocks(search = ''): Promise<ClockWeatherConfig[]> {
  const res = await invokeApi<{ itemsList?: ClockProtoObject[] }>('/api/grpc/studio/clock/ListClocks', {});
  const list = (res.itemsList || []).map(mapClock);
  if (!search) return list;
  const q = search.toLowerCase();
  return list.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
}

export async function getClock(id: string): Promise<ClockWeatherConfig> {
  const res = await invokeApi<ClockProtoObject>('/api/grpc/studio/clock/GetClock', { id });
  return mapClock(res);
}

export async function createClock(payload: Partial<ClockWeatherConfig>): Promise<ClockWeatherConfig> {
  const colors = CLOCK_THEME_STYLES[payload.theme || 'glass'];
  const res = await invokeApi<ClockProtoObject>('/api/grpc/studio/clock/CreateClock', {
    name: payload.name,
    city: payload.city,
    showSeconds: payload.showSeconds,
    is24Hour: payload.is24Hour,
    theme: payload.theme,
    backgroundColor: colors.backgroundColor,
    textColor: payload.textColor || colors.textColor,
    timeFontSize: payload.timeFontSize || 48,
  });
  return mapClock(res);
}

export async function updateClock(id: string, payload: Partial<ClockWeatherConfig>): Promise<ClockWeatherConfig> {
  const colors = CLOCK_THEME_STYLES[payload.theme || 'glass'];
  const res = await invokeApi<ClockProtoObject>('/api/grpc/studio/clock/UpdateClock', {
    id,
    name: payload.name,
    city: payload.city,
    showSeconds: payload.showSeconds,
    is24Hour: payload.is24Hour,
    theme: payload.theme,
    backgroundColor: colors.backgroundColor,
    textColor: payload.textColor || colors.textColor,
    timeFontSize: payload.timeFontSize,
  });
  return mapClock(res);
}

export async function deleteClock(id: string): Promise<{ success: boolean }> {
  return invokeApi<{ success: boolean }>('/api/grpc/studio/clock/DeleteClock', { id });
}
