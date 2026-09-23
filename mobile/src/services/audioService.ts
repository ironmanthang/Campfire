import type { SfxType, AmbientType } from "@campfire/core";

export type { SfxType, AmbientType };

export const SOUND_STORAGE_KEYS = {
  sfxEnabled: "campfire_mobile_sound_sfx_enabled",
  sfxVolume: "campfire_mobile_sound_sfx_volume",
  ambientEnabled: "campfire_mobile_sound_ambient_enabled",
  ambientType: "campfire_mobile_sound_ambient_type",
  ambientVolume: "campfire_mobile_sound_ambient_volume",
} as const;

export interface SoundConfig {
  sfxEnabled: boolean;
  sfxVolume: number; // 0-100
  ambientEnabled: boolean;
  ambientType: AmbientType;
  ambientVolume: number; // 0-100
}

export function getSoundConfig(): SoundConfig {
  const sfxEnabled = localStorage.getItem(SOUND_STORAGE_KEYS.sfxEnabled) === "true";
  const sfxVolumeStr = localStorage.getItem(SOUND_STORAGE_KEYS.sfxVolume);
  const sfxVolume = sfxVolumeStr !== null ? parseInt(sfxVolumeStr, 10) : 70;

  const ambientEnabled = localStorage.getItem(SOUND_STORAGE_KEYS.ambientEnabled) === "true";
  const ambientType = (localStorage.getItem(SOUND_STORAGE_KEYS.ambientType) as AmbientType) || "campfire";
  const ambientVolumeStr = localStorage.getItem(SOUND_STORAGE_KEYS.ambientVolume);
  const ambientVolume = ambientVolumeStr !== null ? parseInt(ambientVolumeStr, 10) : 50;

  return {
    sfxEnabled,
    sfxVolume: isNaN(sfxVolume) ? 70 : sfxVolume,
    ambientEnabled,
    ambientType,
    ambientVolume: isNaN(ambientVolume) ? 50 : ambientVolume,
  };
}

export function saveSoundConfig(config: Partial<SoundConfig>) {
  if (config.sfxEnabled !== undefined) {
    localStorage.setItem(SOUND_STORAGE_KEYS.sfxEnabled, String(config.sfxEnabled));
  }
  if (config.sfxVolume !== undefined) {
    localStorage.setItem(SOUND_STORAGE_KEYS.sfxVolume, String(config.sfxVolume));
  }
  if (config.ambientEnabled !== undefined) {
    localStorage.setItem(SOUND_STORAGE_KEYS.ambientEnabled, String(config.ambientEnabled));
  }
  if (config.ambientType !== undefined) {
    localStorage.setItem(SOUND_STORAGE_KEYS.ambientType, config.ambientType);
  }
  if (config.ambientVolume !== undefined) {
    localStorage.setItem(SOUND_STORAGE_KEYS.ambientVolume, String(config.ambientVolume));
  }

  window.dispatchEvent(new CustomEvent("campfire-sound-config-changed"));
}

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
 * Loads and decodes an SFX audio file into an in-memory AudioBuffer on mobile.
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
 * Preloads all SFX audio buffers into memory for zero-latency instant playback on mobile.
 */
export function preloadSfx(): void {
  const sfxList: SfxType[] = ["pencil-tick", "sparkle"];
  for (const type of sfxList) {
    loadSfxBuffer(type).catch(() => {});
  }
}

// Auto-warm AudioContext and buffers on the first user interaction (touch/pointer/key)
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    preloadSfx();
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true, once: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true, once: true });
  window.addEventListener("keydown", unlockAudio, { passive: true, once: true });
}

/**
 * Plays a one-shot sound effect on mobile with sub-millisecond dispatch via Web Audio API.
 * Falls back to HTMLAudioElement if Web Audio API is unavailable.
 */
export function playSfx(type: SfxType) {
  try {
    const config = getSoundConfig();
    if (!config.sfxEnabled || config.sfxVolume <= 0) return;

    const normalizedVolume = Math.min(1, Math.max(0, config.sfxVolume / 100));
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
    // Fallback
  }
}

/**
 * Synchronizes looping ambient audio playback with configuration.
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
 * Pauses and resets current ambient audio on mobile.
 */
export function stopAmbientAudio() {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
    currentAmbientType = null;
  }
}
