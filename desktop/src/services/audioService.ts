import type { SfxType, AmbientType } from "@campfire/core";
import { useAppStore } from "../store/useAppStore";

export type { SfxType, AmbientType };

let ambientAudio: HTMLAudioElement | null = null;
let currentAmbientType: AmbientType | null = null;

let sfxAudioContext: AudioContext | null = null;
const sfxBuffers = new Map<SfxType, AudioBuffer>();
const sfxLoadingPromises = new Map<SfxType, Promise<AudioBuffer | null>>();

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sfxAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sfxAudioContext = new AudioContextClass();
    }
  }
  if (sfxAudioContext && sfxAudioContext.state === "suspended") {
    sfxAudioContext.resume().catch(() => {});
  }
  return sfxAudioContext;
}

/**
 * Loads and decodes an SFX audio file into an in-memory AudioBuffer.
 */
async function loadSfxBuffer(type: SfxType): Promise<AudioBuffer | null> {
  if (sfxBuffers.has(type)) return sfxBuffers.get(type)!;
  if (sfxLoadingPromises.has(type)) return sfxLoadingPromises.get(type)!;

  const promise = (async () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return null;
      const res = await fetch(`/sounds/${type}.mp3`);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      sfxBuffers.set(type, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    } finally {
      sfxLoadingPromises.delete(type);
    }
  })();

  sfxLoadingPromises.set(type, promise);
  return promise;
}

/**
 * Preloads all SFX audio buffers into memory for zero-latency instant playback.
 */
export function preloadSfx(): void {
  const sfxList: SfxType[] = ["pencil-tick", "sparkle"];
  for (const type of sfxList) {
    loadSfxBuffer(type).catch(() => {});
  }
}

// Auto-warm AudioContext and buffers on the first user interaction
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    preloadSfx();
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true, once: true });
  window.addEventListener("keydown", unlockAudio, { passive: true, once: true });
}

/**
 * Plays a one-shot sound effect with sub-millisecond dispatch via Web Audio API.
 * Falls back to HTMLAudioElement if Web Audio API is unavailable.
 */
export function playSfx(type: SfxType) {
  try {
    const config = useAppStore.getState().config;
    if (!config.sound_sfx_enabled) return;

    const rawVolume =
      type === "pencil-tick"
        ? (config.sound_sfx_scratchpad_volume ?? config.sound_sfx_volume ?? 70)
        : (config.sound_sfx_heart_volume ?? config.sound_sfx_volume ?? 70);

    if (rawVolume <= 0) return;

    const normalizedVolume = Math.min(1, Math.max(0, rawVolume / 100));
    const ctx = getAudioContext();

    if (!ctx) {
      const fallback = new Audio(`/sounds/${type}.mp3`);
      fallback.volume = normalizedVolume;
      fallback.play().catch(() => {});
      return;
    }

    const buffer = sfxBuffers.get(type);
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = normalizedVolume;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } else {
      // Buffer not cached yet — load and play immediately
      loadSfxBuffer(type).then((loadedBuf) => {
        if (!loadedBuf || !ctx) return;
        const source = ctx.createBufferSource();
        source.buffer = loadedBuf;
        const gainNode = ctx.createGain();
        gainNode.gain.value = normalizedVolume;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
      });
    }
  } catch {
    // Fallback if audio cannot be initialized
  }
}

/**
 * Synchronizes the looping ambient soundscape with current state.
 */
export function syncAmbientAudio(enabled: boolean, type: AmbientType, volume: number) {
  try {
    if (!enabled || volume <= 0) {
      if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
        ambientAudio = null;
        currentAmbientType = null;
      }
      return;
    }

    const normalizedVolume = Math.min(1, Math.max(0, volume / 100));

    if (ambientAudio && currentAmbientType === type) {
      ambientAudio.volume = normalizedVolume;
      if (ambientAudio.paused) {
        ambientAudio.play().catch(() => {});
      }
      return;
    }

    if (ambientAudio) {
      ambientAudio.pause();
      ambientAudio.currentTime = 0;
      ambientAudio = null;
    }

    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.loop = true;
    audio.volume = normalizedVolume;
    ambientAudio = audio;
    currentAmbientType = type;
    audio.play().catch(() => {});
  } catch {
    // Fallback
  }
}

/**
 * Pauses and resets current ambient audio.
 */
export function stopAmbientAudio() {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
    currentAmbientType = null;
  }
}
