'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SingleSelect } from '@/components/ui/SingleSelect';
import { StreamSourceType } from '../../types';
import { SourceModePanelProps } from './types';

const HlsSourceConfig = dynamic(() => import('../sources/HlsSourceConfig'), { ssr: false });
const YoutubeSourceConfig = dynamic(() => import('../sources/YoutubeSourceConfig'), { ssr: false });
const RtspSourceConfig = dynamic(() => import('../sources/RtspSourceConfig'), { ssr: false });

const ALLOWED_EMBED_TYPES: StreamSourceType[] = ['HLS', 'YOUTUBE_EMBED', 'RTSP'];

const PROTOCOL_OPTIONS = [
  { value: 'HLS', label: 'HLS' },
  { value: 'YOUTUBE_EMBED', label: 'YouTube Live' },
  { value: 'RTSP', label: 'RTSP' },
];

const SOURCE_REGISTRY: Record<string, React.ComponentType<any>> = {
  HLS: HlsSourceConfig,
  YOUTUBE_EMBED: YoutubeSourceConfig,
  RTSP: RtspSourceConfig,
};

export default function DirectEmbedModePanel({
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
}: SourceModePanelProps) {
  // Ensure protocol isolation: reset if current sourceType is not allowed in Direct Embed
  useEffect(() => {
    if (!ALLOWED_EMBED_TYPES.includes(sourceType)) {
      onChangeSourceType('HLS');
      onChangeSourceUrl('');
    }
  }, [sourceType, onChangeSourceType, onChangeSourceUrl]);

  const handleProtocolChange = (val: string) => {
    const nextType = val as StreamSourceType;
    onChangeSourceType(nextType);
    onChangeSourceUrl('');
  };

  const ActiveComponent = SOURCE_REGISTRY[sourceType] || HlsSourceConfig;

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
        sourceUrl={sourceUrl}
        onChangeSourceUrl={onChangeSourceUrl}
        requiresAuth={requiresAuth}
        onToggleAuth={onToggleAuth}
        username={username}
        onChangeUsername={onChangeUsername}
        password={password}
        onChangePassword={onChangePassword}
      />
    </div>
  );
}

