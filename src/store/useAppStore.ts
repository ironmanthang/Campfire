import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { setTheme } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AppConfig, ViewType } from "../types";
import { getLocalYYYYMMDD } from "../lib/dateUtils";

export interface NotificationMessage {
  text: string;
  type: "success" | "error";
}

interface AppState {
  // Config
  config: AppConfig;
  loadingConfig: boolean;
  loadConfig: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  updateConfigField: <K extends keyof AppConfig>(field: K, value: AppConfig[K]) => Promise<void>;
  selectDirectory: () => Promise<void>;

  // Sync
  isDriveConnected: boolean;
  syncProgress: {
    status: 'idle' | 'authenticating' | 'connecting' | 'syncing' | 'completed' | 'error';
    message: string;
    filesProcessed: number;
    totalFiles: number;
  };
  syncPending: 'none' | 'auto' | 'manual';
  checkDriveStatus: () => Promise<void>;
  handleSync: (isManual?: boolean, isStartupSync?: boolean) => Promise<void>;
  startDriveAuth: (clientId: string, clientSecret: string) => Promise<void>;
  disconnectDrive: () => Promise<void>;
  listJournalBackups: (dirPath: string) => Promise<number[]>;
  restoreJournalBackup: (dirPath: string, timestamp: number) => Promise<void>;
  syncResultDates: string[] | null;
  setSyncResultDates: (dates: string[] | null) => void;
  lastConflictedDates: string[];

  // Navigation
  view: ViewType;
  history: ViewType[];
  historyIndex: number;
  navigateToView: (nextView: ViewType) => void;
  forceViewAndResetHistory: (nextView: ViewType) => void;
  goBack: () => void;
  goForward: () => void;

  // Notifications
  statusMessage: NotificationMessage | null;
  showNotification: (text: string, type: "success" | "error") => void;
  clearNotification: () => void;
  notificationTimeout: any;

