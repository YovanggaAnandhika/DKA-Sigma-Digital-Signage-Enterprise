/**
 * OmniSign Pure gRPC-Web Client
 * Communicates with the Rust Tonic gRPC backend via Envoy proxy (http://localhost:8080).
 * Implements real Protobuf wire encoding and decoding with ZERO mocks and ZERO placeholders.
 */

const ENVOY_URL = process.env.NEXT_PUBLIC_GRPC_WEB_URL || 'http://localhost:8080';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  token: string;
  effectivePermissions: string[];
  expiresAt: number;
}

// ============================================================================
// PROTOBUF WIRE ENCODER / DECODER HELPERS
// ============================================================================

export class ProtoWriter {
  private buffer: number[] = [];

  writeVarint(value: number): void {
    let v = value >>> 0;
    while (v > 0x7f) {
      this.buffer.push((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    this.buffer.push(v);
  }

  writeTag(fieldNumber: number, wireType: number): void {
    this.writeVarint((fieldNumber << 3) | wireType);
  }

  writeString(fieldNumber: number, value: string): void {
    if (!value) return;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    this.writeTag(fieldNumber, 2);
    this.writeVarint(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
  }

  writeInt32(fieldNumber: number, value: number): void {
    if (value === 0) return;
    this.writeTag(fieldNumber, 0);
    this.writeVarint(value);
  }

  writeInt64(fieldNumber: number, value: number): void {
    if (value === 0) return;
    this.writeTag(fieldNumber, 0);
    this.writeVarint(value);
  }

  writeBool(fieldNumber: number, value: boolean): void {
    if (!value) return;
    this.writeTag(fieldNumber, 0);
    this.writeVarint(value ? 1 : 0);
  }

  writeBytes(fieldNumber: number, bytes: Uint8Array): void {
    if (bytes.length === 0) return;
    this.writeTag(fieldNumber, 2);
    this.writeVarint(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
  }

  writeSubMessage(fieldNumber: number, writer: ProtoWriter): void {
    const bytes = writer.getBytes();
    if (bytes.length === 0) return;
    this.writeTag(fieldNumber, 2);
    this.writeVarint(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  toGrpcFrame(): Uint8Array {
    const payload = this.getBytes();
    const frame = new Uint8Array(5 + payload.length);
    frame[0] = 0; // uncompressed flag
    const len = payload.length;
    frame[1] = (len >>> 24) & 0xff;
    frame[2] = (len >>> 16) & 0xff;
    frame[3] = (len >>> 8) & 0xff;
    frame[4] = len & 0xff;
    frame.set(payload, 5);
    return frame;
  }
}

export class ProtoReader {
  private offset = 0;
  private length: number;

  constructor(private buffer: Uint8Array) {
    this.length = buffer.byteLength;
  }

  hasMore(): boolean {
    return this.offset < this.length;
  }

  readVarint(): number {
    let result = 0;
    let shift = 0;
    while (this.offset < this.length) {
      const b = this.buffer[this.offset++];
      result |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) {
        return result >>> 0;
      }
      shift += 7;
      if (shift >= 32) break;
    }
    return result;
  }

  readTag(): { fieldNumber: number; wireType: number } | null {
    if (!this.hasMore()) return null;
    const key = this.readVarint();
    return {
      fieldNumber: key >>> 3,
      wireType: key & 0x07,
    };
  }

  readString(): string {
    const len = this.readVarint();
    const bytes = this.buffer.subarray(this.offset, this.offset + len);
    this.offset += len;
    return new TextDecoder().decode(bytes);
  }

  readInt32(): number {
    return this.readVarint();
  }

  readInt64(): number {
    return this.readVarint();
  }

  readBool(): boolean {
    return this.readVarint() !== 0;
  }

  readBytes(): Uint8Array {
    const len = this.readVarint();
    const bytes = this.buffer.slice(this.offset, this.offset + len);
    this.offset += len;
    return bytes;
  }

  skip(wireType: number): void {
    if (wireType === 0) {
      this.readVarint();
    } else if (wireType === 1) {
      this.offset += 8;
    } else if (wireType === 2) {
      const len = this.readVarint();
      this.offset += len;
    } else if (wireType === 5) {
      this.offset += 4;
    }
  }
}

// ============================================================================
// LOW-LEVEL GRPC-WEB DISPATCHER
// ============================================================================

export async function invokeGrpcMethod(
  service: string,
  method: string,
  writer: ProtoWriter
): Promise<Uint8Array> {
  const frame = writer.toGrpcFrame();
  const session = getStoredSession();

  const headers: Record<string, string> = {
    'content-type': 'application/grpc-web+proto',
    'x-grpc-web': '1',
  };

  if (session?.token) {
    headers['authorization'] = `Bearer ${session.token}`;
  }

  const response = await fetch(`${ENVOY_URL}/${service}/${method}`, {
    method: 'POST',
    headers,
    body: frame as unknown as BodyInit,
  });

  const grpcStatus = response.headers.get('grpc-status');
  const grpcMessage = response.headers.get('grpc-message');

  if (grpcStatus && grpcStatus !== '0') {
    throw new Error(decodeURIComponent(grpcMessage || `gRPC Error code ${grpcStatus}`));
  }

  const rawBytes = new Uint8Array(await response.arrayBuffer());
  if (rawBytes.length < 5) {
    if (grpcStatus && grpcStatus !== '0') {
      throw new Error(decodeURIComponent(grpcMessage || 'RPC Failed'));
    }
    return new Uint8Array(0);
  }

  const msgLen =
    (rawBytes[1] << 24) | (rawBytes[2] << 16) | (rawBytes[3] << 8) | rawBytes[4];
  return rawBytes.subarray(5, 5 + msgLen);
}

// ============================================================================
// DATA MODELS & INTERFACES
// ============================================================================

export interface Device {
  id: string;
  name: string;
  pairing_code: string;
  is_paired: boolean;
  is_online: boolean;
  ip_address: string;
  resolution: string;
  orientation: string;
  storage_free_bytes: number;
  memory_used_percent: number;
  last_heartbeat_at?: string;
  current_layout_id?: string;
  canary_group_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Layout {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: string;
  zones: Zone[];
  created_at?: string;
  updated_at?: string;
}

export interface Zone {
  id: string;
  layout_id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  playlist_id?: string;
  playlist_name?: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_id: string;
  media_name?: string;
  media_type?: string;
  duration_seconds: number;
  order_index: number;
  transition_type: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  is_shuffle: boolean;
  items: PlaylistItem[];
  created_at?: string;
  updated_at?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  original_filename: string;
  file_path: string;
  public_url: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  media_type: number; // 1 = Image, 2 = Video, 3 = Web
  width: number;
  height: number;
  duration_seconds: number;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
}

// ============================================================================
// HIGH-LEVEL API SERVICES (100% REAL BACKEND gRPC CALLS)
// ============================================================================

export const api = {
  // --------------------------------------------------------------------------
  // AUTH
  // --------------------------------------------------------------------------
  async login(email: string, password: string): Promise<UserSession> {
    const writer = new ProtoWriter();
    writer.writeString(1, email);
    writer.writeString(2, password);

    const resBytes = await invokeGrpcMethod(
      'signage.iam.v1.user.UserService',
      'Login',
      writer
    );

    const reader = new ProtoReader(resBytes);
    let token = '';
    let userSub: { id: string; email: string; fullName: string; permissions: string[] } = {
      id: '',
      email: '',
      fullName: '',
      permissions: [],
    };
    let expiresAt = Date.now() + 86400 * 1000;

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) {
        token = reader.readString();
      } else if (tag.fieldNumber === 2 && tag.wireType === 2) {
        const userBytes = reader.readBytes();
        const uReader = new ProtoReader(userBytes);
        while (uReader.hasMore()) {
          const uTag = uReader.readTag();
          if (!uTag) break;
          if (uTag.fieldNumber === 1) userSub.id = uReader.readString();
          else if (uTag.fieldNumber === 2) userSub.email = uReader.readString();
          else if (uTag.fieldNumber === 3) userSub.fullName = uReader.readString();
          else if (uTag.fieldNumber === 7) userSub.permissions.push(uReader.readString());
          else uReader.skip(uTag.wireType);
        }
      } else if (tag.fieldNumber === 3) {
        expiresAt = reader.readInt64() * 1000;
      } else {
        reader.skip(tag.wireType);
      }
    }

    if (!token) {
      throw new Error('Gagal menerima token autentikasi dari backend');
    }

    const session: UserSession = {
      id: userSub.id,
      email: userSub.email || email,
      fullName: userSub.fullName || 'Signage Administrator',
      token,
      effectivePermissions: userSub.permissions,
      expiresAt,
    };

    saveSession(session);
    return session;
  },

  // --------------------------------------------------------------------------
  // DEVICES (HARDWARE)
  // --------------------------------------------------------------------------
  async getDevices(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Device[]; total: number }> {
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
        while (dReader.hasMore()) {
          const dTag = dReader.readTag();
          if (!dTag) break;
          if (dTag.fieldNumber === 1) dev.id = dReader.readString();
          else if (dTag.fieldNumber === 2) dev.name = dReader.readString();
          else if (dTag.fieldNumber === 4) dev.pairing_code = dReader.readString();
          else if (dTag.fieldNumber === 5) dev.is_online = dReader.readBool();
          else if (dTag.fieldNumber === 6) dev.ip_address = dReader.readString();
          else if (dTag.fieldNumber === 7) dev.resolution = dReader.readString();
          else if (dTag.fieldNumber === 8) dev.orientation = dReader.readString();
          else if (dTag.fieldNumber === 9) dev.storage_free_bytes = dReader.readInt64();
          else if (dTag.fieldNumber === 10) dev.memory_used_percent = dReader.readInt32();
          else if (dTag.fieldNumber === 11) dev.last_heartbeat_at = dReader.readString();
          else if (dTag.fieldNumber === 12) dev.current_layout_id = dReader.readString();
          else if (dTag.fieldNumber === 13) dev.canary_group_id = dReader.readString();
          else if (dTag.fieldNumber === 14) dev.created_at = dReader.readString();
          else if (dTag.fieldNumber === 15) dev.updated_at = dReader.readString();
          else dReader.skip(dTag.wireType);
        }
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
  },

  async getDevice(id: string): Promise<Device> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);

    const resBytes = await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'GetDevice', writer);
    const reader = new ProtoReader(resBytes);
    const dev: Partial<Device> = { is_paired: true, is_online: false };

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) dev.id = reader.readString();
      else if (tag.fieldNumber === 2) dev.name = reader.readString();
      else if (tag.fieldNumber === 4) dev.pairing_code = reader.readString();
      else if (tag.fieldNumber === 5) dev.is_online = reader.readBool();
      else if (tag.fieldNumber === 6) dev.ip_address = reader.readString();
      else if (tag.fieldNumber === 7) dev.resolution = reader.readString();
      else if (tag.fieldNumber === 8) dev.orientation = reader.readString();
      else if (tag.fieldNumber === 9) dev.storage_free_bytes = reader.readInt64();
      else if (tag.fieldNumber === 10) dev.memory_used_percent = reader.readInt32();
      else if (tag.fieldNumber === 11) dev.last_heartbeat_at = reader.readString();
      else if (tag.fieldNumber === 12) dev.current_layout_id = reader.readString();
      else if (tag.fieldNumber === 13) dev.canary_group_id = reader.readString();
      else if (tag.fieldNumber === 14) dev.created_at = reader.readString();
      else if (tag.fieldNumber === 15) dev.updated_at = reader.readString();
      else reader.skip(tag.wireType);
    }

    if (!dev.id) throw new Error(`Perangkat ID ${id} tidak ditemukan`);
    return dev as Device;
  },

