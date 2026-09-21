import { invokeApi } from '../../core/invokeApi';
import { Schedule } from './types';

export async function getSchedules(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Schedule[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/schedule/ListSchedules', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.schedulesList || [],
    total: result.pagination?.totalItems || result.schedulesList?.length || 0
  };
}

export async function getSchedule(id: string): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/schedule/GetSchedule', { id });
  if (!result.schedule) throw new Error(`Schedule ID ${id} tidak ditemukan`);
  return result.schedule as Schedule;
}

export async function createSchedule(data: { name: string; description?: string; priority?: number }): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/schedule/CreateSchedule', data);
  if (!result.schedule) throw new Error('CreateSchedule failed');
  return result.schedule as Schedule;
}

export async function updateSchedule(id: string, data: { name?: string; description?: string; priority?: number }): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/schedule/UpdateSchedule', { id, ...data });
  if (!result.schedule) throw new Error('UpdateSchedule failed');
  return result.schedule as Schedule;
}

export async function deleteSchedule(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/schedule/DeleteSchedule', { id });
  return true;
}
