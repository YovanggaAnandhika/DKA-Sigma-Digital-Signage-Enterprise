'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { SingleSelect } from '@/components/ui/SingleSelect';
import { StreamSourceType } from '../../types';
import { useLiveStreamEditor } from '../../context/LiveStreamEditorContext';

const WhipSourceConfig = dynamic(() => import('../sources/WhipSourceConfig'), { ssr: false });
const RtmpSourceConfig = dynamic(() => import('../sources/RtmpSourceConfig'), { ssr: false });
const RtspSourceConfig = dynamic(() => import('../sources/RtspSourceConfig'), { ssr: false });

const PROTOCOL_OPTIONS = [
  { value: 'WHIP', label: 'WHIP' },
  { value: 'RTMP', label: 'RTMP' },
  { value: 'RTSP', label: 'RTSP CCTV' },
];

export default function ServerRelayModePanel() {
  const {
    draft,
    setSourceType,
    updateWhip,
    updateRtmp,
    updateRtsp,
    streamKey,
    serverHost,
  } = useLiveStreamEditor();

  const host = serverHost || (typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'sigma.dkaapis.test');
  const whipUrl = typeof window !== 'undefined' && window.location.host
    ? `${window.location.protocol}//${window.location.host}/streams/${streamKey}/whip`
    : `http://${host}/streams/${streamKey}/whip`;

  const rtmpServerUrl = `rtmp://${host}:1935/live`;
  const fullRtmpIngestUrl = `${rtmpServerUrl}/${streamKey}`;

  const handleProtocolChange = (val: string) => {
    setSourceType(val as StreamSourceType);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Protokol Sumber
        </label>
        <SingleSelect
          value={draft.sourceType}
          onChange={handleProtocolChange}
          options={PROTOCOL_OPTIONS}
          placeholder="Pilih Protokol"
        />
      </div>

      {draft.sourceType === 'WHIP' && (
        <WhipSourceConfig
          whipUrl={whipUrl}
          requiresAuth={draft.protocols.WHIP.requiresAuth}
          onToggleAuth={(val) => updateWhip({ requiresAuth: val })}
          bearerToken={draft.protocols.WHIP.token}
          onChangeBearerToken={(val) => updateWhip({ token: val })}
        />
      )}

      {draft.sourceType === 'RTMP' && (
        <RtmpSourceConfig
          serverUrl={rtmpServerUrl}
          fullRtmpIngestUrl={fullRtmpIngestUrl}
          streamKey={streamKey}
          requiresAuth={draft.protocols.RTMP.requiresAuth}
          onToggleAuth={(val) => updateRtmp({ requiresAuth: val })}
          username={draft.protocols.RTMP.username}
          onChangeUsername={(val) => updateRtmp({ username: val })}
          password={draft.protocols.RTMP.password}
          onChangePassword={(val) => updateRtmp({ password: val })}
        />
      )}

      {draft.sourceType === 'RTSP' && (
        <RtspSourceConfig
          sourceUrl={draft.protocols.RTSP.sourceUrl}
          onChangeSourceUrl={(val) => updateRtsp({ sourceUrl: val })}
          requiresAuth={draft.protocols.RTSP.requiresAuth}
          onToggleAuth={(val) => updateRtsp({ requiresAuth: val })}
          username={draft.protocols.RTSP.username}
          onChangeUsername={(val) => updateRtsp({ username: val })}
          password={draft.protocols.RTSP.password}
          onChangePassword={(val) => updateRtsp({ password: val })}
        />
      )}
    </div>
  );
}
