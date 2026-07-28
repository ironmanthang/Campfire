import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredAuthState, requestDriveAuth } from '../services/googleDrive';
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
    const auth = getStoredAuthState();
    if (!auth.accessToken) {
      setIsLoggedIn(false);
      return;
    }
    // If past 50 minutes (10 minutes remaining before 60m expiry), attempt silent refresh
    if (Date.now() >= auth.expiresAt - 10 * 60 * 1000 && auth.clientId) {
      try {
        await requestDriveAuth(auth.clientId, true);
        setIsLoggedIn(true);
        return;
      } catch {
        if (Date.now() >= auth.expiresAt) {
          setIsLoggedIn(false);
          return;
        }
      }
    }
    setIsLoggedIn(Date.now() < auth.expiresAt);
  };

  // Initial load sync
  useEffect(() => {
    checkAuthStatus().then(() => {
      const auth = getStoredAuthState();
      const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
      if (autoSync && auth.accessToken && Date.now() < auth.expiresAt) {
        handleSync();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    const auth = getStoredAuthState();
    const needsRefresh = !auth.accessToken || Date.now() >= auth.expiresAt - 10 * 60 * 1000;
    
    if (needsRefresh) {
      const clientId = auth.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (clientId) {
        setSyncProgress({ status: 'authenticating', message: t("sync.authenticating"), filesProcessed: 0, totalFiles: 0 });
        try {
          // Attempt silent refresh first if we already have a token
          const isSilent = !!auth.accessToken;
          await requestDriveAuth(clientId, isSilent);
          setIsLoggedIn(true);
        } catch {
          // If silent failed, fallback to interactive login
          try {
            await requestDriveAuth(clientId, false);
            setIsLoggedIn(true);
          } catch (loginErr: any) {
            setSyncProgress({ status: 'error', message: loginErr.message || t("sync.authFailed"), filesProcessed: 0, totalFiles: 0 });
            return;
          }
        }
      } else {
        if (onOpenSettings) onOpenSettings();
        setSyncProgress({ status: 'error', message: t("sync.clientIdMissing"), filesProcessed: 0, totalFiles: 0 });
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
