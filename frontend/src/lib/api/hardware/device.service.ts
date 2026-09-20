import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { Device } from './types';

export async function getDevices(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Device[]; total: number }> {
  const writer = new ProtoWriter();
  const pagWriter = new ProtoWriter();
  pagWriter.writeInt32(1, params?.page || 1);
  pagWriter.writeInt32(2, params?.limit || 25);
  writer.writeSubMessage(1, pagWriter);
  if (params?.search) writer.writeString(2, params.search);

  const resBytes = await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'ListDevices', writer);
  const reader = new ProtoReader(resBytes);
  const devices: Device[] = [];
  let total = 0;

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1 && tag.wireType === 2) {
      const itemBytes = reader.readBytes();
      const dReader = new ProtoReader(itemBytes);
      const dev: Partial<Device> = { is_paired: true, is_online: false };
      let orientationEnum = 1;
      let screenW = 1920;
      let screenH = 1080;

      while (dReader.hasMore()) {
        const dTag = dReader.readTag();
        if (!dTag) break;
        if (dTag.fieldNumber === 1) dev.id = dReader.readString();
        else if (dTag.fieldNumber === 2) dev.name = dReader.readString();
        else if (dTag.fieldNumber === 3) dev.pairing_code = dReader.readString();
        else if (dTag.fieldNumber === 4) dev.is_paired = dReader.readBool();
        else if (dTag.fieldNumber === 6) screenW = dReader.readInt32();
        else if (dTag.fieldNumber === 7) screenH = dReader.readInt32();
        else if (dTag.fieldNumber === 8) orientationEnum = dReader.readVarint();
        else if (dTag.fieldNumber === 9) dev.ip_address = dReader.readString();
        else if (dTag.fieldNumber === 14) dev.storage_free_bytes = dReader.readInt64();
        else if (dTag.fieldNumber === 15) dev.current_layout_id = dReader.readString();
        else if (dTag.fieldNumber === 17) dev.canary_group_id = dReader.readString();
        else if (dTag.fieldNumber === 18) dev.is_online = dReader.readBool();
        else if (dTag.fieldNumber === 19) dev.last_heartbeat_at = dReader.readString();
        else if (dTag.fieldNumber === 20) dev.created_at = dReader.readString();
        else if (dTag.fieldNumber === 21) dev.updated_at = dReader.readString();
        else dReader.skip(dTag.wireType);
      }

      dev.resolution = `${screenW || 1920}x${screenH || 1080}`;
      dev.orientation = orientationEnum === 2 ? 'portrait' : 'landscape';
      if (dev.id) devices.push(dev as Device);
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

  return { data: devices, total: total || devices.length };
}

export async function getDevice(id: string): Promise<Device> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);

  const resBytes = await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'GetDevice', writer);
  const reader = new ProtoReader(resBytes);
  const dev: Partial<Device> = { is_paired: true, is_online: false };
  let orientationEnum = 1;
  let screenW = 1920;
  let screenH = 1080;

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) dev.id = reader.readString();
    else if (tag.fieldNumber === 2) dev.name = reader.readString();
    else if (tag.fieldNumber === 3) dev.pairing_code = reader.readString();
    else if (tag.fieldNumber === 4) dev.is_paired = reader.readBool();
    else if (tag.fieldNumber === 6) screenW = reader.readInt32();
    else if (tag.fieldNumber === 7) screenH = reader.readInt32();
    else if (tag.fieldNumber === 8) orientationEnum = reader.readVarint();
    else if (tag.fieldNumber === 9) dev.ip_address = reader.readString();
    else if (tag.fieldNumber === 14) dev.storage_free_bytes = reader.readInt64();
    else if (tag.fieldNumber === 15) dev.current_layout_id = reader.readString();
    else if (tag.fieldNumber === 17) dev.canary_group_id = reader.readString();
    else if (tag.fieldNumber === 18) dev.is_online = reader.readBool();
    else if (tag.fieldNumber === 19) dev.last_heartbeat_at = reader.readString();
    else if (tag.fieldNumber === 20) dev.created_at = reader.readString();
    else if (tag.fieldNumber === 21) dev.updated_at = reader.readString();
    else reader.skip(tag.wireType);
  }

  dev.resolution = `${screenW || 1920}x${screenH || 1080}`;
  dev.orientation = orientationEnum === 2 ? 'portrait' : 'landscape';

  if (!dev.id) throw new Error(`Perangkat ID ${id} tidak ditemukan`);
  return dev as Device;
}

