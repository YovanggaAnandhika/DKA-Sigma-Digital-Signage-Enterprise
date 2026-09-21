import { invokeApi } from '../../core/invokeApi';
import { MediaItem } from './types';

export async function getMedia(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: MediaItem[]; total: number }> {
  const payload = {
    search: params?.search,
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 25
    }
  };

  const result = await invokeApi<any>('/api/grpc/media/ListMedia', payload);
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getMediaItem(id: string): Promise<MediaItem> {
  const result = await invokeApi<any>('/api/grpc/media/GetMedia', { id });
  const m = result.media || result;
  if (!m || !m.id) throw new Error(`Media ID ${id} tidak ditemukan`);
  return m as MediaItem;
}

export async function createMedia(data: { name: string; original_filename: string; file_path: string; public_url: string; file_size_bytes: number; mime_type: string; sha256_hash: string; media_type: number; width?: number; height?: number; duration_seconds?: number }): Promise<MediaItem> {
  const result = await invokeApi<any>('/api/grpc/media/CreateMedia', data);
  const mediaId = result.media_id || result.mediaId;
  if (!mediaId) throw new Error('Gagal mendapatkan ID media setelah pembuatan');
  return getMediaItem(mediaId);
}

export async function updateMedia(id: string, data: { name?: string; thumbnail_url?: string }): Promise<MediaItem> {
  await invokeApi<any>('/api/grpc/media/UpdateMedia', { id, ...data });
  return getMediaItem(id);
}

export async function deleteMedia(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/media/DeleteMedia', { id });
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
  // Convert Uint8Array to base64 for JSON transport
  let binary = '';
  const len = data.chunk_data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data.chunk_data[i]);
  }
  const chunkDataB64 = btoa(binary);

  const payload = {
    uploadId: data.upload_id,
    originalFilename: data.original_filename,
    mimeType: data.mime_type,
    chunkIndex: data.chunk_index,
    totalChunks: data.total_chunks,
    chunkData: chunkDataB64,
    totalFileSizeBytes: data.total_file_size
  };

  const result = await invokeApi<any>('/api/grpc/media/UploadMediaChunk', payload);
  return {
    success: result.success,
    upload_id: result.upload_id || result.uploadId || '',
    chunk_index: result.chunk_index ?? result.chunkIndex ?? 0,
    is_completed: result.is_completed ?? result.isCompleted ?? false,
    file_path: result.file_path || result.filePath || '',
    public_url: result.public_url || result.publicUrl || '',
    sha256_hash: result.sha256_hash || result.sha256Hash || '',
    file_size_bytes: result.file_size_bytes ?? result.fileSizeBytes ?? 0,
    error_message: result.error_message || result.errorMessage || ''
  };
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
  const result = await invokeApi<any>('/api/grpc/media/GetMediaFile', { filename });

  // Convert base64 back to Uint8Array (field is now snake_case after normalization)
  const b64 = result.file_data || result.fileData || '';
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return {
    success: result.success,
    filename: result.filename,
    mime_type: result.mime_type || result.mimeType || '',
    file_data: bytes,
  };
}

