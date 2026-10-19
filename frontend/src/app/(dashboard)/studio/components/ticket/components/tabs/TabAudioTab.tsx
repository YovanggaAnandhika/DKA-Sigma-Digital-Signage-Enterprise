'use client';

import React, { useState } from 'react';
import { Volume2, Music, FolderOpen, Play, CheckCircle2, Sliders, Check } from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import QueueAudioPickerModal from '../QueueAudioPickerModal';
import { SECTOR_PRESETS, speakQueueAnnouncement } from '../../types';

export default function TabAudioTab() {
  const { queue, updateField, updateAudio, triggerChime, simulator } = useQueueEditor();
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [isTestingTts, setIsTestingTts] = useState(false);

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

  const handleSelectSectorPreset = (presetId: string) => {
    const preset = SECTOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    updateField('sectorType', preset.id);
    updateField('ticketLabel', preset.ticketLabel);
    updateField('counterLabel', preset.counterLabel);
    updateField('ttsTemplateCall', preset.ttsTemplateCall);
    updateField('ttsTemplateRecall', preset.ttsTemplateRecall);
    updateField('ttsTemplateBreak', preset.ttsTemplateBreak);
  };

  const handleTestTtsVoice = () => {
    setIsTestingTts(true);
    speakQueueAnnouncement(
      'A-005',
      `${queue.counterLabel || 'Loket'} 1`,
      false,
      () => setIsTestingTts(false),
      queue
    );
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

      {/* Sektor & Naskah TTS Card */}
      <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={18} color="var(--primary-500)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Sektor Industri & Naskah Suara TTS
              </h4>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sesuaikan istilah (Tiket/Pesanan, Loket/Poli/Teller) dan susunan pengucapan suara mesin pemanggil.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestTtsVoice}
            disabled={isTestingTts}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px 12px' }}
          >
            <Volume2 size={14} color={isTestingTts ? 'var(--primary-500)' : undefined} />
            <span>{isTestingTts ? 'Menguji...' : 'Uji Suara Naskah'}</span>
          </button>
        </div>

        {/* Sector Presets Grid */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Pilih Sektor Industri:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {SECTOR_PRESETS.map((preset) => {
              const isSelected = (queue.sectorType || 'HOSPITAL') === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectSectorPreset(preset.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? 'var(--primary-400)' : 'var(--text-primary)' }}>
                      {preset.name}
                    </span>
                    {isSelected && <Check size={14} color="var(--primary-500)" />}
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {preset.ticketLabel} → {preset.counterLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Label Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Label Tiket / Nomor:
            </label>
            <input
              type="text"
              value={queue.ticketLabel || 'Nomor Antrian'}
              onChange={(e) => updateField('ticketLabel', e.target.value)}
              placeholder="Nomor Antrian, Nomor Pesanan"
              style={{
                width: '100%',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                padding: '7px 10px',
                fontSize: '0.8125rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Label Pos / Loket:
            </label>
            <input
              type="text"
              value={queue.counterLabel || 'Loket'}
              onChange={(e) => updateField('counterLabel', e.target.value)}
              placeholder="Loket, Teller, Pickup Point, Poli"
              style={{
                width: '100%',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                padding: '7px 10px',
                fontSize: '0.8125rem',
              }}
            />
          </div>
        </div>

        {/* TTS Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Naskah Panggilan Pertama (TTS):
            </label>
            <input
              type="text"
              value={queue.ttsTemplateCall || '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}'}
              onChange={(e) => updateField('ttsTemplateCall', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                padding: '7px 10px',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Naskah Panggilan Ulang (Recall):
            </label>
            <input
              type="text"
              value={queue.ttsTemplateRecall || 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}'}
              onChange={(e) => updateField('ttsTemplateRecall', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                padding: '7px 10px',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Naskah Istirahat Loket:
            </label>
            <input
              type="text"
              value={queue.ttsTemplateBreak || '{counter_label} {counter_name} sedang istirahat'}
              onChange={(e) => updateField('ttsTemplateBreak', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                padding: '7px 10px',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Variabel:</span>
            {['{ticket_label}', '{ticket_number}', '{counter_label}', '{counter_name}'].map((v) => (
              <code
                key={v}
                style={{
                  fontSize: '0.6875rem',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {v}
              </code>
            ))}
          </div>
        </div>
      </div>

      <QueueAudioPickerModal
        isOpen={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelectAudio={handleSelectMediaAudio}
      />
    </div>
  );
}
