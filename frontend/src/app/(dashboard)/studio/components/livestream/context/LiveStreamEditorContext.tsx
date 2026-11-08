'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StreamSourceType, StreamMode, LiveStreamConfig } from '../types';
import {
  getLiveStream,
  createLiveStream,
  updateLiveStream,
} from '@/lib/services/studio/livestream.service';

export interface WhipConfig {
  requiresAuth: boolean;
  token: string;
}

export interface RtmpConfig {
  requiresAuth: boolean;
  username: string;
  password: string;
}

export interface RtspConfig {
  sourceUrl: string;
  requiresAuth: boolean;
  username: string;
  password: string;
}

export interface LiveStreamProtocolsState {
  WHIP: WhipConfig;
  RTMP: RtmpConfig;
  RTSP: RtspConfig;
}

export interface LiveStreamFormState {
  name: string;
  description: string;
  sourceType: StreamSourceType;
  autoReconnect: boolean;
  lowLatencyMode: boolean;
  isMuted: boolean;
  posterImageUrl: string;
  protocols: LiveStreamProtocolsState;
}

const DEFAULT_PROTOCOLS: LiveStreamProtocolsState = {
  WHIP: {
    requiresAuth: false,
    token: '',
  },
  RTMP: {
    requiresAuth: false,
    username: '',
    password: '',
  },
  RTSP: {
    sourceUrl: '',
    requiresAuth: false,
    username: '',
    password: '',
  },
};

const DEFAULT_STATE: LiveStreamFormState = {
  name: '',
  description: '',
  sourceType: 'WHIP',
  autoReconnect: true,
  lowLatencyMode: true,
  isMuted: true,
  posterImageUrl: '',
  protocols: DEFAULT_PROTOCOLS,
};

interface LiveStreamEditorContextValue {
  streamId: string;
  streamKey: string;
  serverHost: string;
  isEdit: boolean;
  // Draft values
  draft: LiveStreamFormState;
  // Top-level setters
  setName: (val: string) => void;
  setDescription: (val: string) => void;
  setSourceType: (val: StreamSourceType) => void;
  setAutoReconnect: (val: boolean) => void;
  setLowLatencyMode: (val: boolean) => void;
  setIsMuted: (val: boolean) => void;
  setPosterImageUrl: (val: string) => void;
  // Isolated Protocol-specific setters
  updateWhip: (val: Partial<WhipConfig>) => void;
  updateRtmp: (val: Partial<RtmpConfig>) => void;
  updateRtsp: (val: Partial<RtspConfig>) => void;
  // Status flags
  isDirty: boolean;
  saving: boolean;
  saveSuccess: boolean;
  errorMessage: string | null;
  // Actions
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
  const [serverHost, setServerHost] = useState<string>('sigma.dkaapis.test');

  const [savedState, setSavedState] = useState<LiveStreamFormState>(DEFAULT_STATE);
  const [draft, setDraft] = useState<LiveStreamFormState>(DEFAULT_STATE);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEdit = Boolean(streamId);
  const streamKey = streamId || generatedKey;

