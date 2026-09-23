import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getStoredAuthState,
  refreshAccessToken,
  handleAuthCallback,
} from '../services/googleDrive';
import { runSync, type SyncProgress } from '../services/sync';
import { getLocalEntry } from '../services/db';

interface UseGoogleSyncOptions {
  activeDate: string | null;
  loadEntries: () => Promise<void> | void;
  clearCache: () => void;
  forceReloadEditor: (date: string, content: string) => void;
  onOpenSettings?: () => void;
}

export function useGoogleSync({
  activeDate,
  loadEntries,
  clearCache,
  forceReloadEditor,
  onOpenSettings
}: UseGoogleSyncOptions) {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    message: '',
    filesProcessed: 0,
    totalFiles: 0
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncResultDates, setSyncResultDates] = useState<string[] | null>(null);
  const [pendingScratchpadConflict, setPendingScratchpadConflict] = useState<{ local: string; remote: string } | null>(null);
  const [syncRefreshKey, setSyncRefreshKey] = useState<number>(0);

  const checkAuthStatus = async () => {
    // Check if coming back from Google OAuth redirect (?code=...)
    try {
      const handled = await handleAuthCallback();
      if (handled) {
        setIsLoggedIn(true);
        return;
      }
    } catch (err: any) {
      console.error('Failed to complete OAuth callback:', err);
    }

    const auth = getStoredAuthState();
    if (!auth.accessToken && !auth.sessionId) {
      setIsLoggedIn(false);
      return;
    }

    // If near expiry or missing token, attempt Worker token refresh
    if (!auth.accessToken || Date.now() >= auth.expiresAt - 10 * 60 * 1000) {
      if (auth.sessionId) {
        try {
          await refreshAccessToken();
          setIsLoggedIn(true);
          return;
        } catch {
          setIsLoggedIn(false);
          return;
        }
      } else if (Date.now() >= auth.expiresAt) {
        setIsLoggedIn(false);
        return;
      }
    }

    setIsLoggedIn(true);
  };

  const isSyncingRef = useRef(false);
  const syncPendingRef = useRef<'none' | 'manual' | 'auto'>('none');

  // Initial load sync
  useEffect(() => {
    checkAuthStatus().then(() => {
      const auth = getStoredAuthState();
      const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
      if (autoSync && (auth.accessToken || auth.sessionId)) {
        handleSync(false, true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async (isManual: boolean = false, isStartupSync: boolean = false) => {
    if (isSyncingRef.current) {
      syncPendingRef.current = isManual || syncPendingRef.current === 'manual' ? 'manual' : 'auto';
      return;
    }
    isSyncingRef.current = true;

    try {
      const auth = getStoredAuthState();
      const needsRefresh = !auth.accessToken || Date.now() >= auth.expiresAt - 10 * 60 * 1000;
      
      if (needsRefresh) {
        if (auth.sessionId) {
          setSyncProgress({ status: 'authenticating', message: t("sync.authenticating"), filesProcessed: 0, totalFiles: 0 });
          try {
            await refreshAccessToken();
            setIsLoggedIn(true);
          } catch (refreshErr: any) {
            setIsLoggedIn(false);
            setSyncProgress({ status: 'error', message: refreshErr.message || t("sync.authFailed"), filesProcessed: 0, totalFiles: 0 });
            return;
          }
        } else {
          setIsLoggedIn(false);
          if (onOpenSettings) onOpenSettings();
          setSyncProgress({ status: 'error', message: t("sync.authFailed"), filesProcessed: 0, totalFiles: 0 });
          return;
        }
      }

      const { modifiedDates, conflictedDates, scratchpadConflict } = await runSync((progress) => {
        setSyncProgress(progress);
      });
      await loadEntries();

      // Clear cache on sync to prevent stale cached entries
      clearCache();

      // Bump refresh key so scratchpad and views reload
      setSyncRefreshKey((prev) => prev + 1);

      // Reload current active editor content if it was updated during sync
      if (activeDate) {
        const entry = await getLocalEntry(activeDate);
        if (entry) {
          forceReloadEditor(activeDate, entry.content);
        }
      }

      if (scratchpadConflict) {
        setPendingScratchpadConflict(scratchpadConflict);
      }

      // Filter out scratchpad from conflictedDates if scratchpadConflict modal is handling it
      const activeConflictedDates = conflictedDates
        ? conflictedDates.filter((d) => !(d === 'scratchpad' && scratchpadConflict))
        : [];

      const hasDownloads = modifiedDates && modifiedDates.length > 0;
      const shouldShowModal = hasDownloads && (isStartupSync || isManual);

      if (activeConflictedDates.length > 0) {
        setSyncResultDates(activeConflictedDates);
      } else if (shouldShowModal) {
        setSyncResultDates(modifiedDates);
      } else if (isManual && !hasDownloads) {
        setToastMessage(t("sync.completedToast"));
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      if (err.message === 'TOKEN_EXPIRED' || err.message === 'NOT_AUTHENTICATED') {
        setIsLoggedIn(false);
      } else {
        const errorMsg = err.message === 'NETWORK_TIMEOUT'
          ? t("sync.timeoutError", "Network request timed out. Please check your connection.")
          : (err.message || t("sync.errorGeneric", "Sync failed. Please check your connection."));
        setSyncProgress({
          status: 'error',
          message: errorMsg,
          filesProcessed: 0,
          totalFiles: 0
        });
        if (isManual) {
          setToastMessage(errorMsg);
          setTimeout(() => setToastMessage(null), 4000);
        }
      }
    } finally {
      isSyncingRef.current = false;
      const pending = syncPendingRef.current;
      if (pending !== 'none') {
        syncPendingRef.current = 'none';
        setTimeout(() => {
          handleSyncRef.current(pending === 'manual', false);
        }, 500);
      }
    }
  };

  const handleSyncRef = useRef(handleSync);
  handleSyncRef.current = handleSync;

  const debouncedSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDebouncedSync = useCallback((delayMs: number = 1000) => {
    if (debouncedSyncTimerRef.current) clearTimeout(debouncedSyncTimerRef.current);
    debouncedSyncTimerRef.current = setTimeout(() => {
      const auth = getStoredAuthState();
      const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
      if (autoSync && (auth.accessToken || auth.sessionId)) {
        handleSyncRef.current(false, false);
      }
    }, delayMs);
  }, []);

  return {
    isLoggedIn,
    setIsLoggedIn,
    syncProgress,
    setSyncProgress,
    toastMessage,
    setToastMessage,
    syncResultDates,
    setSyncResultDates,
    pendingScratchpadConflict,
    setPendingScratchpadConflict,
    syncRefreshKey,
    triggerSyncRefresh: () => setSyncRefreshKey((prev) => prev + 1),
    triggerDebouncedSync,
    checkAuthStatus,
    handleSync
  };
}
