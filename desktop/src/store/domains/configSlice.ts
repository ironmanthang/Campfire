import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { setTheme } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AppConfig } from "../../types";
import { getLocalYYYYMMDD } from "../../lib/dateUtils";
import { AppState } from "../useAppStore";
import type { ImportReport } from "./uiSlice";

export interface ConfigSlice {
  // State
  config: AppConfig;
  loadingConfig: boolean;

  // Actions
  loadConfig: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  updateConfigField: <K extends keyof AppConfig>(field: K, value: AppConfig[K]) => Promise<void>;
  selectDirectory: () => Promise<void>;

  // Export (lives here since it only needs config + showNotification)
  handleExport: (format: "json" | "text", dates?: string[]) => Promise<void>;
  handleImport: () => Promise<void>;
}

async function applyTheme(theme: "dark" | "light") {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    try { await setTheme("dark"); } catch (e) {}
    try { await getCurrentWindow().setTheme("dark"); } catch (e) {}
  } else {
    document.documentElement.classList.remove("dark");
    try { await setTheme("light"); } catch (e) {}
    try { await getCurrentWindow().setTheme("light"); } catch (e) {}
  }
}

export const createConfigSlice: StateCreator<
  AppState,
  [],
  [],
  ConfigSlice
> = (set, get) => ({
  config: {
    version: 1,
    user_name: "",
    journal_dir: "",
    theme: "dark",
    autosave_interval: 1,
    config_section_order: ["heart", "identity", "ollama", "pwa", "web_search", "legacy"],
    language: "en",
    web_search_enabled: false,
    web_search_provider: "brave_free",
    web_search_api_key: "",
    web_search_google_cx: "",
    google_drive_client_id: "",
    google_drive_auto_sync: false,
    custom_logo: "",
    custom_title: "",
    custom_subtitle: "",
    system_instruction_mode: "default",
    custom_system_instruction: "",
    pwa_url: "https://app-campfire.pages.dev/",
    show_donate_heart: true,
    heart_click_falls: false,
    heart_fall_speed: 5,
    heart_size: 24,
    heart_position: null,
    heart_gate_dismissed: false,
  },
  loadingConfig: true,

  loadConfig: async () => {
    try {
      const loaded: AppConfig = await invoke("load_config");
      set({ config: loaded });
      await applyTheme(loaded.theme);
      await get().checkDriveStatus();
      if (loaded.google_drive_auto_sync && loaded.google_drive_client_id && get().isDriveConnected) {
        await get().handleSync(false, true);
      }
    } catch (err) {
      console.error("Error loading config:", err);
      get().showNotification("Failed to load configuration", "error");
    } finally {
      set({ loadingConfig: false });
    }
  },

  toggleTheme: async () => {
    const nextTheme: "light" | "dark" = get().config.theme === "dark" ? "light" : "dark";
    const nextConfig = { ...get().config, theme: nextTheme };
    set({ config: nextConfig });
    await applyTheme(nextTheme);
    try {
      await invoke("save_config", { config: nextConfig });
    } catch (err) {
      console.error(err);
    }
  },

  updateConfigField: async (field, value) => {
    const nextConfig = { ...get().config, [field]: value };
    set({ config: nextConfig });
    try {
      await invoke("save_config", { config: nextConfig });
    } catch (err) {
      console.error(err);
      get().showNotification("Failed to save setting", "error");
    }
  },

  selectDirectory: async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose Journal Storage Directory",
      });
      if (selected && typeof selected === "string") {
        await get().updateConfigField("journal_dir", selected);
        get().showNotification("Journal storage folder updated!", "success");
      }
    } catch (err) {
      console.error(err);
      get().showNotification("Failed to open folder selector", "error");
    }
  },

  handleExport: async (format, dates) => {
    const { config, showNotification } = get();
    if (!config.journal_dir) return;
    try {
      const extension = format === "json" ? "json" : "md";
      const filterName = format === "json" ? "JSON Array" : "Markdown Document";
      const savePath = await save({
        filters: [{ name: filterName, extensions: [extension] }],
        defaultPath: `journal_export_${getLocalYYYYMMDD()}.${extension}`,
      });
      if (savePath) {
        await invoke("export_journal", {
          dirPath: config.journal_dir,
          exportType: format,
          savePath,
          dates: dates || null,
        });
        showNotification("Journal entries exported successfully!", "success");
      }
    } catch (err) {
      console.error(err);
      get().showNotification("Failed to export entries", "error");
    }
  },

  handleImport: async () => {
    const { config, showNotification } = get();
    if (!config.journal_dir) return;

    try {
      const selected = await open({
        title: "Import Journal Data",
        multiple: false,
        filters: [{ name: "JSON or Markdown", extensions: ["json", "md"] }],
      });

      if (!selected || Array.isArray(selected)) return;

      const report = await invoke<ImportReport>("import_journal", {
        dirPath: config.journal_dir,
        filePath: selected,
      });

      get().setImportReport(report);
      get().triggerJournalRefresh();
      showNotification("Journal entries imported successfully!", "success");
    } catch (err) {
      console.error(err);
      get().showNotification("Failed to import entries", "error");
    }
  },
});
