import { speakQueueAnnouncement, stopQueueAnnouncement } from '@/app/(dashboard)/studio/components/ticket/types';

let activeCanvasAudio: HTMLAudioElement | null = null;

export function playCanvasQueueAudio(
  audios: any[],
  ticketNumber: string,
  counterName: string,
  isRecall: boolean = false,
  onFinished?: () => void
) {
  if (activeCanvasAudio) {
    try {
      activeCanvasAudio.pause();
      activeCanvasAudio.currentTime = 0;
    } catch (_) {}
    activeCanvasAudio = null;
  }
  stopQueueAnnouncement();

  const triggerTTS = () => {
    speakQueueAnnouncement(ticketNumber, counterName, isRecall, onFinished);
  };

  const playSynthChime = (onEnded?: () => void) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        onEnded?.();
        return;
      }
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.4);
      gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 1.4);
      osc2.onended = () => onEnded?.();
    } catch (_) {
      onEnded?.();
    }
  };

  const activeConf = (audios || []).find((a: any) => a.isActive !== false && (a.fileUrl || a.mediaItemId));
  const audioUrl = activeConf?.fileUrl || (activeConf?.mediaItemId ? `/api/assets/${activeConf.mediaItemId}` : null);

  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      activeCanvasAudio = audio;
      const vol = (activeConf?.volumePercent ?? 100) / 100;
      audio.volume = Math.max(0, Math.min(1, vol));

      let fallbackStarted = false;
      const fallbackToBell = () => {
        if (fallbackStarted) return;
        fallbackStarted = true;
        if (activeCanvasAudio === audio) activeCanvasAudio = null;
        audio.pause();
        playSynthChime(triggerTTS);
      };
      audio.onended = () => {
        if (fallbackStarted) return;
        if (activeCanvasAudio === audio) activeCanvasAudio = null;
        triggerTTS();
      };
      audio.onerror = fallbackToBell;

      const p = audio.play();
      if (p !== undefined) {
        p.catch(fallbackToBell);
      }
      return;
    } catch (_) {}
  }

  playSynthChime(triggerTTS);
}
