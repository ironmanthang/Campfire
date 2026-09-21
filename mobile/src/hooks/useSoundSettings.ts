import { useState, useEffect, useCallback } from "react";
import {
  getSoundConfig,
  saveSoundConfig,
  type SoundConfig,
} from "../services/audioService";

export function useSoundSettings() {
  const [config, setConfig] = useState<SoundConfig>(getSoundConfig);

  useEffect(() => {
    const handleConfigChange = () => {
      setConfig(getSoundConfig());
    };

    window.addEventListener("campfire-sound-config-changed", handleConfigChange);
    return () => {
      window.removeEventListener("campfire-sound-config-changed", handleConfigChange);
    };
  }, []);

  const updateConfig = useCallback((updates: Partial<SoundConfig>) => {
    saveSoundConfig(updates);
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return { config, updateConfig };
}
