import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { syncAmbientAudio } from "../services/audioService";

export function useAmbientAudio() {
  const enabled = useAppStore((state) => state.config.sound_ambient_enabled);
  const type = useAppStore((state) => state.config.sound_ambient_type ?? "campfire");
  const volume = useAppStore((state) => state.config.sound_ambient_volume ?? 50);

  useEffect(() => {
    syncAmbientAudio(enabled, type, volume);
  }, [enabled, type, volume]);
}
