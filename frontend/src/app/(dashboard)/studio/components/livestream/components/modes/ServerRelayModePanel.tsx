'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { SingleSelect } from '@/components/ui/SingleSelect';
import { StreamSourceType } from '../../types';
import { useLiveStreamEditor } from '../../context/LiveStreamEditorContext';

const WhipSourceConfig = dynamic(() => import('../sources/WhipSourceConfig'), { ssr: false });
const RtspSourceConfig = dynamic(() => import('../sources/RtspSourceConfig'), { ssr: false });
const YoutubeSourceConfig = dynamic(() => import('../sources/YoutubeSourceConfig'), { ssr: false });
const HlsSourceConfig = dynamic(() => import('../sources/HlsSourceConfig'), { ssr: false });
const EmbedSourceConfig = dynamic(() => import('../sources/EmbedSourceConfig'), { ssr: false });

const PROTOCOL_OPTIONS = [
  { value: 'WHIP', label: 'OBS Studio / Encoder (WHIP UDP)' },
  { value: 'RTSP', label: 'Kamera CCTV (RTSP)' },
  { value: 'YOUTUBE', label: 'YouTube Live' },
  { value: 'HLS', label: 'External HLS (.m3u8)' },
  { value: 'EMBED', label: 'Web Live Embed (Twitch / Vimeo / Lainnya)' },
];

export default function ServerRelayModePanel() {
  const {
    draft,
    setSourceType,
    updateWhip,
    updateRtsp,
    updateYoutube,
    updateHls,
    updateEmbed,
    streamKey,
    serverHost,
  } = useLiveStreamEditor();

  const host =
    serverHost ||
    (typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'sigma.dkaapis.test');
  const whipUrl =
    typeof window !== 'undefined' && window.location.host
      ? `${window.location.protocol}//${window.location.host}/streams/${streamKey}/whip`
      : `http://${host}/streams/${streamKey}/whip`;

  const handleProtocolChange = (val: string) => {
    setSourceType(val as StreamSourceType);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '4px',
          }}
        >
          Metode / Sumber Siaran
        </label>
        <SingleSelect
          value={draft.sourceType === 'RTMP' ? 'WHIP' : draft.sourceType}
          onChange={handleProtocolChange}
          options={PROTOCOL_OPTIONS}
          placeholder="Pilih Sumber Siaran"
        />
      </div>

      {draft.sourceType === 'RTMP' && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--accent-amber)',
            color: 'var(--text-primary)',
            fontSize: '0.74rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span>
            Siaran lama ini masih memakai <strong>RTMP (TCP)</strong> yang memiliki delay lebih
            tinggi. Pindahkan ke <strong>WHIP (UDP)</strong> di OBS Studio untuk latensi sub-detik.
          </span>
          <button
            type="button"
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: '0.73rem' }}
            onClick={() => setSourceType('WHIP')}
          >
            Pindah ke WHIP (UDP)
          </button>
        </div>
      )}

      {draft.sourceType === 'WHIP' && (
        <WhipSourceConfig
          whipUrl={whipUrl}
          requiresAuth={draft.protocols.WHIP.requiresAuth}
          onToggleAuth={(val) => updateWhip({ requiresAuth: val })}
          bearerToken={draft.protocols.WHIP.token}
          onChangeBearerToken={(val) => updateWhip({ token: val })}
        />
      )}

      {draft.sourceType === 'RTSP' && (
        <RtspSourceConfig
          sourceUrl={draft.protocols.RTSP.sourceUrl}
          onChangeSourceUrl={(val) => updateRtsp({ sourceUrl: val })}
          relayMode={draft.protocols.RTSP.relayMode}
          onChangeRelayMode={(mode) => updateRtsp({ relayMode: mode })}
          requiresAuth={draft.protocols.RTSP.requiresAuth}
          onToggleAuth={(val) => updateRtsp({ requiresAuth: val })}
          username={draft.protocols.RTSP.username}
          onChangeUsername={(val) => updateRtsp({ username: val })}
          password={draft.protocols.RTSP.password}
          onChangePassword={(val) => updateRtsp({ password: val })}
        />
      )}

      {draft.sourceType === 'YOUTUBE' && (
        <YoutubeSourceConfig
          sourceUrl={draft.protocols.YOUTUBE.sourceUrl}
          onChangeSourceUrl={(val) => updateYoutube({ sourceUrl: val })}
        />
      )}

      {draft.sourceType === 'HLS' && (
        <HlsSourceConfig
          sourceUrl={draft.protocols.HLS.sourceUrl}
          onChangeSourceUrl={(val) => updateHls({ sourceUrl: val })}
        />
      )}

      {draft.sourceType === 'EMBED' && (
        <EmbedSourceConfig
          sourceUrl={draft.protocols.EMBED.sourceUrl}
          onChangeSourceUrl={(val) => updateEmbed({ sourceUrl: val })}
        />
      )}
    </div>
  );
}
