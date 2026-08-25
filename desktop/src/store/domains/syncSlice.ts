import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { AppState } from "../useAppStore";

export interface SyncSlice {
  isDriveConnected: boolean;
  syncProgress: {
    status: "idle" | "authenticating" | "connecting" | "syncing" | "completed" | "error";
    message: string;
    filesProcessed: number;
    totalFiles: number;
  };
  syncPending: "none" | "auto" | "manual";
  syncResultDates: string[] | null;
  lastConflictedDates: string[];
  pendingScratchpadConflict: { local: string; remote: string } | null;
  initialSyncInProgress: boolean;

  checkDriveStatus: () => Promise<void>;
  handleSync: (isManual?: boolean, isStartupSync?: boolean) => Promise<void>;
  triggerDebouncedSync: (delayMs?: number) => void;
  resolveScratchpadConflict: (choice: "local" | "remote" | "both") => Promise<void>;
  startDriveAuth: (clientId: string) => Promise<void>;
  disconnectDrive: () => Promise<void>;
  listJournalBackups: (dirPath: string) => Promise<number[]>;
  restoreJournalBackup: (dirPath: string, timestamp: number) => Promise<void>;
  setSyncResultDates: (dates: string[] | null) => void;
}

let debouncedSyncTimer: ReturnType<typeof setTimeout> | null = null;

export const createSyncSlice: StateCreator<
  AppState,
  [],
  [],
  SyncSlice
