import { invokeApi } from '../../core/invokeApi';
import { Schedule } from './schedule.types';

export async function getSchedules(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Schedule[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/studio/schedule/ListSchedules', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getSchedule(id: string): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/studio/schedule/GetSchedule', { id });
  const s = result.schedule || result;
  if (!s || !s.id) throw new Error(`Schedule ID ${id} tidak ditemukan`);
  return s as Schedule;
}

export async function createSchedule(data: { name: string; description?: string; priority?: number }): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/studio/schedule/CreateSchedule', data);
  const s = result.schedule || result;
  if (!s || !s.id) throw new Error('CreateSchedule failed');
  return s as Schedule;
}

export async function updateSchedule(id: string, data: { name?: string; description?: string; priority?: number }): Promise<Schedule> {
  const result = await invokeApi<any>('/api/grpc/studio/schedule/UpdateSchedule', { id, ...data });
  const s = result.schedule || result;
  if (!s || !s.id) throw new Error('UpdateSchedule failed');
  return s as Schedule;
}

export async function deleteSchedule(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/studio/schedule/DeleteSchedule', { id });
  return true;
}

export async function addScheduleEvent(data: {
  scheduleId: string;
  layoutId?: string;
  layout_id?: string;
  startTime: string;
  endTime?: string;
  end_time?: string;
  daysOfWeek?: string;
  days_of_week?: string;
  priority?: number;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
}): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/schedule/AddScheduleEvent', {
    ...data,
    layoutId: data.layoutId || data.layout_id,
    layout_id: data.layoutId || data.layout_id,
    endTime: data.endTime || data.end_time,
    end_time: data.endTime || data.end_time,
    daysOfWeek: data.daysOfWeek || data.days_of_week,
    days_of_week: data.daysOfWeek || data.days_of_week,
    priority: data.priority ?? 0,
    startDate: data.startDate || data.start_date,
    start_date: data.startDate || data.start_date,
    endDate: data.endDate || data.end_date,
    end_date: data.endDate || data.end_date,
  });
}

export async function removeScheduleEvent(id: string, schedule_id?: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/studio/schedule/RemoveScheduleEvent', { id, schedule_id });
  return true;
}

export async function pushLayoutToSchedule(data: {
  layoutId: string;
  scheduleName?: string;
  startTime: string;
  endTime: string;
  daysOfWeek?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  deviceIds: string[];
  displayGroupIds?: string[];
}): Promise<{ success: boolean; scheduleId: string; message: string; affectedDevicesCount: number }> {
  return await invokeApi<any>('/api/grpc/studio/schedule/PushLayoutToSchedule', {
    layoutId: data.layoutId,
    scheduleName: data.scheduleName,
    startTime: data.startTime,
    endTime: data.endTime,
    daysOfWeek: data.daysOfWeek || '1,2,3,4,5,6,7',
    priority: data.priority ?? 0,
    startDate: data.startDate,
    endDate: data.endDate,
    deviceIds: data.deviceIds,
    displayGroupIds: data.displayGroupIds || [],
  });
}

