import { invokeApi } from '../../core/invokeApi';
import { Schedule } from './schedule.types';

export async function getSchedules(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Schedule[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/schedule/ListSchedules', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getSchedule(id: string): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/schedule/GetSchedule', { id });
  const s = result.schedule || result;
  if (!s || !s.id) throw new Error(`Schedule ID ${id} tidak ditemukan`);
  return s as Schedule;
}

export async function createSchedule(data: { name: string; description?: string; priority?: number }): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/schedule/CreateSchedule', data);
  const s = result.schedule || result;
  if (!s || !s.id) throw new Error('CreateSchedule failed');
  return s as Schedule;
}

export async function updateSchedule(id: string, data: { name?: string; description?: string; priority?: number }): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/schedule/UpdateSchedule', { id, ...data });
  const s = result.schedule || result;
  if (!s || !s.id) throw new Error('UpdateSchedule failed');
  return s as Schedule;
}

export async function deleteSchedule(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/schedule/DeleteSchedule', { id });
  return true;
}

export async function addScheduleEvent(data: { scheduleId: string; layoutId?: string; layout_id?: string; startTime: string; endTime?: string; end_time?: string; daysOfWeek?: string; days_of_week?: string }): Promise<any> {
  return await invokeApi<any>('/api/grpc/schedule/AddScheduleEvent', {
    ...data,
    layoutId: data.layoutId || data.layout_id,
    layout_id: data.layoutId || data.layout_id,
    endTime: data.endTime || data.end_time,
    end_time: data.endTime || data.end_time,
    daysOfWeek: data.daysOfWeek || data.days_of_week,
    days_of_week: data.daysOfWeek || data.days_of_week,
  });
}

export async function removeScheduleEvent(id: string, schedule_id?: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/schedule/RemoveScheduleEvent', { id, schedule_id });
  return true;
}

