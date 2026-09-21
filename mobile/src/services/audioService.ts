export type SfxType = "pencil-tick" | "sparkle";
export type AmbientType = "campfire" | "rain" | "night-forest";

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

/**
 * Plays a one-shot sound effect on mobile if SFX is enabled.
 */
export function playSfx(type: SfxType) {
  try {
    const config = getSoundConfig();
    if (!config.sfxEnabled || config.sfxVolume <= 0) return;

    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.volume = Math.min(1, Math.max(0, config.sfxVolume / 100));
    audio.play().catch(() => {
      // Autoplay policy fallback
    });
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
