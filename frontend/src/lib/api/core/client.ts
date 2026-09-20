/**
 * OmniSign gRPC-Web Core Wire Protocol Implementation
 * Encodes & decodes binary Protobuf wire format and manages Envoy gRPC-Web HTTP requests.
 */

export const getEnvoyUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_GRPC_WEB_URL || 'http://envoy:8080';
  }
  return process.env.NEXT_PUBLIC_GRPC_WEB_URL || 'http://localhost:8080';
};

export const ENVOY_URL = getEnvoyUrl();

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
    this.writeTag(fieldNumber, 0);
    this.writeVarint(value);
  }

  writeInt64(fieldNumber: number, value: number): void {
    if (value === 0) return;
    this.writeTag(fieldNumber, 0);
    this.writeVarint(value);
  }

  writeBool(fieldNumber: number, value: boolean): void {
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

export async function invokeGrpcMethod(
  service: string,
  method: string,
  writer: ProtoWriter
): Promise<Uint8Array> {
  const frame = writer.toGrpcFrame();
  let token: string | null = null;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('omnisign_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.token && Date.now() <= (session.expiresAt || 0)) {
          token = session.token;
        }
      }
    } catch {
      // ignore
    }
  }

  const headers: Record<string, string> = {
    'content-type': 'application/grpc-web+proto',
    'x-grpc-web': '1',
  };

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${getEnvoyUrl()}/${service}/${method}`, {
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