> = (set, get) => ({
  isDriveConnected: false,
  syncProgress: { status: "idle", message: "", filesProcessed: 0, totalFiles: 0 },
  syncPending: "none",
  syncResultDates: null,
  lastConflictedDates: [],
  pendingScratchpadConflict: null,
  initialSyncInProgress: false,

  setSyncResultDates: (dates) => set({ syncResultDates: dates }),

  triggerDebouncedSync: (delayMs = 1000) => {
    if (debouncedSyncTimer) clearTimeout(debouncedSyncTimer);
    debouncedSyncTimer = setTimeout(() => {
      const { config, isDriveConnected } = get();
      if (config.google_drive_auto_sync && config.google_drive_client_id && isDriveConnected) {
        get().handleSync().catch(console.error);
      }
    }, delayMs);
  },

  checkDriveStatus: async () => {
    try {
      const connected = await invoke<boolean>("check_gdrive_connected");
      set({ isDriveConnected: connected });
    } catch (err) {
      console.error(err);
    }
  },

  resolveScratchpadConflict: async (choice) => {
    const { config, pendingScratchpadConflict } = get();
    if (!config.journal_dir || !pendingScratchpadConflict) return;
    const { local, remote } = pendingScratchpadConflict;
    set({ pendingScratchpadConflict: null });

    try {
      const { fromDocument, toDocument, mergeScratchpadKeepBoth } = await import("@campfire/core");
      const { writeScratchpadDoc } = await import("../../services/scratchpad");

      if (choice === "remote") {
        const doc = toDocument(fromDocument(remote));
        await writeScratchpadDoc(config.journal_dir, doc);
      } else if (choice === "both") {
        const mergedJson = mergeScratchpadKeepBoth(local, remote);
        const doc = toDocument(fromDocument(mergedJson));
        await writeScratchpadDoc(config.journal_dir, doc);
      }

      // Record the remote content as the common sync base so the sync engine
      // knows remote was the resolution baseline. If choice was 'local' or 'both',
      // the engine will see local != base and base == remote, uploading local to cloud cleanly.
      await invoke("write_sync_base", {
        dirPath: config.journal_dir,
        date: "scratchpad",
        content: remote,
      });

      get().triggerJournalRefresh();
      if (config.google_drive_auto_sync && get().isDriveConnected) {
        get().handleSync().catch(console.error);
      }
    } catch (err) {
      console.error("Failed to resolve scratchpad conflict:", err);
    }
  },

  handleSync: async (isManual = false, isStartupSync = false) => {
    const { config, isDriveConnected, syncProgress } = get();
    if (import.meta.env.DEV) {
      console.log("[handleSync] Invoked", { isManual, isStartupSync, status: syncProgress.status, pending: get().syncPending });
    }
    if (syncProgress.status === "syncing" || syncProgress.status === "connecting") {
      const currentPending = get().syncPending;
      set({ syncPending: isManual || currentPending === "manual" ? "manual" : "auto" });
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      set({ syncProgress: { status: "error", message: "No internet connection.", filesProcessed: 0, totalFiles: 0 } });
      if (isManual) get().showNotification("Sync failed: No internet connection.", "error");
      return;
    }

    set({ syncProgress: { status: "connecting", message: "Connecting to Google Drive...", filesProcessed: 0, totalFiles: 0 } });
    if (isStartupSync) {
      set({ initialSyncInProgress: true });
    }

    try {
      await invoke("create_journal_backup", { dirPath: config.journal_dir });
      const { runSync } = await import("../../services/sync/sync");
      const { modifiedDates, conflictedDates, scratchpadConflict } = await runSync(config.journal_dir, (progress) => {
        set({ syncProgress: progress });
      });

      const hasDownloads = modifiedDates && modifiedDates.length > 0;
      const shouldShowModal = hasDownloads && (isStartupSync || isManual);

      if (scratchpadConflict) {
        set({ pendingScratchpadConflict: scratchpadConflict });
      }

      if (conflictedDates && conflictedDates.length > 0) {
        const prev = get().lastConflictedDates;
        const prevKey = [...prev].sort().join(",");
        const nextKey = [...conflictedDates].sort().join(",");
        if (prevKey !== nextKey) {
          get().showNotification(
            `Sync done. ${conflictedDates.length} entr${conflictedDates.length === 1 ? "y" : "ies"} need conflict resolution: ${conflictedDates.join(", ")}`,
            "error"
          );
        }
        set({ lastConflictedDates: conflictedDates });
        get().triggerJournalRefresh();
      } else {
        if (get().lastConflictedDates.length > 0) set({ lastConflictedDates: [] });
        if (isManual && get().syncPending === "none" && !hasDownloads) {
          get().showNotification("Sync completed! Everything is up to date.", "success");
        }
      }

      if (shouldShowModal) {
        set({ syncResultDates: modifiedDates });
      } else if (hasDownloads) {
        get().triggerJournalRefresh();
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      const errMsg = typeof err === "string" ? err : err.message || "Sync failed";
      set({ syncProgress: { status: "error", message: errMsg, filesProcessed: 0, totalFiles: 0 } });
      if (isManual) get().showNotification(errMsg, "error");
    } finally {
      if (isStartupSync) {
        set({ initialSyncInProgress: false });
      }
      const pendingType = get().syncPending;
      if (pendingType !== "none") {
        set({ syncPending: "none" });
        setTimeout(() => {
          get().handleSync(pendingType === "manual").catch(console.error);
        }, 500);
      }
    }
  },

  startDriveAuth: async (clientId) => {
    if (!clientId.trim()) { get().showNotification("Please enter a Client ID", "error"); return; }
    set({ syncProgress: { status: "authenticating", message: "Please complete login in your browser...", filesProcessed: 0, totalFiles: 0 } });
    try {
      await invoke("start_gdrive_auth", { clientId });
      set({ isDriveConnected: true });
      set({ syncProgress: { status: "completed", message: "Connected successfully!", filesProcessed: 0, totalFiles: 0 } });
      get().showNotification("Google Drive connected successfully!", "success");
      await get().updateConfigField("google_drive_client_id", clientId);
      if (get().config.google_drive_auto_sync) get().handleSync().catch(console.error);
    } catch (err: any) {
      console.error(err);
      set({ syncProgress: { status: "error", message: err || "Authentication failed", filesProcessed: 0, totalFiles: 0 } });
      get().showNotification(err || "Authentication failed.", "error");
    }
  },

  disconnectDrive: async () => {
    try {
      await invoke("disconnect_gdrive");
      set({ isDriveConnected: false });
      set({ syncProgress: { status: "idle", message: "Disconnected", filesProcessed: 0, totalFiles: 0 } });
      get().showNotification("Google Drive account disconnected.", "success");
    } catch (err: any) {
      console.error(err);
      get().showNotification("Failed to disconnect Google Drive.", "error");
    }
  },

  listJournalBackups: async (dirPath) => {
    try {
      return await invoke<number[]>("list_journal_backups", { dirPath });
    } catch (err) {
      console.error("Error listing backups:", err);
      return [];
    }
  },

  restoreJournalBackup: async (dirPath, timestamp) => {
    try {
      await invoke("restore_journal_backup", { dirPath, timestamp });
      get().triggerJournalRefresh();
      get().showNotification("Journal backup restored successfully!", "success");
    } catch (err: any) {
      console.error("Error restoring backup:", err);
      const errMsg = typeof err === "string" ? err : err.message || "Failed to restore backup";
      get().showNotification(errMsg, "error");
      throw err;
    }
  },
});