  // Initialize client host & fallback UUID
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname) {
      setServerHost(window.location.hostname);
    }
    if (!initialStreamId) {
      const newKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'stream-' + Math.random().toString(36).substring(2, 10);
      setGeneratedKey(newKey);
    }
  }, [initialStreamId]);

  // Load existing stream from backend when in edit mode
  useEffect(() => {
    if (!streamId) return;

    getLiveStream(streamId)
      .then((item: LiveStreamConfig) => {
        const type = (item.sourceType as StreamSourceType) || 'WHIP';
        const protocols: LiveStreamProtocolsState = {
          WHIP: {
            requiresAuth: type === 'WHIP' ? (item.requiresAuth ?? false) : false,
            token: type === 'WHIP' ? (item.ingestPassword || '') : '',
          },
          RTMP: {
            requiresAuth: type === 'RTMP' ? (item.requiresAuth ?? false) : false,
            username: type === 'RTMP' ? (item.ingestUsername || '') : '',
            password: type === 'RTMP' ? (item.ingestPassword || '') : '',
          },
          RTSP: {
            sourceUrl: type === 'RTSP' ? (item.sourceUrl || '') : '',
            requiresAuth: type === 'RTSP' ? (item.requiresAuth ?? false) : false,
            username: type === 'RTSP' ? (item.ingestUsername || '') : '',
            password: type === 'RTSP' ? (item.ingestPassword || '') : '',
          },
        };

        const loaded: LiveStreamFormState = {
          name: item.name || '',
          description: item.description || '',
          sourceType: type,
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

  // Check if draft has unsaved changes compared to locked saved state
  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(savedState);
  }, [draft, savedState]);

  // Top-level setters
  const setName = useCallback((name: string) => setDraft((prev) => ({ ...prev, name })), []);
  const setDescription = useCallback((description: string) => setDraft((prev) => ({ ...prev, description })), []);
  const setSourceType = useCallback((sourceType: StreamSourceType) => setDraft((prev) => ({ ...prev, sourceType })), []);
  const setAutoReconnect = useCallback((autoReconnect: boolean) => setDraft((prev) => ({ ...prev, autoReconnect })), []);
  const setLowLatencyMode = useCallback((lowLatencyMode: boolean) => setDraft((prev) => ({ ...prev, lowLatencyMode })), []);
  const setIsMuted = useCallback((isMuted: boolean) => setDraft((prev) => ({ ...prev, isMuted })), []);
  const setPosterImageUrl = useCallback((posterImageUrl: string) => setDraft((prev) => ({ ...prev, posterImageUrl })), []);

  // Isolated protocol-specific setters (changes NEVER bleed into other protocols)
  const updateWhip = useCallback((val: Partial<WhipConfig>) => {
    setDraft((prev) => ({
      ...prev,
      protocols: {
        ...prev.protocols,
        WHIP: { ...prev.protocols.WHIP, ...val },
      },
    }));
  }, []);

  const updateRtmp = useCallback((val: Partial<RtmpConfig>) => {
    setDraft((prev) => ({
      ...prev,
      protocols: {
        ...prev.protocols,
        RTMP: { ...prev.protocols.RTMP, ...val },
      },
    }));
  }, []);

  const updateRtsp = useCallback((val: Partial<RtspConfig>) => {
    setDraft((prev) => ({
      ...prev,
      protocols: {
        ...prev.protocols,
        RTSP: { ...prev.protocols.RTSP, ...val },
      },
    }));
  }, []);

  // Revert draft changes back to last saved state
  const revert = useCallback(() => {
    setDraft(savedState);
    setErrorMessage(null);
  }, [savedState]);

  // Save to database: locks the state and updates backend WITHOUT redirecting
  const save = useCallback(async () => {
    if (!draft.name.trim()) {
      setErrorMessage('Nama siaran wajib diisi.');
      return;
    }

    let effectiveSourceUrl = '';
    let requiresAuth = false;
    let ingestUsername = '';
    let ingestPassword = '';

    if (draft.sourceType === 'WHIP') {
      effectiveSourceUrl = `http://${serverHost}/streams/${streamKey}/whip`;
      requiresAuth = draft.protocols.WHIP.requiresAuth;
      ingestPassword = draft.protocols.WHIP.token.trim();
    } else if (draft.sourceType === 'RTMP') {
      effectiveSourceUrl = `rtmp://${serverHost}:1935/live/${streamKey}`;
      requiresAuth = draft.protocols.RTMP.requiresAuth;
      ingestUsername = draft.protocols.RTMP.username.trim();
      ingestPassword = draft.protocols.RTMP.password.trim();
    } else if (draft.sourceType === 'RTSP') {
      effectiveSourceUrl = draft.protocols.RTSP.sourceUrl.trim();
      requiresAuth = draft.protocols.RTSP.requiresAuth;
      ingestUsername = draft.protocols.RTSP.username.trim();
      ingestPassword = draft.protocols.RTSP.password.trim();

      if (!effectiveSourceUrl) {
        setErrorMessage('URL RTSP Kamera wajib diisi.');
        return;
      }
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      if (isEdit && streamId) {
        await updateLiveStream({
          id: streamId,
          name: draft.name.trim(),
          description: draft.description.trim(),
          streamMode: 'SERVER_HOSTED_HLS' as StreamMode,
          sourceType: draft.sourceType,
          sourceUrl: effectiveSourceUrl,
          serverHlsEndpoint: `/streams/${streamId}/live.m3u8`,
          isRelayActive: true,
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
          streamMode: 'SERVER_HOSTED_HLS' as StreamMode,
          sourceType: draft.sourceType,
          sourceUrl: effectiveSourceUrl,
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
  }, [draft, isEdit, streamId, streamKey, serverHost, router]);

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
      setAutoReconnect,
      setLowLatencyMode,
      setIsMuted,
      setPosterImageUrl,
      updateWhip,
      updateRtmp,
      updateRtsp,
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
      setAutoReconnect,
      setLowLatencyMode,
      setIsMuted,
      setPosterImageUrl,
      updateWhip,
      updateRtmp,
      updateRtsp,
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
