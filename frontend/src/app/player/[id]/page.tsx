'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { invokeApi } from '@/lib/core/invokeApi';
import { api } from '@/lib/services';
import { speakQueueAnnouncement, stopQueueAnnouncement } from '@/app/(dashboard)/studio/components/ticket/types';
import PlayerLayerRenderer, { ManifestAsset, Layer } from './components/PlayerLayerRenderer';
import { PlayerLoadingScreen, PlayerErrorScreen } from './components/PlayerStateScreens';

const PlayerControlOverlay = dynamic(() => import('./components/PlayerControlOverlay'), {
  ssr: false,
});

interface CompiledManifest {
  manifestId: string;
  deviceId: string;
  versionHash: string;
  generatedAt: string;
  layout?: {
    id: string;
    name: string;
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor?: string;
    backgroundImageUrl?: string;
    layersList: Layer[];
  };
  requiredAssetsList?: ManifestAsset[];
  totalDownloadSizeBytes?: number;
  isCanary?: boolean;
  powerSchedule?: {
    enabled: boolean;
    sleepTime: string;
    wakeTime: string;
  };
}

export default function WebKioskPlayerPage() {
  const params = useParams() as { id: string };
  const [manifest, setManifest] = useState<CompiledManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentHash, setCurrentHash] = useState<string>('');
  const [isSleeping, setIsSleeping] = useState(false);
  const [weatherData, setWeatherData] = useState<{ temp: number; code: number } | null>(null);
  const assetMapRef = useRef<Map<string, ManifestAsset>>(new Map());

  // Queue & Audio Ducking Engine
  const [queueState, setQueueState] = useState({ ticket: 'A-001', counter: 'LOKET 01', isCalling: false });
  const [isAudioDucked, setIsAudioDucked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Web Audio 2-tone Chime (Ding-Dong fallback: C5 523.25Hz -> E5 659.25Hz)
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      // Tone 1: C5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2: E5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.32);
      gain2.gain.setValueAtTime(0.35, now + 0.32);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.32);
      osc2.stop(now + 1.1);
    } catch (e) {
      console.warn('AudioContext chime error:', e);
    }
  }, []);

  const activeChimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeChimeTimerRef = useRef<any>(null);

  // Announce Queue Ticket with Custom Audio Chime + Indonesian TTS and Automatic Video Ducking
  const triggerQueueCall = useCallback((customTicket?: string, customCounter?: string, isRecall: boolean = false) => {
    const ticket = customTicket || queueState.ticket;
    const counter = customCounter || queueState.counter;

    // Immediately stop previous audio / speech to avoid overlapping voice glitch
    if (activeChimeAudioRef.current) {
      try {
        activeChimeAudioRef.current.pause();
        activeChimeAudioRef.current.currentTime = 0;
      } catch (_) {}
      activeChimeAudioRef.current = null;
    }
    if (activeChimeTimerRef.current) {
      clearTimeout(activeChimeTimerRef.current);
      activeChimeTimerRef.current = null;
    }
    stopQueueAnnouncement();

    setQueueState({ ticket, counter, isCalling: true });
    setIsAudioDucked(true);

    // Apply Audio Ducking: drop video volumes to 15%
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = false;
        video.volume = 0.15;
      }
    });

    const restoreAudio = () => {
      setQueueState((prev) => ({ ...prev, isCalling: false }));
      setIsAudioDucked(false);
      videoRefs.current.forEach((video) => {
        if (video) video.volume = 1.0;
      });
    };

    const triggerTTS = () => {
      speakQueueAnnouncement(ticket, counter, isRecall, () => {
        setTimeout(restoreAudio, 600);
      });
    };

    // Find custom chime audio from manifest layers/widgetData or requiredAssetsList
    let customAudioUrl: string | null = null;
    if (manifest?.layout?.layersList) {
      for (const layer of manifest.layout.layersList) {
        const blocks = layer.blocksList || (layer as any).timelineBlocksList;
        if (blocks) {
          for (const block of blocks) {
            if (block.widgetData?.audiosList?.length) {
              const act = block.widgetData.audiosList.find((a: any) => a.isActive !== false && (a.fileUrl || a.mediaItemId));
              if (act) {
                customAudioUrl = act.fileUrl || (act.mediaItemId ? `/api/assets/${act.mediaItemId}` : null);
                break;
              }
            }
            if (block.widgetDataJson) {
              try {
                const parsed = JSON.parse(block.widgetDataJson);
                const act = (parsed.audiosList || parsed.audios || []).find((a: any) => a.isActive !== false && (a.fileUrl || a.mediaItemId));
                if (act) {
                  customAudioUrl = act.fileUrl || (act.mediaItemId ? `/api/assets/${act.mediaItemId}` : null);
                  break;
                }
              } catch (_) {}
            }
          }
        }
        if (customAudioUrl) break;
      }
    }
    if (!customAudioUrl && manifest?.requiredAssetsList) {
      const audioAsset = manifest.requiredAssetsList.find((a) => a.mediaType === 1);
      if (audioAsset?.url) customAudioUrl = audioAsset.url;
    }

    if (customAudioUrl) {
      try {
        const audio = new Audio(customAudioUrl);
        activeChimeAudioRef.current = audio;
        audio.onended = () => {
          if (activeChimeAudioRef.current === audio) activeChimeAudioRef.current = null;
          triggerTTS();
        };
        audio.onerror = () => {
          if (activeChimeAudioRef.current === audio) activeChimeAudioRef.current = null;
          playChime();
          activeChimeTimerRef.current = setTimeout(triggerTTS, 1100);
        };
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            playChime();
            activeChimeTimerRef.current = setTimeout(triggerTTS, 1100);
          });
        }
        return;
      } catch (_) {}
    }

    playChime();
    activeChimeTimerRef.current = setTimeout(triggerTTS, 1100);
  }, [playChime, queueState.counter, queueState.ticket, manifest]);

  const triggerQueueCallRef = useRef(triggerQueueCall);
  useEffect(() => {
    triggerQueueCallRef.current = triggerQueueCall;
  }, [triggerQueueCall]);

  const lastCalledKeyRef = useRef<string>('');
  const lastCalledTimeRef = useRef<number>(0);

  // Real-time SSE listener for queue calls sent to this device or all devices
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      const devId = params.id || 'all';
      eventSource = new EventSource(`/api/stream/device?deviceId=${devId}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && (data.type === 'CALL_QUEUE' || data.type === 'QUEUE_CALL')) {
            const ticketNum = data.ticketNumber;
            const counterNm = data.counterName;
            const isRecall = data.callType === 'recall';
            if (ticketNum) {
              const key = `${ticketNum}_${counterNm || ''}_${isRecall}`;
              if (key === lastCalledKeyRef.current && Date.now() - lastCalledTimeRef.current < 2500) {
                return;
              }
              lastCalledKeyRef.current = key;
              lastCalledTimeRef.current = Date.now();
              triggerQueueCallRef.current(ticketNum, counterNm, isRecall);
            }
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [params.id]);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Weather Widget
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-5.1477&longitude=119.4327&current_weather=true');
        const json = await res.json();
        if (json.current_weather) {
          setWeatherData({
            temp: Math.round(json.current_weather.temperature),
            code: json.current_weather.weathercode,
          });
        }
      } catch {
        setWeatherData({ temp: 31, code: 1 });
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  // Display Power Management (CEC Sleep / Wake schedule)
  useEffect(() => {
    const evaluatePowerSchedule = () => {
      if (!manifest?.powerSchedule?.enabled) {
        setIsSleeping(false);
        return;
      }
      const now = new Date();
      const currentHms = now.toTimeString().slice(0, 8);
      const sleep = manifest.powerSchedule.sleepTime;
      const wake = manifest.powerSchedule.wakeTime;
      if (!sleep || !wake) return;

      const shouldSleep = sleep <= wake
        ? currentHms >= sleep && currentHms <= wake
        : currentHms >= sleep || currentHms <= wake;

      setIsSleeping(shouldSleep);
    };

    evaluatePowerSchedule();
    const interval = setInterval(evaluatePowerSchedule, 10000);
    return () => clearInterval(interval);
  }, [manifest?.powerSchedule]);

  const fetchManifest = useCallback(async (existingHash?: string) => {
    try {
      const res = await invokeApi<{
        isUpToDate: boolean;
        manifest?: CompiledManifest;
      }>('/api/grpc/distribution/manifest/GetActiveManifest', {
        deviceId: params.id,
        clientCurrentHash: existingHash || currentHash,
      });

      if (res.isUpToDate) {
        return;
      }

      if (res.manifest) {
        setManifest(res.manifest);
        setCurrentHash(res.manifest.versionHash);

        const newMap = new Map<string, ManifestAsset>();
        if (res.manifest.requiredAssetsList) {
          for (const asset of res.manifest.requiredAssetsList) {
            newMap.set(asset.mediaId, asset);
          }
        }
        assetMapRef.current = newMap;
        setError(null);
      }
    } catch (err: any) {
      console.warn('Failed to fetch manifest:', err);
      if (!manifest) {
        setError(err.message || 'Gagal memuat manifest tayangan');
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, currentHash, manifest]);

  useEffect(() => {
    fetchManifest();
    const interval = setInterval(() => {
      fetchManifest(currentHash);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchManifest, currentHash]);

  // Periodic Proof-of-Play reporting
  useEffect(() => {
    if (!manifest || !manifest.requiredAssetsList?.length) return;
    const interval = setInterval(async () => {
      try {
        const firstAsset = manifest.requiredAssetsList?.[0];
        if (firstAsset) {
          await api.reportPlaybackBatch(params.id, [{
            mediaId: firstAsset.mediaId,
            layoutId: manifest.layout?.id || '',
            startedAt: Math.floor(Date.now() / 1000) - 30,
            durationSeconds: 30,
            isCompleted: true,
          }]);
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [manifest, params.id]);

  if (loading && !manifest) {
    return <PlayerLoadingScreen deviceId={params.id} />;
  }

  if (error && !manifest) {
    return <PlayerErrorScreen error={error} />;
  }

  const layout = manifest?.layout;
  const canvasW = layout?.canvasWidth || 1920;
  const canvasH = layout?.canvasHeight || 1080;
  const layers = layout?.layersList || [];
  const assets = manifest?.requiredAssetsList || [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: layout?.backgroundColor || '#000000',
      backgroundImage: layout?.backgroundImageUrl ? `url(${layout.backgroundImageUrl})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        {layers.map((layer) => (
          <PlayerLayerRenderer
            key={layer.id}
            layer={layer}
            canvasW={canvasW}
            canvasH={canvasH}
            currentTime={currentTime}
            weatherData={weatherData}
            queueState={queueState}
            matchedAsset={assets[0]}
            videoRefs={videoRefs}
            isAudioDucked={isAudioDucked}
            isMuted={isMuted}
          />
        ))}
      </div>

      <PlayerControlOverlay
        isSleeping={isSleeping}
        wakeTime={manifest?.powerSchedule?.wakeTime}
        canvasW={canvasW}
        canvasH={canvasH}
        queueState={queueState}
        triggerQueueCall={triggerQueueCall}
        isAudioDucked={isAudioDucked}
      />
    </div>
  );
}