  // Global UI state
  journalRefreshKey: number;
  triggerJournalRefresh: () => void;
  currentDate: string;
  setCurrentDate: (date: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Export
  handleExport: (format: "json" | "text", dates?: string[]) => Promise<void>;
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

export const useAppStore = create<AppState>((set, get) => ({
  // Config
  config: {
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
  },
  loadingConfig: true,
  journalRefreshKey: 0,
  triggerJournalRefresh: () => set((state) => ({ journalRefreshKey: state.journalRefreshKey + 1 })),

  // Sync
  isDriveConnected: false,
  syncProgress: {
    status: 'idle',
    message: '',
    filesProcessed: 0,
    totalFiles: 0
  },
  syncPending: 'none',
  syncResultDates: null,
  setSyncResultDates: (dates) => set({ syncResultDates: dates }),
  lastConflictedDates: [],

  checkDriveStatus: async () => {
    try {
      const connected = await invoke<boolean>("check_gdrive_connected");
      set({ isDriveConnected: connected });
    } catch (err) {
      console.error(err);
    }
  },

  handleSync: async (isManual = false, isStartupSync = false) => {
    const { config, isDriveConnected, syncProgress } = get();
    if (import.meta.env.DEV) {
      console.log('[handleSync] Invoked', { isManual, isStartupSync, status: syncProgress.status, pending: get().syncPending });
    }
    if (syncProgress.status === 'syncing' || syncProgress.status === 'connecting') {
      const currentPending = get().syncPending;
      set({ syncPending: isManual || currentPending === 'manual' ? 'manual' : 'auto' });
      return;
    }
    if (!config.journal_dir) {
      get().showNotification("Set your Journal Storage Folder in settings first.", "error");
      return;
    }
    if (!isDriveConnected) {
      get().showNotification("Connect your Google Drive account in settings first.", "error");
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      set({
        syncProgress: { status: 'error', message: 'No internet connection.', filesProcessed: 0, totalFiles: 0 }
      });
      if (isManual) {
        get().showNotification("Sync failed: No internet connection.", "error");
      }
      return;
    }

    set({
      syncProgress: { status: 'connecting', message: 'Connecting to Google Drive...', filesProcessed: 0, totalFiles: 0 }
    });


    try {
      // 1. Create a local backup before syncing
      await invoke("create_journal_backup", { dirPath: config.journal_dir });

      // 2. Run Google Drive Sync
      const { runSync } = await import("../services/sync/sync");
      const { modifiedDates, conflictedDates } = await runSync(config.journal_dir, (progress) => {
        set({ syncProgress: progress });
      });

      // modifiedDates = cloud→local downloads only.
      // Show the SyncResultModal only when the user can act on it:
      //   - startup sync: they need to know what changed before they start writing
      //   - manual sync:  they explicitly asked for a report
      // Auto-sync after save is silent — never show a popup.
      const hasDownloads = modifiedDates && modifiedDates.length > 0;
      const shouldShowModal = hasDownloads && (isStartupSync || isManual);

      if (conflictedDates && conflictedDates.length > 0) {
        // Only notify if the conflicted set has changed (new conflicts appeared or
        // different dates). This prevents spamming the error on every auto-sync
        // cycle while the user is actively editing the conflict markers.
        const prev = get().lastConflictedDates;
        const prevKey = [...prev].sort().join(',');
        const nextKey = [...conflictedDates].sort().join(',');
        if (prevKey !== nextKey) {
          get().showNotification(
            `Sync done. ${conflictedDates.length} entr${conflictedDates.length === 1 ? 'y' : 'ies'} need conflict resolution: ${conflictedDates.join(', ')}`,
            "error"
          );
        }
        set({ lastConflictedDates: conflictedDates });
      } else {
        // All conflicts resolved — clear the tracked set
        if (get().lastConflictedDates.length > 0) {
          set({ lastConflictedDates: [] });
        }
        if (isManual && get().syncPending === 'none' && !hasDownloads) {
          get().showNotification("Sync completed! Everything is up to date.", "success");
        }
      }

      if (shouldShowModal) {
        // Defer journal refresh to after the user closes the modal (App.tsx onClose)
        set({ syncResultDates: modifiedDates });
      } else if (hasDownloads) {
        // Downloads happened silently (auto-sync on active device that received
        // remote changes). Refresh so the editor shows the new content.
        get().triggerJournalRefresh();
      }
      // Pure upload (nothing downloaded): local content is unchanged — do NOT
      // call triggerJournalRefresh(). Doing so would cause loadEntry to re-run,
      // which clears entryContent to "" and shows "Reading flat file..." flicker.
    } catch (err: any) {
      console.error("Sync error:", err);
      const errMsg = typeof err === 'string' ? err : (err.message || 'Sync failed');
      set({
        syncProgress: { status: 'error', message: errMsg, filesProcessed: 0, totalFiles: 0 }
      });
      if (isManual) {
        get().showNotification(errMsg, "error");
      }
    } finally {
      const pendingType = get().syncPending;
      if (pendingType !== 'none') {
        set({ syncPending: 'none' });
        setTimeout(() => {
          get().handleSync(pendingType === 'manual').catch(console.error);
        }, 500);
      }
    }
  },

  startDriveAuth: async (clientId: string, clientSecret: string) => {
    if (!clientId.trim()) {
      get().showNotification("Please enter a Client ID", "error");
      return;
    }
    if (!clientSecret.trim()) {
      get().showNotification("Please enter a Client Secret", "error");
      return;
    }
    set({
      syncProgress: { status: 'authenticating', message: 'Please complete login in your browser...', filesProcessed: 0, totalFiles: 0 }
    });
    try {
      await invoke("start_gdrive_auth", { clientId, clientSecret });
      set({ isDriveConnected: true });
      set({ syncProgress: { status: 'completed', message: 'Connected successfully!', filesProcessed: 0, totalFiles: 0 } });
      get().showNotification("Google Drive connected successfully!", "success");
      // Update config fields in background so it stores credentials
      await get().updateConfigField("google_drive_client_id", clientId);
      await get().updateConfigField("google_drive_client_secret", clientSecret);
      // Trigger sync
      if (get().config.google_drive_auto_sync) {
        get().handleSync().catch(console.error);
      }
    } catch (err: any) {
      console.error(err);
      set({
        syncProgress: { status: 'error', message: err || 'Authentication failed', filesProcessed: 0, totalFiles: 0 }
      });
      get().showNotification(err || "Authentication failed.", "error");
    }
  },

  disconnectDrive: async () => {
    try {
      await invoke("disconnect_gdrive");
      set({ isDriveConnected: false });
      set({ syncProgress: { status: 'idle', message: 'Disconnected', filesProcessed: 0, totalFiles: 0 } });
      get().showNotification("Google Drive account disconnected.", "success");
    } catch (err: any) {
      console.error(err);
      get().showNotification("Failed to disconnect Google Drive.", "error");
    }
  },

  listJournalBackups: async (dirPath: string) => {
    try {
      return await invoke<number[]>("list_journal_backups", { dirPath });
    } catch (err) {
      console.error("Error listing backups:", err);
      return [];
    }
  },

  restoreJournalBackup: async (dirPath: string, timestamp: number) => {
    try {
      await invoke("restore_journal_backup", { dirPath, timestamp });
      get().triggerJournalRefresh();
      get().showNotification("Journal backup restored successfully!", "success");
    } catch (err: any) {
      console.error("Error restoring backup:", err);
      const errMsg = typeof err === 'string' ? err : (err.message || "Failed to restore backup");
      get().showNotification(errMsg, "error");
      throw err;
    }
  },

  loadConfig: async () => {
    try {
      const loaded: AppConfig = await invoke("load_config");
      set({ config: loaded });
      await applyTheme(loaded.theme);
      await get().checkDriveStatus();
      // Await startup sync so the UI doesn't show stale (ghost) content.
      // The loading spinner stays visible until sync completes.
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
        title: "Choose Journal Storage Directory"
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

  // Navigation
  view: "journal",
  history: ["journal"],
  historyIndex: 0,

  navigateToView: (nextView) => {
    const { view, historyIndex } = get();
    if (nextView === view) return;
    const nextHistory = get().history.slice(0, historyIndex + 1);
    nextHistory.push(nextView);
    set({
      view: nextView,
      history: nextHistory,
      historyIndex: nextHistory.length - 1
    });
  },

  forceViewAndResetHistory: (nextView) => {
    set({
      view: nextView,
      history: [nextView],
      historyIndex: 0
    });
  },

  goBack: () => {
    const { historyIndex, history } = get();
    const prevIndex = historyIndex - 1;
    if (prevIndex >= 0) {
      set({
        historyIndex: prevIndex,
        view: history[prevIndex]
      });
    }
  },

  goForward: () => {
    const { historyIndex, history } = get();
    const nextIndex = historyIndex + 1;
    if (nextIndex < history.length) {
      set({
        historyIndex: nextIndex,
        view: history[nextIndex]
      });
    }
  },

  // Notifications
  statusMessage: null,
  notificationTimeout: null,

  showNotification: (text, type) => {
    const { notificationTimeout } = get();
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
    set({ statusMessage: { text, type } });
    // Both success and error notifications auto-dismiss. Error gets a longer
    // window (10s) so the user has time to read it, but it never sticks forever.
    const duration = type === "success" ? 4000 : 10000;
    const timeout = setTimeout(() => {
      set({ statusMessage: null, notificationTimeout: null });
    }, duration);
    set({ notificationTimeout: timeout });
  },

  clearNotification: () => {
    const { notificationTimeout } = get();
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
    set({ statusMessage: null, notificationTimeout: null });
  },

  // Global UI State
  currentDate: getLocalYYYYMMDD(),
  setCurrentDate: (date) => set({ currentDate: date }),
  sidebarCollapsed: localStorage.getItem("sidebar-collapsed") === "true",
  toggleSidebar: () => {
    const collapsed = !get().sidebarCollapsed;
    localStorage.setItem("sidebar-collapsed", String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },

  // Export
  handleExport: async (format, dates) => {
    const { config, showNotification } = get();
    if (!config.journal_dir) return;
    try {
      const extension = format === "json" ? "json" : "txt";
      const filterName = format === "json" ? "JSON Array" : "Plain Text Document";

      const savePath = await save({
        filters: [{
          name: filterName,
          extensions: [extension]
        }],
        defaultPath: `journal_export_${getLocalYYYYMMDD()}.${extension}`
      });

      if (savePath) {
        await invoke("export_journal", {
          dirPath: config.journal_dir,
          exportType: format,
          savePath,
          dates: dates || null
        });
        showNotification("Journal entries exported successfully!", "success");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to export entries", "error");
    }
  }
}));
