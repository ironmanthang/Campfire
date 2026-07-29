import { useState, useEffect } from 'react';
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

  // Initial load sync
  useEffect(() => {
    checkAuthStatus().then(() => {
      const auth = getStoredAuthState();
      const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
      if (autoSync && (auth.accessToken || auth.sessionId)) {
        handleSync();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
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


    try {
      const { modifiedDates, conflictedDates } = await runSync((progress) => {
        setSyncProgress(progress);
      });
      await loadEntries();

      // Clear cache on sync to prevent stale cached entries
      clearCache();

      // Reload current active editor content if it was updated during sync
      if (activeDate) {
        const entry = await getLocalEntry(activeDate);
        if (entry) {
          forceReloadEditor(activeDate, entry.content);
        }
      }

      if (conflictedDates && conflictedDates.length > 0) {
        setSyncResultDates(conflictedDates);
      } else if (modifiedDates && modifiedDates.length > 0) {
        setSyncResultDates(modifiedDates);
      } else {
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
        setToastMessage(errorMsg);
        setTimeout(() => setToastMessage(null), 4000);
      }
    }
  };

  return {
    isLoggedIn,
    setIsLoggedIn,
    syncProgress,
    setSyncProgress,
    toastMessage,
    setToastMessage,
    syncResultDates,
    setSyncResultDates,
    checkAuthStatus,
    handleSync
  };
}
