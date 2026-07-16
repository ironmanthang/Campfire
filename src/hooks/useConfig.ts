import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { setTheme } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AppConfig } from "../types";

export function useConfig(showNotification: (text: string, type: "success" | "error") => void) {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [config, setConfig] = useState<AppConfig>({
    version: 1,
    user_name: "",
    journal_dir: "",
    theme: "dark",
    autosave_interval: 1,
    config_section_order: ["identity", "ollama", "web_search", "legacy"],
    language: "en",
    web_search_enabled: false,
    web_search_provider: "brave_free",
    web_search_api_key: "",
    web_search_google_cx: "",
    google_drive_client_id: "",
    google_drive_client_secret: "",
    google_drive_auto_sync: false,
    custom_logo: "",
    custom_title: "",
    custom_subtitle: "",
    system_instruction_mode: "default",
    custom_system_instruction: ""
  });

  useEffect(() => {
    async function loadAppConfig() {
      try {
        const loaded: AppConfig = await invoke("load_config");
        setConfig(loaded);

        if (loaded.theme === "dark") {
          document.documentElement.classList.add("dark");
          try { await setTheme("dark"); } catch (e) { }
          try { await getCurrentWindow().setTheme("dark"); } catch (e) { }
        } else {
          document.documentElement.classList.remove("dark");
          try { await setTheme("light"); } catch (e) { }
          try { await getCurrentWindow().setTheme("light"); } catch (e) { }
        }
      } catch (err) {
        console.error("Error loading config:", err);
        showNotification("Failed to load configuration", "error");
      } finally {
        setLoadingConfig(false);
      }
    }
    loadAppConfig();
  }, [showNotification]);

  const toggleTheme = useCallback(async () => {
    setConfig((prevConfig) => {
      const nextTheme: "light" | "dark" = prevConfig.theme === "dark" ? "light" : "dark";
      const nextConfig = { ...prevConfig, theme: nextTheme };

      (async () => {
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
          try { await setTheme("dark"); } catch (e) { }
          try { await getCurrentWindow().setTheme("dark"); } catch (e) { }
        } else {
          document.documentElement.classList.remove("dark");
          try { await setTheme("light"); } catch (e) { }
          try { await getCurrentWindow().setTheme("light"); } catch (e) { }
        }

        try {
          await invoke("save_config", { config: nextConfig });
        } catch (err) {
          console.error(err);
        }
      })();

      return nextConfig;
    });
  }, []);

  const updateConfigField = useCallback(async <K extends keyof AppConfig>(field: K, value: AppConfig[K]) => {
    setConfig((prevConfig) => {
      const nextConfig = { ...prevConfig, [field]: value };
      (async () => {
        try {
          await invoke("save_config", { config: nextConfig });
        } catch (err) {
          console.error(err);
          showNotification("Failed to save setting", "error");
        }
      })();
      return nextConfig;
    });
  }, [showNotification]);

  const selectDirectory = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose Journal Storage Directory"
      });
      if (selected && typeof selected === "string") {
        updateConfigField("journal_dir", selected);
        showNotification("Journal storage folder updated!", "success");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to open folder selector", "error");
    }
  }, [updateConfigField, showNotification]);

  return {
    config,
    loadingConfig,
    setConfig,
    toggleTheme,
    updateConfigField,
    selectDirectory
  };
}
