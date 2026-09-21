import { useAppStore } from "../store/useAppStore";

export type SfxType = "pencil-tick" | "sparkle";
export type AmbientType = "campfire" | "rain" | "night-forest";

let ambientAudio: HTMLAudioElement | null = null;
let currentAmbientType: AmbientType | null = null;

/**
 * Plays a one-shot sound effect if SFX is enabled in configuration.
 */
export function playSfx(type: SfxType) {
  try {
    const config = useAppStore.getState().config;
    if (!config.sound_sfx_enabled || (config.sound_sfx_volume ?? 70) <= 0) return;

    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.volume = Math.min(1, Math.max(0, (config.sound_sfx_volume ?? 70) / 100));
    audio.play().catch(() => {
      // Autoplay or audio context permission error handled silently
    });
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
