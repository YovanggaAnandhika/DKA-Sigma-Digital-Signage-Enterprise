import * as grpc from '@grpc/grpc-js';

export function getGrpcHost(): string {
  return process.env.DKA_GRPC_SERVER_HOST || 'localhost:50051';
}

export function getGrpcCredentials(): grpc.ChannelCredentials {
  const isSecure = process.env.DKA_GRPC_SERVER_SECURE === 'true';
  return isSecure ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();
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
  return undefined;
}

