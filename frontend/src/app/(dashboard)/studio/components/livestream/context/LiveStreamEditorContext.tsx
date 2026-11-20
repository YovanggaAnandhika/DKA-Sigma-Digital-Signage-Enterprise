'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StreamSourceType, StreamMode, LiveStreamConfig } from '../types';
import {
  getLiveStream,
  createLiveStream,
  updateLiveStream,
} from '@/lib/services/studio/livestream.service';
import { parseYouTubeLiveUrl } from '@/lib/core/youtubeLive';

function generateDefaultWhipToken(length = 20): string {
  const chars = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
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

export interface WhipConfig {
  requiresAuth: boolean;
  token: string;
}

export interface RtspConfig {
  sourceUrl: string;
  relayMode: 'SERVER' | 'DIRECT';
  requiresAuth: boolean;
  username: string;
  password: string;
}

export interface UrlSourceConfig {
  sourceUrl: string;
}

export interface LiveStreamProtocolsState {
  WHIP: WhipConfig;
  RTSP: RtspConfig;
  YOUTUBE: UrlSourceConfig;
  HLS: UrlSourceConfig;
  EMBED: UrlSourceConfig;
}

export interface LiveStreamFormState {
  name: string;
  description: string;
  sourceType: StreamSourceType;
  isRelayActive: boolean;
  autoReconnect: boolean;
  lowLatencyMode: boolean;
  isMuted: boolean;
  posterImageUrl: string;
  protocols: LiveStreamProtocolsState;
}

function buildDefaultState(): LiveStreamFormState {
  return {
    name: '',
    description: '',
    sourceType: 'WHIP',
    isRelayActive: true,
    autoReconnect: true,
    lowLatencyMode: true,
    isMuted: true,
    posterImageUrl: '',
    protocols: {
      WHIP: {
        requiresAuth: true,
        token: generateDefaultWhipToken(),
      },
      RTSP: {
        sourceUrl: '',
        relayMode: 'SERVER',
        requiresAuth: false,
        username: '',
        password: '',
      },
      YOUTUBE: { sourceUrl: '' },
      HLS: { sourceUrl: '' },
      EMBED: { sourceUrl: '' },
    },
  };
}

interface LiveStreamEditorContextValue {
  streamId: string;
  streamKey: string;
  serverHost: string;
  isEdit: boolean;
  draft: LiveStreamFormState;
  setName: (val: string) => void;
  setDescription: (val: string) => void;
  setSourceType: (val: StreamSourceType) => void;
  setIsRelayActive: (val: boolean) => void;
  setAutoReconnect: (val: boolean) => void;
  setLowLatencyMode: (val: boolean) => void;
  setIsMuted: (val: boolean) => void;
  setPosterImageUrl: (val: string) => void;
  updateWhip: (val: Partial<WhipConfig>) => void;
  updateRtsp: (val: Partial<RtspConfig>) => void;
  updateYoutube: (val: Partial<UrlSourceConfig>) => void;
  updateHls: (val: Partial<UrlSourceConfig>) => void;
  updateEmbed: (val: Partial<UrlSourceConfig>) => void;
  isDirty: boolean;
  saving: boolean;
  saveSuccess: boolean;
  errorMessage: string | null;
  save: () => Promise<void>;
  revert: () => void;
}

const LiveStreamEditorContext = createContext<LiveStreamEditorContextValue | undefined>(undefined);

export function useLiveStreamEditor() {
  const ctx = useContext(LiveStreamEditorContext);
  if (!ctx) {
    throw new Error('useLiveStreamEditor must be used within a LiveStreamEditorProvider');
  }
  return ctx;
}

interface ProviderProps {
  streamId?: string;
  children: React.ReactNode;
}

export function LiveStreamEditorProvider({ streamId: initialStreamId, children }: ProviderProps) {
  const router = useRouter();
  const [streamId, setStreamId] = useState<string>(initialStreamId || '');
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [serverHost, setServerHost] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.host : 'sigma.dkaapis.test'
  );

  const initialDefault = useMemo(() => buildDefaultState(), []);
  const [savedState, setSavedState] = useState<LiveStreamFormState>(initialDefault);
  const [draft, setDraft] = useState<LiveStreamFormState>(initialDefault);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEdit = Boolean(streamId);
  const streamKey = streamId || generatedKey;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname) {
      setServerHost(window.location.hostname);
    }
    if (!initialStreamId) {
      const newKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'stream-' + Math.random().toString(36).substring(2, 10);
      setGeneratedKey(newKey);
    }
  }, [initialStreamId]);

  useEffect(() => {
    if (!streamId) return;

    getLiveStream(streamId)
      .then((item: LiveStreamConfig) => {
        const type = ((item.sourceType || 'WHIP').toUpperCase() as StreamSourceType) || 'WHIP';
        const protocols: LiveStreamProtocolsState = {
          WHIP: {
            requiresAuth: type === 'WHIP' ? (item.requiresAuth ?? true) : true,
            token:
              type === 'WHIP'
                ? item.ingestPassword || ''
                : generateDefaultWhipToken(),
          },
          RTSP: {
            sourceUrl: type === 'RTSP' ? item.sourceUrl || '' : '',
            relayMode:
              type === 'RTSP' && item.streamMode === 'EXTERNAL_EMBED'
                ? 'DIRECT'
                : 'SERVER',
            requiresAuth: type === 'RTSP' ? (item.requiresAuth ?? false) : false,
            username: type === 'RTSP' ? item.ingestUsername || '' : '',
            password: type === 'RTSP' ? item.ingestPassword || '' : '',
          },
          YOUTUBE: {
            sourceUrl: type === 'YOUTUBE' ? item.sourceUrl || '' : '',
          },
          HLS: {
            sourceUrl: type === 'HLS' ? item.sourceUrl || '' : '',
          },
          EMBED: {
            sourceUrl: type === 'EMBED' ? item.sourceUrl || '' : '',
          },
        };

        const loaded: LiveStreamFormState = {
          name: item.name || '',
          description: item.description || '',
          sourceType: type,
          isRelayActive: item.isRelayActive ?? true,
          autoReconnect: item.autoReconnect ?? true,
          lowLatencyMode: item.lowLatencyMode ?? true,
          isMuted: item.isMuted ?? true,
          posterImageUrl: item.posterImageUrl || '',
          protocols,
        };
        setSavedState(loaded);
        setDraft(loaded);
      })
      .catch(() => {
        router.push('/studio/components/livestream');
      });
  }, [streamId, router]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(savedState);
  }, [draft, savedState]);

  const setName = useCallback((name: string) => setDraft((prev) => ({ ...prev, name })), []);
  const setDescription = useCallback((description: string) => setDraft((prev) => ({ ...prev, description })), []);
  const setSourceType = useCallback((sourceType: StreamSourceType) => setDraft((prev) => ({ ...prev, sourceType })), []);
  const setIsRelayActive = useCallback((isRelayActive: boolean) => setDraft((prev) => ({ ...prev, isRelayActive })), []);
  const setAutoReconnect = useCallback((autoReconnect: boolean) => setDraft((prev) => ({ ...prev, autoReconnect })), []);
  const setLowLatencyMode = useCallback((lowLatencyMode: boolean) => setDraft((prev) => ({ ...prev, lowLatencyMode })), []);
  const setIsMuted = useCallback((isMuted: boolean) => setDraft((prev) => ({ ...prev, isMuted })), []);
  const setPosterImageUrl = useCallback((posterImageUrl: string) => setDraft((prev) => ({ ...prev, posterImageUrl })), []);

  const updateWhip = useCallback((val: Partial<WhipConfig>) => {
    setDraft((prev) => ({
      ...prev,
      protocols: { ...prev.protocols, WHIP: { ...prev.protocols.WHIP, ...val } },
    }));
  }, []);

  const updateRtsp = useCallback((val: Partial<RtspConfig>) => {
    setDraft((prev) => ({
      ...prev,
      protocols: { ...prev.protocols, RTSP: { ...prev.protocols.RTSP, ...val } },
    }));
  }, []);

  const updateYoutube = useCallback((val: Partial<UrlSourceConfig>) => {
    setDraft((prev) => ({
      ...prev,
      protocols: { ...prev.protocols, YOUTUBE: { ...prev.protocols.YOUTUBE, ...val } },
    }));
  }, []);

  const updateHls = useCallback((val: Partial<UrlSourceConfig>) => {
    setDraft((prev) => ({
      ...prev,
      protocols: { ...prev.protocols, HLS: { ...prev.protocols.HLS, ...val } },
    }));
  }, []);

  const updateEmbed = useCallback((val: Partial<UrlSourceConfig>) => {
    setDraft((prev) => ({
      ...prev,
      protocols: { ...prev.protocols, EMBED: { ...prev.protocols.EMBED, ...val } },
    }));
  }, []);

  const revert = useCallback(() => {
    setDraft(savedState);
    setErrorMessage(null);
  }, [savedState]);

  const save = useCallback(async () => {
    if (!draft.name.trim()) {
      setErrorMessage('Nama siaran wajib diisi.');
      return;
    }

    let effectiveStreamMode: StreamMode = 'SERVER_HOSTED_HLS';
    let effectiveSourceUrl = '';
    let requiresAuth = false;
    let ingestUsername = '';
    let ingestPassword = '';

    if (draft.sourceType === 'WHIP') {
      effectiveStreamMode = 'SERVER_HOSTED_HLS';
      effectiveSourceUrl = `/streams/${streamKey}/whip`;
      requiresAuth = draft.protocols.WHIP.requiresAuth;
      ingestPassword = draft.protocols.WHIP.token.trim();
      if (requiresAuth && !ingestPassword) {
        setErrorMessage('Bearer token WHIP wajib diisi jika autentikasi aktif.');
        return;
      }
    } else if (draft.sourceType === 'RTSP') {
      effectiveStreamMode =
        draft.protocols.RTSP.relayMode === 'DIRECT' ? 'EXTERNAL_EMBED' : 'SERVER_HOSTED_HLS';
      effectiveSourceUrl = draft.protocols.RTSP.sourceUrl.trim();
      requiresAuth = draft.protocols.RTSP.requiresAuth;
      ingestUsername = draft.protocols.RTSP.username.trim();
      ingestPassword = draft.protocols.RTSP.password.trim();
      if (!effectiveSourceUrl) {
        setErrorMessage('URL RTSP Kamera wajib diisi.');
        return;
      }
    } else if (draft.sourceType === 'YOUTUBE') {
      effectiveStreamMode = 'EXTERNAL_EMBED';
      effectiveSourceUrl = draft.protocols.YOUTUBE.sourceUrl.trim();
      if (!parseYouTubeLiveUrl(effectiveSourceUrl)) {
        setErrorMessage('Masukkan URL YouTube Live yang valid (watch?v=, /live/, youtu.be/, atau /channel/UC.../live).');
        return;
      }
    } else if (draft.sourceType === 'HLS') {
      effectiveStreamMode = 'EXTERNAL_EMBED';
      effectiveSourceUrl = draft.protocols.HLS.sourceUrl.trim();
      if (!/^https?:\/\/.+/i.test(effectiveSourceUrl)) {
        setErrorMessage('Masukkan URL HLS (.m3u8) yang diawali http:// atau https://.');
        return;
      }
    } else if (draft.sourceType === 'EMBED') {
      effectiveStreamMode = 'EXTERNAL_EMBED';
      effectiveSourceUrl = draft.protocols.EMBED.sourceUrl.trim();
      if (!/^https?:\/\/.+/i.test(effectiveSourceUrl)) {
        setErrorMessage('Masukkan URL Web Live Embed yang diawali http:// atau https://.');
        return;
      }
    } else {
      setErrorMessage('Protokol RTMP (TCP) sudah tidak didukung untuk siaran baru. Pilih WHIP (UDP).');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      if (isEdit && streamId) {
        await updateLiveStream({
          id: streamId,
          name: draft.name.trim(),
          description: draft.description.trim(),
          streamMode: effectiveStreamMode,
          sourceType: draft.sourceType,
          sourceUrl: effectiveSourceUrl,
          serverHlsEndpoint:
            effectiveStreamMode === 'SERVER_HOSTED_HLS' ? `/streams/${streamId}/whep` : '',
          isRelayActive: draft.isRelayActive,
          autoReconnect: draft.autoReconnect,
          lowLatencyMode: draft.lowLatencyMode,
          isMuted: draft.isMuted,
          posterImageUrl: draft.posterImageUrl.trim(),
          requiresAuth,
          ingestUsername,
          ingestPassword,
        });

        setSavedState(draft);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        const created = await createLiveStream({
          name: draft.name.trim(),
          description: draft.description.trim(),
          streamMode: effectiveStreamMode,
          sourceType: draft.sourceType,
          sourceUrl: effectiveSourceUrl,
          isRelayActive: draft.isRelayActive,
          autoReconnect: draft.autoReconnect,
          lowLatencyMode: draft.lowLatencyMode,
          isMuted: draft.isMuted,
          posterImageUrl: draft.posterImageUrl.trim(),
          requiresAuth,
          ingestUsername,
          ingestPassword,
        });

        setSavedState(draft);
        setSaveSuccess(true);
        setStreamId(created.id);
        router.replace(`/studio/components/livestream/${created.id}/edit`);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan perubahan live stream.');
    } finally {
      setSaving(false);
    }
  }, [draft, isEdit, streamId, streamKey, router]);

  const value = useMemo(
    () => ({
      streamId,
      streamKey,
      serverHost,
      isEdit,
      draft,
      setName,
      setDescription,
      setSourceType,
      setIsRelayActive,
      setAutoReconnect,
      setLowLatencyMode,
      setIsMuted,
      setPosterImageUrl,
      updateWhip,
      updateRtsp,
      updateYoutube,
      updateHls,
      updateEmbed,
      isDirty,
      saving,
      saveSuccess,
      errorMessage,
      save,
      revert,
    }),
    [
      streamId,
      streamKey,
      serverHost,
      isEdit,
      draft,
      setName,
      setDescription,
      setSourceType,
      setIsRelayActive,
      setAutoReconnect,
      setLowLatencyMode,
      setIsMuted,
      setPosterImageUrl,
      updateWhip,
      updateRtsp,
      updateYoutube,
      updateHls,
      updateEmbed,
      isDirty,
      saving,
      saveSuccess,
      errorMessage,
      save,
      revert,
    ]
  );

  return (
    <LiveStreamEditorContext.Provider value={value}>
      {children}
    </LiveStreamEditorContext.Provider>
  );
}
