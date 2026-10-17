'use client';

import React, { useState } from 'react';
import { Volume2, Music, FolderOpen, Play, CheckCircle2 } from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import QueueAudioPickerModal from '../QueueAudioPickerModal';

export default function TabAudioTab() {
  const { queue, updateField, updateAudio, triggerChime, simulator } = useQueueEditor();
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);

  const audioConf = queue.audios?.[0] || {
    id: 'aud-1',
    name: 'Chime Klasik (Ding-Dong)',
    audioType: 'preset',
    volumePercent: 80,
    isActive: true,
  };

  const handleSelectMediaAudio = (audio: { mediaItemId?: string; fileUrl: string; name: string }) => {
    updateAudio({
      name: audio.name,
      audioType: 'media_item',
      mediaItemId: audio.mediaItemId,
      fileUrl: audio.fileUrl,
      isActive: true,
    });
  };

  const handleResetToPreset = () => {
    updateAudio({
      name: 'Chime Klasik (Ding-Dong Web Audio)',
      audioType: 'preset',
      mediaItemId: undefined,
      fileUrl: undefined,
      isActive: true,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-elevated" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Volume2 size={18} color="var(--primary-500)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Audio Chime & Suara Panggilan Antrian
              </h4>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Bunyikan jingle bel atau suara kustom saat kasir/loket memanggil nomor antrian berikutnya.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={queue.audioChimeEnabled}
              onChange={(e) => updateField('audioChimeEnabled', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
            />
            {queue.audioChimeEnabled ? 'Aktif' : 'Nonaktif'}
          </label>
        </div>

        {queue.audioChimeEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Audio Source Option */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                onClick={handleResetToPreset}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: audioConf.audioType === 'preset' ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Music size={16} color="var(--primary-500)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Ding-Dong (Preset)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Nada Web Audio synthesizer dua nada (A5 & D5) standar ritel bandara/bank.
                </p>
              </div>

              <div
                onClick={() => setIsAudioPickerOpen(true)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: audioConf.audioType === 'media_item' ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <FolderOpen size={16} color="var(--primary-500)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Pustaka Media (Kustom MP3)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {audioConf.audioType === 'media_item' && audioConf.name
                    ? `File: ${audioConf.name}`
                    : 'Pilih file jingle audio kustom MP3 / WAV dari Pustaka Media.'}
                </p>
              </div>
            </div>

            {/* Volume slider & Test Audio */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Volume: {audioConf.volumePercent || 80}%
                </span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={audioConf.volumePercent || 80}
                  onChange={(e) => updateAudio({ volumePercent: parseInt(e.target.value, 10) })}
                  style={{ flex: 1, accentColor: 'var(--primary-500)' }}
                />
              </div>

              <button
                type="button"
                onClick={triggerChime}
                disabled={simulator.isChiming}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.75rem' }}
              >
                <Volume2 size={14} color={simulator.isChiming ? 'var(--primary-500)' : undefined} />
                {simulator.isChiming ? 'Memutar Audio...' : 'Tes Bunyi Bel'}
              </button>
            </div>
          </div>
        )}
      </div>

      <QueueAudioPickerModal
        isOpen={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelectAudio={handleSelectMediaAudio}
      />
    </div>
  );
}
