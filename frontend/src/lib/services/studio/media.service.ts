import { invokeApi } from '../../core/invokeApi';
import { MediaItem } from './types';

/**
 * Returns a URL that streams the media file directly from gRPC backend.
 * The URL can be used as src for <video> or <img> elements.
 * Uses the filename (file_path basename or public_url path) as identifier.
 */
export function getMediaStreamUrl(filename: string): string {
  return `/api/grpc/media/StreamMediaFile?filename=${encodeURIComponent(filename)}`;
}

/**
 * Returns the best display URL for a media item:
 * 1. public_url if available and non-empty (e.g. /api/assets/...)
 * 2. Falls back to gRPC stream URL using file_path basename
 *    (backend stores files as {timestamp}_{sanitized_name}, not original_filename)
 */
export function getMediaDisplayUrl(item: MediaItem): string {
  if (item.publicUrl && item.publicUrl.startsWith('/api/assets/')) {
    return item.publicUrl;
  }
  if (item.publicUrl && item.publicUrl.startsWith('http')) {
    return item.publicUrl;
  }
  // Use file_path basename — this is the actual stored filename on backend
  // e.g. file_path = "/storage/media/1724490720000_vidssave.com_Hi-Tech_Intro_720P.mp4"
  const storedFilename = item.filePath?.split('/').pop() || '';
  if (storedFilename) return getMediaStreamUrl(storedFilename);
  return '';
}

export async function getMedia(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: MediaItem[]; total: number }> {
  const payload = {
    search: params?.search,
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 25
    }
  };

  const result = await invokeApi<any>('/api/grpc/media/ListMedia', payload);
  const data: MediaItem[] = result.itemsList || [];

  return {
    data,
    total: result.pagination?.totalItems ?? data.length
  };
}

export async function getMediaItem(id: string): Promise<MediaItem> {
  const result = await invokeApi<any>('/api/grpc/media/GetMedia', { id });
  const m = result.media || result;
  if (!m || !m.id) throw new Error(`Media ID ${id} tidak ditemukan`);
  return m as MediaItem;
}

export async function createMedia(data: { name: string; originalFilename: string; filePath: string; publicUrl: string; fileSizeBytes: number; mimeType: string; sha256Hash: string; mediaType: number; width?: number; height?: number; durationSeconds?: number }): Promise<MediaItem> {
  const result = await invokeApi<any>('/api/grpc/media/CreateMedia', {
    ...data,
    durationSeconds: data.durationSeconds,
    duration_seconds: data.durationSeconds,
  });
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
  filePath: string;
  publicUrl: string;
  sha256Hash: string;
  fileSizeBytes: number;
  error_message: string;
}

export async function uploadMediaChunk(data: {
  upload_id: string;
  originalFilename: string;
  mimeType: string;
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
    originalFilename: data.originalFilename,
    mimeType: data.mimeType,
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
    filePath: result.filePath || result.filePath || '',
    publicUrl: result.publicUrl || result.publicUrl || '',
    sha256Hash: result.sha256Hash || result.sha256Hash || '',
    fileSizeBytes: result.fileSizeBytes ?? result.fileSizeBytes ?? 0,
    error_message: result.error_message || result.errorMessage || ''
  };
}

export async function uploadFileViaGrpc(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ publicUrl: string; sha256Hash: string; filePath: string; fileSizeBytes: number }> {
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
      originalFilename: file.name,
      mimeType: file.type || 'application/octet-stream',
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
    publicUrl: lastResult.publicUrl,
    sha256Hash: lastResult.sha256Hash,
    filePath: lastResult.filePath,
    fileSizeBytes: lastResult.fileSizeBytes,
  };
}

export async function getMediaFile(filename: string): Promise<{ success: boolean; filename: string; mimeType: string; file_data: Uint8Array }> {
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
    mimeType: result.mimeType || result.mimeType || '',
    file_data: bytes,
  };
}

