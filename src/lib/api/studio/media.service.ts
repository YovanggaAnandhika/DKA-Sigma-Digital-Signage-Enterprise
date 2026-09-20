import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { MediaItem } from './types';

export async function getMedia(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: MediaItem[]; total: number }> {
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
}

export async function getMediaItem(id: string): Promise<MediaItem> {
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
}

export async function createMedia(data: { name: string; original_filename: string; file_path: string; public_url: string; file_size_bytes: number; mime_type: string; sha256_hash: string; media_type: number; width?: number; height?: number; duration_seconds?: number }): Promise<MediaItem> {
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
  return getMediaItem(mediaId);
}

export async function updateMedia(id: string, data: { name?: string; thumbnail_url?: string }): Promise<MediaItem> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.thumbnail_url) writer.writeString(3, data.thumbnail_url);

  await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'UpdateMedia', writer);
  return getMediaItem(id);
}

export async function deleteMedia(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'DeleteMedia', writer);
  return true;
}

export interface UploadChunkResult {
  success: boolean;
  upload_id: string;
  chunk_index: number;
  is_completed: boolean;
  file_path: string;
  public_url: string;
  sha256_hash: string;
  file_size_bytes: number;
  error_message: string;
}

export async function uploadMediaChunk(data: {
  upload_id: string;
  original_filename: string;
  mime_type: string;
  chunk_index: number;
  total_chunks: number;
  chunk_data: Uint8Array;
  total_file_size: number;
}): Promise<UploadChunkResult> {
  const writer = new ProtoWriter();
  if (data.upload_id) writer.writeString(1, data.upload_id);
  writer.writeString(2, data.original_filename);
  writer.writeString(3, data.mime_type);
  writer.writeInt32(4, data.chunk_index);
  writer.writeInt32(5, data.total_chunks);
  writer.writeBytes(6, data.chunk_data);
  writer.writeInt64(7, data.total_file_size);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'UploadMediaChunk', writer);
  const reader = new ProtoReader(resBytes);
  const result: Partial<UploadChunkResult> = {
    success: false,
    upload_id: '',
    chunk_index: 0,
    is_completed: false,
    file_path: '',
    public_url: '',
    sha256_hash: '',
    file_size_bytes: 0,
    error_message: '',
  };

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) result.success = reader.readBool();
    else if (tag.fieldNumber === 2) result.upload_id = reader.readString();
    else if (tag.fieldNumber === 3) result.chunk_index = reader.readInt32();
    else if (tag.fieldNumber === 4) result.is_completed = reader.readBool();
    else if (tag.fieldNumber === 5) result.file_path = reader.readString();
    else if (tag.fieldNumber === 6) result.public_url = reader.readString();
    else if (tag.fieldNumber === 7) result.sha256_hash = reader.readString();
    else if (tag.fieldNumber === 8) result.file_size_bytes = reader.readInt64();
    else if (tag.fieldNumber === 9) result.error_message = reader.readString();
    else reader.skip(tag.wireType);
  }

  return result as UploadChunkResult;
}

export async function uploadFileViaGrpc(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ public_url: string; sha256_hash: string; file_path: string; file_size_bytes: number }> {
  const CHUNK_SIZE = 512 * 1024; // 512 KB per chunk
  const totalBytes = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_SIZE));
  const uploadId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let lastResult: UploadChunkResult | null = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalBytes);
    const slice = file.slice(start, end);
    const arrayBuffer = await slice.arrayBuffer();
    const chunkData = new Uint8Array(arrayBuffer);

    lastResult = await uploadMediaChunk({
      upload_id: uploadId,
      original_filename: file.name,
      mime_type: file.type || 'application/octet-stream',
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      chunk_data: chunkData,
      total_file_size: totalBytes,
    });

    if (!lastResult.success && lastResult.error_message) {
      throw new Error(`Gagal upload chunk ${chunkIndex + 1}/${totalChunks}: ${lastResult.error_message}`);
    }

    if (onProgress) {
      const progress = Math.min(100, Math.round(((chunkIndex + 1) / totalChunks) * 100));
      onProgress(progress);
    }
  }

  if (!lastResult || !lastResult.is_completed) {
    throw new Error('Upload gagal diselesaikan oleh backend gRPC');
  }

  return {
    public_url: lastResult.public_url,
    sha256_hash: lastResult.sha256_hash,
    file_path: lastResult.file_path,
    file_size_bytes: lastResult.file_size_bytes,
  };
}

export async function getMediaFile(filename: string): Promise<{ success: boolean; filename: string; mime_type: string; file_data: Uint8Array }> {
  const writer = new ProtoWriter();
  writer.writeString(1, filename);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.media.MediaService', 'GetMediaFile', writer);
  const reader = new ProtoReader(resBytes);
  const result = {
    success: false,
    filename: '',
    mime_type: 'application/octet-stream',
    file_data: new Uint8Array(0),
    error_message: '',
  };

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) result.success = reader.readBool();
    else if (tag.fieldNumber === 2) result.filename = reader.readString();
    else if (tag.fieldNumber === 3) result.mime_type = reader.readString();
    else if (tag.fieldNumber === 4) result.file_data = new Uint8Array(reader.readBytes());
    else if (tag.fieldNumber === 5) result.error_message = reader.readString();
    else reader.skip(tag.wireType);
  }

  return result;
}

