import * as grpc from '@grpc/grpc-js';

export function getGrpcHost(): string {
  return process.env.DKA_GRPC_SERVER_HOST || 'localhost:50051';
}

let cachedCredentials: grpc.ChannelCredentials | null = null;

export function getGrpcCredentials(): grpc.ChannelCredentials {
  if (!cachedCredentials) {
    const isSecure = process.env.DKA_GRPC_SERVER_SECURE === 'true';
    cachedCredentials = isSecure ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();
  }
  return cachedCredentials;
}

const clientCache = new Map<any, any>();

/**
 * Mengembalikan singleton instance gRPC client agar koneksi HTTP/2 ke backend
 * digunakan kembali (multiplexing) tanpa overhead pembuatan socket TCP baru setiap request.
 */
export function getGrpcClient<T>(ClientClass: new (address: string, credentials: grpc.ChannelCredentials, options?: object) => T): T {
  let client = clientCache.get(ClientClass);
  if (!client) {
    client = new ClientClass(getGrpcHost(), getGrpcCredentials(), {
      'grpc.keepalive_time_ms': 15000,
      'grpc.keepalive_timeout_ms': 5000,
      'grpc.keepalive_permit_without_calls': 1,
    });
    clientCache.set(ClientClass, client);
  }
  return client;
}

/**
 * Helper to get authorization metadata if needed
 */
export function getGrpcMetadata(token?: string): grpc.Metadata {
  const metadata = new grpc.Metadata();
  if (token) {
    metadata.add('authorization', `Bearer ${token}`);
  }
  return metadata;
}

/**
 * Helper to extract token from request
 */
export function getTokenFromRequest(req: Request): string | undefined {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  try {
    const url = new URL(req.url);
    const tokenQuery = url.searchParams.get('token');
    if (tokenQuery) return tokenQuery;
  } catch (_) {}
  return undefined;
}