export async function pairDevice(data: { pairing_code: string; device_name: string; default_layout_id?: string; canary_group_id?: string }): Promise<Device> {
  const writer = new ProtoWriter();
  // PairDeviceRequest: pairing_code=1, device_name=2, store_location=3, default_layout_id=4, canary_group_id=5
  writer.writeString(1, data.pairing_code);
  writer.writeString(2, data.device_name);
  if (data.default_layout_id) writer.writeString(4, data.default_layout_id);
  if (data.canary_group_id) writer.writeString(5, data.canary_group_id);

  const resBytes = await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'PairDevice', writer);
  // PairDeviceResponse: success=1, device=2, device_token=3
  const reader = new ProtoReader(resBytes);
  let device: Device | null = null;
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 2 && tag.wireType === 2) {
      // parse nested Device directly
      const dBytes = reader.readBytes();
      const dReader = new ProtoReader(dBytes);
      const dev: Partial<Device> = { is_paired: true, is_online: false };
      let orientationEnum = 1;
      let screenW = 1920;
      let screenH = 1080;
      while (dReader.hasMore()) {
        const dTag = dReader.readTag();
        if (!dTag) break;
        if (dTag.fieldNumber === 1) dev.id = dReader.readString();
        else if (dTag.fieldNumber === 2) dev.name = dReader.readString();
        else if (dTag.fieldNumber === 3) dev.pairing_code = dReader.readString();
        else if (dTag.fieldNumber === 4) dev.is_paired = dReader.readBool();
        else if (dTag.fieldNumber === 6) screenW = dReader.readInt32();
        else if (dTag.fieldNumber === 7) screenH = dReader.readInt32();
        else if (dTag.fieldNumber === 8) orientationEnum = dReader.readVarint();
        else if (dTag.fieldNumber === 9) dev.ip_address = dReader.readString();
        else if (dTag.fieldNumber === 18) dev.is_online = dReader.readBool();
        else if (dTag.fieldNumber === 20) dev.created_at = dReader.readString();
        else dReader.skip(dTag.wireType);
      }
      dev.resolution = `${screenW}x${screenH}`;
      dev.orientation = orientationEnum === 2 ? 'portrait' : 'landscape';
      if (dev.id) device = dev as Device;
    } else {
      reader.skip(tag.wireType);
    }
  }
  if (!device) throw new Error('PairDevice gagal: tidak ada perangkat yang dikembalikan');
  return device;
}

export async function updateDevice(id: string, data: { name?: string; screen_width?: number; screen_height?: number; orientation?: string; current_layout_id?: string; canary_group_id?: string }): Promise<Device> {
  const writer = new ProtoWriter();
  // UpdateDeviceRequest: id=1, name=2, screen_width=3, screen_height=4, orientation=5(enum), current_layout_id=6, canary_group_id=7
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.screen_width) writer.writeInt32(3, data.screen_width);
  if (data.screen_height) writer.writeInt32(4, data.screen_height);
  if (data.orientation) writer.writeInt32(5, data.orientation === 'portrait' ? 2 : 1);
  if (data.current_layout_id) writer.writeString(6, data.current_layout_id);
  if (data.canary_group_id) writer.writeString(7, data.canary_group_id);

  const resBytes = await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'UpdateDevice', writer);
  const reader = new ProtoReader(resBytes);
  // UpdateDevice returns Device directly
  const dev: Partial<Device> = { is_paired: true, is_online: false };
  let orientationEnum = 1;
  let screenW = 1920;
  let screenH = 1080;
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) dev.id = reader.readString();
    else if (tag.fieldNumber === 2) dev.name = reader.readString();
    else if (tag.fieldNumber === 6) screenW = reader.readInt32();
    else if (tag.fieldNumber === 7) screenH = reader.readInt32();
    else if (tag.fieldNumber === 8) orientationEnum = reader.readVarint();
    else if (tag.fieldNumber === 18) dev.is_online = reader.readBool();
    else reader.skip(tag.wireType);
  }
  dev.resolution = `${screenW}x${screenH}`;
  dev.orientation = orientationEnum === 2 ? 'portrait' : 'landscape';
  if (!dev.id) return getDevice(id);
  return dev as Device;
}

export async function deleteDevice(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'DeleteDevice', writer);
  return true;
}