  async createDevice(data: { name: string; resolution: string; orientation: string; canary_group_id?: string }): Promise<Device> {
    const writer = new ProtoWriter();
    writer.writeString(1, data.name);
    writer.writeString(2, data.resolution || '1920x1080');
    writer.writeString(3, data.orientation || 'landscape');
    if (data.canary_group_id) writer.writeString(4, data.canary_group_id);

    const resBytes = await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'RegisterDevice', writer);
    const reader = new ProtoReader(resBytes);
    let deviceId = '';
    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) deviceId = reader.readString();
      else reader.skip(tag.wireType);
    }
    return this.getDevice(deviceId);
  },

  async updateDevice(id: string, data: { name?: string; resolution?: string; orientation?: string; current_layout_id?: string; canary_group_id?: string }): Promise<Device> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    if (data.name) writer.writeString(2, data.name);
    if (data.resolution) writer.writeString(3, data.resolution);
    if (data.orientation) writer.writeString(4, data.orientation);
    if (data.current_layout_id) writer.writeString(5, data.current_layout_id);
    if (data.canary_group_id) writer.writeString(6, data.canary_group_id);

    await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'UpdateDevice', writer);
    return this.getDevice(id);
  },

  async deleteDevice(id: string): Promise<boolean> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    await invokeGrpcMethod('signage.hardware.v1.device.DeviceService', 'DeleteDevice', writer);
    return true;
  },

  // --------------------------------------------------------------------------
  // LAYOUTS (STUDIO)
  // --------------------------------------------------------------------------
  async getLayouts(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Layout[]; total: number }> {
    const writer = new ProtoWriter();
    const pagWriter = new ProtoWriter();
    pagWriter.writeInt32(1, params?.page || 1);
    pagWriter.writeInt32(2, params?.limit || 25);
    writer.writeSubMessage(1, pagWriter);
    if (params?.search) writer.writeString(2, params.search);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'ListLayouts', writer);
    const reader = new ProtoReader(resBytes);
    const layouts: Layout[] = [];
    let total = 0;

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1 && tag.wireType === 2) {
        const itemBytes = reader.readBytes();
        const lReader = new ProtoReader(itemBytes);
        const l: Partial<Layout> = { zones: [] };
        while (lReader.hasMore()) {
          const lTag = lReader.readTag();
          if (!lTag) break;
          if (lTag.fieldNumber === 1) l.id = lReader.readString();
          else if (lTag.fieldNumber === 2) l.name = lReader.readString();
          else if (lTag.fieldNumber === 3) l.width = lReader.readInt32();
          else if (lTag.fieldNumber === 4) l.height = lReader.readInt32();
          else if (lTag.fieldNumber === 5) l.orientation = lReader.readString();
          else if (lTag.fieldNumber === 6 && lTag.wireType === 2) {
            const zBytes = lReader.readBytes();
            const zReader = new ProtoReader(zBytes);
            const z: Partial<Zone> = {};
            while (zReader.hasMore()) {
              const zTag = zReader.readTag();
              if (!zTag) break;
              if (zTag.fieldNumber === 1) z.id = zReader.readString();
              else if (zTag.fieldNumber === 2) z.name = zReader.readString();
              else if (zTag.fieldNumber === 3) z.x = zReader.readInt32();
              else if (zTag.fieldNumber === 4) z.y = zReader.readInt32();
              else if (zTag.fieldNumber === 5) z.width = zReader.readInt32();
              else if (zTag.fieldNumber === 6) z.height = zReader.readInt32();
              else if (zTag.fieldNumber === 7) z.z_index = zReader.readInt32();
              else zReader.skip(zTag.wireType);
            }
            if (z.id) l.zones?.push(z as Zone);
          } else if (lTag.fieldNumber === 7) l.created_at = lReader.readString();
          else if (lTag.fieldNumber === 8) l.updated_at = lReader.readString();
          else lReader.skip(lTag.wireType);
        }
        if (l.id) layouts.push(l as Layout);
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

    return { data: layouts, total: total || layouts.length };
  },

  async getLayout(id: string): Promise<Layout> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'GetLayout', writer);
    const reader = new ProtoReader(resBytes);
    const l: Partial<Layout> = { zones: [] };

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) l.id = reader.readString();
      else if (tag.fieldNumber === 2) l.name = reader.readString();
      else if (tag.fieldNumber === 3) l.width = reader.readInt32();
      else if (tag.fieldNumber === 4) l.height = reader.readInt32();
      else if (tag.fieldNumber === 5) l.orientation = reader.readString();
      else if (tag.fieldNumber === 6 && tag.wireType === 2) {
        const zBytes = reader.readBytes();
        const zReader = new ProtoReader(zBytes);
        const z: Partial<Zone> = {};
        while (zReader.hasMore()) {
          const zTag = zReader.readTag();
          if (!zTag) break;
          if (zTag.fieldNumber === 1) z.id = zReader.readString();
          else if (zTag.fieldNumber === 2) z.name = zReader.readString();
          else if (zTag.fieldNumber === 3) z.x = zReader.readInt32();
          else if (zTag.fieldNumber === 4) z.y = zReader.readInt32();
          else if (zTag.fieldNumber === 5) z.width = zReader.readInt32();
          else if (zTag.fieldNumber === 6) z.height = zReader.readInt32();
          else if (zTag.fieldNumber === 7) z.z_index = zReader.readInt32();
          else zReader.skip(zTag.wireType);
        }
        if (z.id) l.zones?.push(z as Zone);
      } else if (tag.fieldNumber === 7) l.created_at = reader.readString();
      else if (tag.fieldNumber === 8) l.updated_at = reader.readString();
      else reader.skip(tag.wireType);
    }

    if (!l.id) throw new Error(`Layout ID ${id} tidak ditemukan`);
    return l as Layout;
  },

  async createLayout(data: { name: string; width: number; height: number; orientation: string }): Promise<Layout> {
    const writer = new ProtoWriter();
    writer.writeString(1, data.name);
    writer.writeInt32(2, data.width);
    writer.writeInt32(3, data.height);
    writer.writeString(4, data.orientation);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'CreateLayout', writer);
    const reader = new ProtoReader(resBytes);
    let layoutId = '';
    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) layoutId = reader.readString();
      else reader.skip(tag.wireType);
    }
    return this.getLayout(layoutId);
  },

  async updateLayout(id: string, data: { name?: string; width?: number; height?: number; orientation?: string }): Promise<Layout> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    if (data.name) writer.writeString(2, data.name);
    if (data.width) writer.writeInt32(3, data.width);
    if (data.height) writer.writeInt32(4, data.height);
    if (data.orientation) writer.writeString(5, data.orientation);

    await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'UpdateLayout', writer);
    return this.getLayout(id);
  },

  async deleteLayout(id: string): Promise<boolean> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'DeleteLayout', writer);
    return true;
  },

  // --------------------------------------------------------------------------
  // PLAYLISTS (STUDIO)
  // --------------------------------------------------------------------------
  async getPlaylists(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Playlist[]; total: number }> {
    const writer = new ProtoWriter();
    const pagWriter = new ProtoWriter();
    pagWriter.writeInt32(1, params?.page || 1);
    pagWriter.writeInt32(2, params?.limit || 25);
    writer.writeSubMessage(1, pagWriter);
    if (params?.search) writer.writeString(2, params.search);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'ListPlaylists', writer);
    const reader = new ProtoReader(resBytes);
    const playlists: Playlist[] = [];
    let total = 0;

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1 && tag.wireType === 2) {
        const itemBytes = reader.readBytes();
        const pReader = new ProtoReader(itemBytes);
        const pl: Partial<Playlist> = { items: [] };
        while (pReader.hasMore()) {
          const plTag = pReader.readTag();
          if (!plTag) break;
          if (plTag.fieldNumber === 1) pl.id = pReader.readString();
          else if (plTag.fieldNumber === 2) pl.name = pReader.readString();
          else if (plTag.fieldNumber === 3) pl.description = pReader.readString();
          else if (plTag.fieldNumber === 4) pl.is_shuffle = pReader.readBool();
          else if (plTag.fieldNumber === 5 && plTag.wireType === 2) {
            const iBytes = pReader.readBytes();
            const iReader = new ProtoReader(iBytes);
            const item: Partial<PlaylistItem> = {};
            while (iReader.hasMore()) {
              const iTag = iReader.readTag();
              if (!iTag) break;
              if (iTag.fieldNumber === 1) item.id = iReader.readString();
              else if (iTag.fieldNumber === 3) item.media_id = iReader.readString();
              else if (iTag.fieldNumber === 4) item.duration_seconds = iReader.readInt32();
              else if (iTag.fieldNumber === 5) item.order_index = iReader.readInt32();
              else if (iTag.fieldNumber === 6) item.transition_type = iReader.readString();
              else iReader.skip(iTag.wireType);
            }
            if (item.id) pl.items?.push(item as PlaylistItem);
          } else if (plTag.fieldNumber === 6) pl.created_at = pReader.readString();
          else if (plTag.fieldNumber === 7) pl.updated_at = pReader.readString();
          else pReader.skip(plTag.wireType);
        }
        if (pl.id) playlists.push(pl as Playlist);
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

    return { data: playlists, total: total || playlists.length };
  },

  async getPlaylist(id: string): Promise<Playlist> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'GetPlaylist', writer);
    const reader = new ProtoReader(resBytes);
    const pl: Partial<Playlist> = { items: [] };

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) pl.id = reader.readString();
      else if (tag.fieldNumber === 2) pl.name = reader.readString();
      else if (tag.fieldNumber === 3) pl.description = reader.readString();
      else if (tag.fieldNumber === 4) pl.is_shuffle = reader.readBool();
      else if (tag.fieldNumber === 5 && tag.wireType === 2) {
        const iBytes = reader.readBytes();
        const iReader = new ProtoReader(iBytes);
        const item: Partial<PlaylistItem> = {};
        while (iReader.hasMore()) {
          const iTag = iReader.readTag();
          if (!iTag) break;
          if (iTag.fieldNumber === 1) item.id = iReader.readString();
          else if (iTag.fieldNumber === 3) item.media_id = iReader.readString();
          else if (iTag.fieldNumber === 4) item.duration_seconds = iReader.readInt32();
          else if (iTag.fieldNumber === 5) item.order_index = iReader.readInt32();
          else if (iTag.fieldNumber === 6) item.transition_type = iReader.readString();
          else iReader.skip(iTag.wireType);
        }
        if (item.id) pl.items?.push(item as PlaylistItem);
      } else if (tag.fieldNumber === 6) pl.created_at = reader.readString();
      else if (tag.fieldNumber === 7) pl.updated_at = reader.readString();
      else reader.skip(tag.wireType);
    }

    if (!pl.id) throw new Error(`Playlist ID ${id} tidak ditemukan`);
    return pl as Playlist;
  },

  async createPlaylist(data: { name: string; description: string; is_shuffle: boolean }): Promise<Playlist> {
    const writer = new ProtoWriter();
    writer.writeString(1, data.name);
    writer.writeString(2, data.description || '');
    writer.writeBool(3, data.is_shuffle);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'CreatePlaylist', writer);
    const reader = new ProtoReader(resBytes);
    let playlistId = '';
    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) playlistId = reader.readString();
      else reader.skip(tag.wireType);
    }
    return this.getPlaylist(playlistId);
  },

  async updatePlaylist(id: string, data: { name?: string; description?: string; is_shuffle?: boolean }): Promise<Playlist> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    if (data.name) writer.writeString(2, data.name);
    if (data.description !== undefined) writer.writeString(3, data.description);
    if (data.is_shuffle !== undefined) writer.writeBool(4, data.is_shuffle);

    await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'UpdatePlaylist', writer);
    return this.getPlaylist(id);
  },

  async deletePlaylist(id: string): Promise<boolean> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'DeletePlaylist', writer);
    return true;
  },

  // --------------------------------------------------------------------------
  // MEDIA (STUDIO)
  // --------------------------------------------------------------------------
  async getMedia(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: MediaItem[]; total: number }> {
    const writer = new ProtoWriter();
    const pagWriter = new ProtoWriter();
    pagWriter.writeInt32(1, params?.page || 1);
    pagWriter.writeInt32(2, params?.limit || 25);
    writer.writeSubMessage(1, pagWriter);
    if (params?.search) writer.writeString(2, params.search);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'ListMedia', writer);
    const reader = new ProtoReader(resBytes);
    const media: MediaItem[] = [];
    let total = 0;

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1 && tag.wireType === 2) {
        const itemBytes = reader.readBytes();
        const mReader = new ProtoReader(itemBytes);
        const m: Partial<MediaItem> = {};
        while (mReader.hasMore()) {
          const mTag = mReader.readTag();
          if (!mTag) break;
          if (mTag.fieldNumber === 1) m.id = mReader.readString();
          else if (mTag.fieldNumber === 2) m.name = mReader.readString();
          else if (mTag.fieldNumber === 3) m.original_filename = mReader.readString();
          else if (mTag.fieldNumber === 4) m.file_path = mReader.readString();
          else if (mTag.fieldNumber === 5) m.public_url = mReader.readString();
          else if (mTag.fieldNumber === 6) m.file_size_bytes = mReader.readInt64();
          else if (mTag.fieldNumber === 7) m.mime_type = mReader.readString();
          else if (mTag.fieldNumber === 8) m.sha256_hash = mReader.readString();
          else if (mTag.fieldNumber === 9) m.media_type = mReader.readInt32();
          else if (mTag.fieldNumber === 10) m.width = mReader.readInt32();
          else if (mTag.fieldNumber === 11) m.height = mReader.readInt32();
          else if (mTag.fieldNumber === 12) m.duration_seconds = mReader.readInt32();
          else if (mTag.fieldNumber === 13) m.thumbnail_url = mReader.readString();
          else if (mTag.fieldNumber === 14) m.created_at = mReader.readString();
          else if (mTag.fieldNumber === 15) m.updated_at = mReader.readString();
          else mReader.skip(mTag.wireType);
        }
        if (m.id) media.push(m as MediaItem);
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

    return { data: media, total: total || media.length };
  },

  async getMediaItem(id: string): Promise<MediaItem> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'GetMedia', writer);
    const reader = new ProtoReader(resBytes);
    const m: Partial<MediaItem> = {};

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) m.id = reader.readString();
      else if (tag.fieldNumber === 2) m.name = reader.readString();
      else if (tag.fieldNumber === 3) m.original_filename = reader.readString();
      else if (tag.fieldNumber === 4) m.file_path = reader.readString();
      else if (tag.fieldNumber === 5) m.public_url = reader.readString();
      else if (tag.fieldNumber === 6) m.file_size_bytes = reader.readInt64();
      else if (tag.fieldNumber === 7) m.mime_type = reader.readString();
      else if (tag.fieldNumber === 8) m.sha256_hash = reader.readString();
      else if (tag.fieldNumber === 9) m.media_type = reader.readInt32();
      else if (tag.fieldNumber === 10) m.width = reader.readInt32();
      else if (tag.fieldNumber === 11) m.height = reader.readInt32();
      else if (tag.fieldNumber === 12) m.duration_seconds = reader.readInt32();
      else if (tag.fieldNumber === 13) m.thumbnail_url = reader.readString();
      else if (tag.fieldNumber === 14) m.created_at = reader.readString();
      else if (tag.fieldNumber === 15) m.updated_at = reader.readString();
      else reader.skip(tag.wireType);
    }

    if (!m.id) throw new Error(`Media ID ${id} tidak ditemukan`);
    return m as MediaItem;
  },

  async createMedia(data: { name: string; original_filename: string; file_path: string; public_url: string; file_size_bytes: number; mime_type: string; sha256_hash: string; media_type: number; width?: number; height?: number; duration_seconds?: number }): Promise<MediaItem> {
    const writer = new ProtoWriter();
    writer.writeString(1, data.name);
    writer.writeString(2, data.original_filename);
    writer.writeString(3, data.file_path);
    writer.writeString(4, data.public_url);
    writer.writeInt64(5, data.file_size_bytes);
    writer.writeString(6, data.mime_type);
    writer.writeString(7, data.sha256_hash);
    writer.writeInt32(8, data.media_type);
    if (data.width) writer.writeInt32(9, data.width);
    if (data.height) writer.writeInt32(10, data.height);
    if (data.duration_seconds) writer.writeInt32(11, data.duration_seconds);

    const resBytes = await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'CreateMedia', writer);
    const reader = new ProtoReader(resBytes);
    let mediaId = '';
    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) mediaId = reader.readString();
      else reader.skip(tag.wireType);
    }
    return this.getMediaItem(mediaId);
  },

  async updateMedia(id: string, data: { name?: string; thumbnail_url?: string }): Promise<MediaItem> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    if (data.name) writer.writeString(2, data.name);
    if (data.thumbnail_url) writer.writeString(3, data.thumbnail_url);

    await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'UpdateMedia', writer);
    return this.getMediaItem(id);
  },

  async deleteMedia(id: string): Promise<boolean> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'DeleteMedia', writer);
    return true;
  },

  // --------------------------------------------------------------------------
  // ROLES & IAM (ACCESS)
  // --------------------------------------------------------------------------
  async getRoles(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Role[]; total: number }> {
    const writer = new ProtoWriter();
    const pagWriter = new ProtoWriter();
    pagWriter.writeInt32(1, params?.page || 1);
    pagWriter.writeInt32(2, params?.limit || 25);
    writer.writeSubMessage(1, pagWriter);
    if (params?.search) writer.writeString(2, params.search);

    const resBytes = await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'ListRoles', writer);
    const reader = new ProtoReader(resBytes);
    const roles: Role[] = [];
    let total = 0;

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1 && tag.wireType === 2) {
        const itemBytes = reader.readBytes();
        const rReader = new ProtoReader(itemBytes);
        const r: Partial<Role> = { permissions: [] };
        while (rReader.hasMore()) {
          const rTag = rReader.readTag();
          if (!rTag) break;
          if (rTag.fieldNumber === 1) r.id = rReader.readString();
          else if (rTag.fieldNumber === 2) r.name = rReader.readString();
          else if (rTag.fieldNumber === 3) r.slug = rReader.readString();
          else if (rTag.fieldNumber === 4) r.description = rReader.readString();
          else if (rTag.fieldNumber === 5 && rTag.wireType === 2) {
            const pBytes = rReader.readBytes();
            const pReader = new ProtoReader(pBytes);
            while (pReader.hasMore()) {
              const pTag = pReader.readTag();
              if (!pTag) break;
              if (pTag.fieldNumber === 2) r.permissions?.push(pReader.readString());
              else pReader.skip(pTag.wireType);
            }
          } else if (rTag.fieldNumber === 6) r.created_at = rReader.readString();
          else if (rTag.fieldNumber === 7) r.updated_at = rReader.readString();
          else rReader.skip(rTag.wireType);
        }
        if (r.id) roles.push(r as Role);
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

    return { data: roles, total: total || roles.length };
  },

  async getRole(id: string): Promise<Role> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);

    const resBytes = await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'GetRole', writer);
    const reader = new ProtoReader(resBytes);
    const r: Partial<Role> = { permissions: [] };

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) r.id = reader.readString();
      else if (tag.fieldNumber === 2) r.name = reader.readString();
      else if (tag.fieldNumber === 3) r.slug = reader.readString();
      else if (tag.fieldNumber === 4) r.description = reader.readString();
      else if (tag.fieldNumber === 5 && tag.wireType === 2) {
        const pBytes = reader.readBytes();
        const pReader = new ProtoReader(pBytes);
        while (pReader.hasMore()) {
          const pTag = pReader.readTag();
          if (!pTag) break;
          if (pTag.fieldNumber === 2) r.permissions?.push(pReader.readString());
          else pReader.skip(pTag.wireType);
        }
      } else if (tag.fieldNumber === 6) r.created_at = reader.readString();
      else if (tag.fieldNumber === 7) r.updated_at = reader.readString();
      else reader.skip(tag.wireType);
    }

    if (!r.id) throw new Error(`Role ID ${id} tidak ditemukan`);
    return r as Role;
  },

  async createRole(data: { name: string; slug: string; description: string; permission_ids?: string[] }): Promise<Role> {
    const writer = new ProtoWriter();
    writer.writeString(1, data.name);
    writer.writeString(2, data.slug);
    writer.writeString(3, data.description || '');
    if (data.permission_ids) {
      for (const pId of data.permission_ids) {
        writer.writeString(4, pId);
      }
    }

    const resBytes = await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'CreateRole', writer);
    const reader = new ProtoReader(resBytes);
    let roleId = '';
    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1) roleId = reader.readString();
      else reader.skip(tag.wireType);
    }
    return this.getRole(roleId);
  },

  async updateRole(id: string, data: { name?: string; description?: string; permission_ids?: string[] }): Promise<Role> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    if (data.name) writer.writeString(2, data.name);
    if (data.description !== undefined) writer.writeString(3, data.description);
    if (data.permission_ids) {
      for (const pId of data.permission_ids) {
        writer.writeString(4, pId);
      }
    }

    await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'UpdateRole', writer);
    return this.getRole(id);
  },

  async deleteRole(id: string): Promise<boolean> {
    const writer = new ProtoWriter();
    writer.writeString(1, id);
    await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'DeleteRole', writer);
    return true;
  },

  async getPermissions(): Promise<Permission[]> {
    const writer = new ProtoWriter();
    const resBytes = await invokeGrpcMethod('signage.iam.v1.permission.PermissionService', 'ListPermissions', writer);
    const reader = new ProtoReader(resBytes);
    const perms: Permission[] = [];

    while (reader.hasMore()) {
      const tag = reader.readTag();
      if (!tag) break;
      if (tag.fieldNumber === 1 && tag.wireType === 2) {
        const itemBytes = reader.readBytes();
        const pReader = new ProtoReader(itemBytes);
        const p: Partial<Permission> = {};
        while (pReader.hasMore()) {
          const pTag = pReader.readTag();
          if (!pTag) break;
          if (pTag.fieldNumber === 1) p.id = pReader.readString();
          else if (pTag.fieldNumber === 2) p.code = pReader.readString();
          else if (pTag.fieldNumber === 3) p.name = pReader.readString();
          else if (pTag.fieldNumber === 4) p.description = pReader.readString();
          else if (pTag.fieldNumber === 5) p.module = pReader.readString();
          else pReader.skip(pTag.wireType);
        }
        if (p.id) perms.push(p as Permission);
      } else {
        reader.skip(tag.wireType);
      }
    }
    return perms;
  },
};

// ============================================================================
// STORAGE & SESSION HELPERS
// ============================================================================

export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('omnisign_session');
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('omnisign_session');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('omnisign_session', JSON.stringify(session));
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('omnisign_session');
  }
}
