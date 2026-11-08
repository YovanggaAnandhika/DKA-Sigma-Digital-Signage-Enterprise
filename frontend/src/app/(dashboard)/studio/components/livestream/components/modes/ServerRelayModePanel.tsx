'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SingleSelect } from '@/components/ui/SingleSelect';
import { StreamSourceType } from '../../types';
import { SourceModePanelProps } from './types';

const WhipSourceConfig = dynamic(() => import('../sources/WhipSourceConfig'), { ssr: false });
const RtmpSourceConfig = dynamic(() => import('../sources/RtmpSourceConfig'), { ssr: false });
const RtspSourceConfig = dynamic(() => import('../sources/RtspSourceConfig'), { ssr: false });
const HlsSourceConfig = dynamic(() => import('../sources/HlsSourceConfig'), { ssr: false });

const ALLOWED_RELAY_TYPES: StreamSourceType[] = ['WHIP', 'RTMP', 'RTSP', 'HLS'];

const PROTOCOL_OPTIONS = [
  { value: 'WHIP', label: 'WHIP (WebRTC Port 80)' },
  { value: 'RTMP', label: 'RTMP (Port 1935)' },
  { value: 'RTSP', label: 'RTSP (Kamera IP)' },
  { value: 'HLS', label: 'HLS (Relay Feed)' },
];

function generateSecureToken(length = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sig_tok_';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const SOURCE_REGISTRY: Record<string, React.ComponentType<any>> = {
  WHIP: WhipSourceConfig,
  RTMP: RtmpSourceConfig,
  RTSP: RtspSourceConfig,
  HLS: HlsSourceConfig,
};

export default function ServerRelayModePanel({
  sourceType,
  onChangeSourceType,
  sourceUrl,
  onChangeSourceUrl,
  requiresAuth,
  onToggleAuth,
  username,
  onChangeUsername,
  password,
  onChangePassword,
  streamKey,
  serverHost,
}: SourceModePanelProps) {
  const whipUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/streams/${streamKey}/whip`
    : `http://${serverHost}/streams/${streamKey}/whip`;

  const rtmpServerUrl = `rtmp://${serverHost}:1935/live`;
  const fullRtmpIngestUrl = `${rtmpServerUrl}/${streamKey}`;

  // Isolation check: ensure sourceType is valid for Server Relay mode
  useEffect(() => {
    if (!ALLOWED_RELAY_TYPES.includes(sourceType)) {
      onChangeSourceType('WHIP');
      onChangeSourceUrl(whipUrl);
      return;
    }

    if (sourceType === 'WHIP') {
      onChangeSourceUrl(whipUrl);
    } else if (sourceType === 'RTMP') {
      onChangeSourceUrl(fullRtmpIngestUrl);
    }
  }, [sourceType, whipUrl, fullRtmpIngestUrl, onChangeSourceType, onChangeSourceUrl]);

  const handleProtocolChange = (val: string) => {
    const nextType = val as StreamSourceType;
    onChangeSourceType(nextType);
    if (nextType === 'WHIP') {
      onChangeSourceUrl(whipUrl);
      if (requiresAuth && !password) {
        onChangePassword(generateSecureToken());
      }
    } else if (nextType === 'RTMP') {
      onChangeSourceUrl(fullRtmpIngestUrl);
    } else {
      onChangeSourceUrl('');
    }
  };

  const handleGenerateToken = () => {
    onChangePassword(generateSecureToken());
  };

  const ActiveComponent = SOURCE_REGISTRY[sourceType] || WhipSourceConfig;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Protokol Sumber
        </label>
        <SingleSelect
          value={sourceType}
          onChange={handleProtocolChange}
          options={PROTOCOL_OPTIONS}
        />
      </div>

      {/* Render active source component without conditional if-else */}
      <ActiveComponent
        whipUrl={whipUrl}
        serverUrl={rtmpServerUrl}
        streamKey={streamKey}
        sourceUrl={sourceUrl}
        onChangeSourceUrl={onChangeSourceUrl}
        requiresAuth={requiresAuth}
        onToggleAuth={onToggleAuth}
        username={username}
        onChangeUsername={onChangeUsername}
        password={password}
        onChangePassword={onChangePassword}
        bearerToken={password}
        onChangeBearerToken={onChangePassword}
        onGenerateToken={handleGenerateToken}
      />
    </div>
  );
}

