import { useState, useEffect } from 'react';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    message: '',
    filesProcessed: 0,
    totalFiles: 0
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncResultDates, setSyncResultDates] = useState<string[] | null>(null);

  const checkAuthStatus = () => {
    const auth = getStoredAuthState();
    const valid = !!auth.accessToken && Date.now() < auth.expiresAt;
    setIsLoggedIn(valid);
  };

  // Initial load sync
  useEffect(() => {
    checkAuthStatus();
    const auth = getStoredAuthState();
    const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
    if (autoSync && auth.accessToken && Date.now() < auth.expiresAt) {
      handleSync();
    }
  }, []);

  const handleSync = async () => {
    const auth = getStoredAuthState();
    if (!auth.accessToken || Date.now() > auth.expiresAt) {
      // Need login/auth first
      const clientId = auth.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (clientId) {
        setSyncProgress({ status: 'authenticating', message: 'Authenticating with Google...', filesProcessed: 0, totalFiles: 0 });
        try {
          await requestDriveAuth(clientId);
          setIsLoggedIn(true);
        } catch (err: any) {
          setSyncProgress({ status: 'error', message: err.message || 'Authentication failed', filesProcessed: 0, totalFiles: 0 });
          return;
        }
      } else {
        if (onOpenSettings) onOpenSettings();
        setSyncProgress({ status: 'error', message: 'Google OAuth Client ID is not configured.', filesProcessed: 0, totalFiles: 0 });
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
        setToastMessage("Sync completed! Up to date.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      if (err.message === 'TOKEN_EXPIRED' || err.message === 'NOT_AUTHENTICATED') {
        setIsLoggedIn(false);
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
