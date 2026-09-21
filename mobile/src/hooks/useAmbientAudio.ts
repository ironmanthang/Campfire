import { useEffect } from "react";
import { useSoundSettings } from "./useSoundSettings";
import { syncAmbientAudio } from "../services/audioService";

export function useAmbientAudio() {
  const { config } = useSoundSettings();

  useEffect(() => {
    syncAmbientAudio(config.ambientEnabled, config.ambientType, config.ambientVolume);
  }, [config.ambientEnabled, config.ambientType, config.ambientVolume]);
}
