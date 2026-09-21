import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { Schedule, ScheduleEvent } from './schedule.types';

export async function getSchedules(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Schedule[]; total: number }> {
  const writer = new ProtoWriter();
  const pagWriter = new ProtoWriter();
  pagWriter.writeInt32(1, params?.page || 1);
  pagWriter.writeInt32(2, params?.limit || 25);
  writer.writeSubMessage(1, pagWriter);
  if (params?.search) writer.writeString(2, params.search);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.schedule.ScheduleService', 'ListSchedules', writer);
  const reader = new ProtoReader(resBytes);
  const schedules: Schedule[] = [];
  let total = 0;

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1 && tag.wireType === 2) {
      schedules.push(parseSchedule(reader.readBytes()));
    } else if (tag.fieldNumber === 2 && tag.wireType === 2) {
      const pagBytes = reader.readBytes();
      const pReader = new ProtoReader(pagBytes);
      while (pReader.hasMore()) {
        const pTag = pReader.readTag();
        if (!pTag) break;
        if (pTag.fieldNumber === 3) total = pReader.readInt64();
        else pReader.skip(pTag.wireType);
      }
    } else {
      reader.skip(tag.wireType);
    }
  }

  return { data: schedules, total: total || schedules.length };
}

export async function getSchedule(id: string): Promise<Schedule> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  const resBytes = await invokeGrpcMethod('signage.studio.v1.schedule.ScheduleService', 'GetSchedule', writer);
  return parseSchedule(resBytes);
}

export async function createSchedule(data: { name: string; description?: string }): Promise<Schedule> {
  const writer = new ProtoWriter();
  writer.writeString(1, data.name);
  if (data.description) writer.writeString(2, data.description);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.schedule.ScheduleService', 'CreateSchedule', writer);
  return parseSchedule(resBytes);
}

export async function updateSchedule(id: string, data: { name?: string; description?: string }): Promise<Schedule> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.description) writer.writeString(3, data.description);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.schedule.ScheduleService', 'UpdateSchedule', writer);
  return parseSchedule(resBytes);
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.studio.v1.schedule.ScheduleService', 'DeleteSchedule', writer);
  return true;
}

export async function addScheduleEvent(data: { schedule_id: string; layout_id: string; start_time: string; end_time: string; days_of_week: string }): Promise<ScheduleEvent> {
  const writer = new ProtoWriter();
  writer.writeString(1, data.schedule_id);
  writer.writeString(2, data.layout_id);
  writer.writeString(3, data.start_time);
  writer.writeString(4, data.end_time);
  writer.writeString(5, data.days_of_week);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.schedule.ScheduleService', 'AddScheduleEvent', writer);
  return parseScheduleEvent(resBytes);
}

export async function removeScheduleEvent(id: string, schedule_id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  writer.writeString(2, schedule_id);
  await invokeGrpcMethod('signage.studio.v1.schedule.ScheduleService', 'RemoveScheduleEvent', writer);
  return true;
}

function parseSchedule(bytes: Uint8Array): Schedule {
  const reader = new ProtoReader(bytes);
  const schedule: Partial<Schedule> = { events: [] };
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) schedule.id = reader.readString();
    else if (tag.fieldNumber === 2) schedule.name = reader.readString();
    else if (tag.fieldNumber === 3) schedule.description = reader.readString();
    else if (tag.fieldNumber === 4) schedule.created_at = reader.readString();
    else if (tag.fieldNumber === 5) schedule.updated_at = reader.readString();
    else if (tag.fieldNumber === 6) schedule.events!.push(parseScheduleEvent(reader.readBytes()));
    else reader.skip(tag.wireType);
  }
  if (!schedule.id) throw new Error('Invalid Schedule data');
  return schedule as Schedule;
}

function parseScheduleEvent(bytes: Uint8Array): ScheduleEvent {
  const reader = new ProtoReader(bytes);
  const event: Partial<ScheduleEvent> = {};
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) event.id = reader.readString();
    else if (tag.fieldNumber === 2) event.schedule_id = reader.readString();
    else if (tag.fieldNumber === 3) event.layout_id = reader.readString();
    else if (tag.fieldNumber === 4) event.layout_name = reader.readString();
    else if (tag.fieldNumber === 5) event.start_time = reader.readString();
    else if (tag.fieldNumber === 6) event.end_time = reader.readString();
    else if (tag.fieldNumber === 7) event.days_of_week = reader.readString();
    else if (tag.fieldNumber === 8) event.created_at = reader.readString();
    else reader.skip(tag.wireType);
  }
  return event as ScheduleEvent;
}
