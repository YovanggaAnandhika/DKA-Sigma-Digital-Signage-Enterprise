'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StreamSourceType, StreamMode } from '../types';
import {
  getLiveStream,
  createLiveStream,
  updateLiveStream,
} from '@/lib/services/studio/livestream.service';
import { LiveStreamConfig } from '../types';

interface LiveStreamFormState {
  name: string;
  description: string;
  sourceType: StreamSourceType;
  sourceUrl: string;
  autoReconnect: boolean;
  lowLatencyMode: boolean;
  isMuted: boolean;
  posterImageUrl: string;
  requiresAuth: boolean;
  ingestUsername: string;
  ingestPassword: string;
}

const DEFAULT_STATE: LiveStreamFormState = {
  name: '',
  description: '',
  sourceType: 'WHIP',
  sourceUrl: '',
  autoReconnect: true,
  lowLatencyMode: true,
  isMuted: true,
  posterImageUrl: '',
  requiresAuth: false,
  ingestUsername: '',
  ingestPassword: '',
};

interface LiveStreamEditorContextValue {
  streamId: string;
  streamKey: string;
  serverHost: string;
  isEdit: boolean;
  // Draft values
  draft: LiveStreamFormState;
  // Setters
  setName: (val: string) => void;
  setDescription: (val: string) => void;
  setSourceType: (val: StreamSourceType) => void;
  setSourceUrl: (val: string) => void;
  setAutoReconnect: (val: boolean) => void;
  setLowLatencyMode: (val: boolean) => void;
  setIsMuted: (val: boolean) => void;
  setPosterImageUrl: (val: string) => void;
  setRequiresAuth: (val: boolean) => void;
  setIngestUsername: (val: string) => void;
  setIngestPassword: (val: string) => void;
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
  const [serverHost, setServerHost] = useState<string>('');

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
        const loaded: LiveStreamFormState = {
          name: item.name || '',
          description: item.description || '',
          sourceType: (item.sourceType as StreamSourceType) || 'WHIP',
          sourceUrl: item.sourceUrl || '',
          autoReconnect: item.autoReconnect ?? true,
          lowLatencyMode: item.lowLatencyMode ?? true,
          isMuted: item.isMuted ?? true,
          posterImageUrl: item.posterImageUrl || '',
          requiresAuth: item.requiresAuth ?? false,
          ingestUsername: item.ingestUsername ?? '',
          ingestPassword: item.ingestPassword ?? '',
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

  // Field setters that modify draft in-memory without saving to DB
  const setName = useCallback((name: string) => setDraft((prev) => ({ ...prev, name })), []);
  const setDescription = useCallback((description: string) => setDraft((prev) => ({ ...prev, description })), []);
  const setSourceType = useCallback((sourceType: StreamSourceType) => setDraft((prev) => ({ ...prev, sourceType })), []);
  const setSourceUrl = useCallback((sourceUrl: string) => setDraft((prev) => ({ ...prev, sourceUrl })), []);
  const setAutoReconnect = useCallback((autoReconnect: boolean) => setDraft((prev) => ({ ...prev, autoReconnect })), []);
  const setLowLatencyMode = useCallback((lowLatencyMode: boolean) => setDraft((prev) => ({ ...prev, lowLatencyMode })), []);
  const setIsMuted = useCallback((isMuted: boolean) => setDraft((prev) => ({ ...prev, isMuted })), []);
  const setPosterImageUrl = useCallback((posterImageUrl: string) => setDraft((prev) => ({ ...prev, posterImageUrl })), []);
  const setRequiresAuth = useCallback((requiresAuth: boolean) => setDraft((prev) => ({ ...prev, requiresAuth })), []);
  const setIngestUsername = useCallback((ingestUsername: string) => setDraft((prev) => ({ ...prev, ingestUsername })), []);
  const setIngestPassword = useCallback((ingestPassword: string) => setDraft((prev) => ({ ...prev, ingestPassword })), []);

  // Revert draft changes back to last saved state
  const revert = useCallback(() => {
    setDraft(savedState);
    setErrorMessage(null);
  }, [savedState]);

  // Save to database: locks the state and updates backend WITHOUT redirecting
  const save = useCallback(async () => {
    const effectiveSourceUrl = draft.sourceUrl.trim();
    if (!draft.name.trim() || !effectiveSourceUrl) {
      setErrorMessage('Nama siaran dan URL sumber wajib diisi.');
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
          streamMode: 'SERVER_HOSTED_HLS' as StreamMode,
          sourceType: draft.sourceType,
          sourceUrl: effectiveSourceUrl,
          serverHlsEndpoint: `/streams/${streamId}/live.m3u8`,
          isRelayActive: true,
          autoReconnect: draft.autoReconnect,
          lowLatencyMode: draft.lowLatencyMode,
          isMuted: draft.isMuted,
          posterImageUrl: draft.posterImageUrl.trim(),
          requiresAuth: draft.requiresAuth,
          ingestUsername: draft.requiresAuth && draft.sourceType !== 'WHIP' ? draft.ingestUsername.trim() : '',
          ingestPassword: draft.requiresAuth ? draft.ingestPassword.trim() : '',
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
          requiresAuth: draft.requiresAuth,
          ingestUsername: draft.requiresAuth && draft.sourceType !== 'WHIP' ? draft.ingestUsername.trim() : '',
          ingestPassword: draft.requiresAuth ? draft.ingestPassword.trim() : '',
        });

        setSavedState(draft);
        setSaveSuccess(true);
        setStreamId(created.id);
        // Seamlessly switch URL from create to edit without full page redirect
        router.replace(`/studio/components/livestream/${created.id}/edit`);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan perubahan live stream.');
    } finally {
      setSaving(false);
    }
  }, [draft, isEdit, streamId, router]);

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
      setSourceUrl,
      setAutoReconnect,
      setLowLatencyMode,
      setIsMuted,
      setPosterImageUrl,
      setRequiresAuth,
      setIngestUsername,
      setIngestPassword,
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
      setSourceUrl,
      setAutoReconnect,
      setLowLatencyMode,
      setIsMuted,
      setPosterImageUrl,
      setRequiresAuth,
      setIngestUsername,
      setIngestPassword,
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
