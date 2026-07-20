import { useState, useEffect } from 'react';
import { listLocalEntries, getLocalEntry, saveLocalEntry, type LocalJournalEntry } from './services/db';
import { getStoredAuthState, requestDriveAuth } from './services/googleDrive';
import { runSync, type SyncProgress } from './services/sync';
import { getLocalYYYYMMDD } from './lib/dateUtils';
import { Header } from './components/Header';
import { JournalList } from './components/JournalList';
import { JournalEditor } from './components/JournalEditor';
import { SettingsModal } from './components/SettingsModal';
import { SyncResultModal } from './components/SyncResultModal';

import { useRef } from 'react';

function App() {
  const [entries, setEntries] = useState<LocalJournalEntry[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorReloadKey, setEditorReloadKey] = useState(0);
  
  // Settings & Theme
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('past_you_theme') as 'light' | 'dark') || 'dark';
  });

  // Auth & Sync
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    message: '',
    filesProcessed: 0,
    totalFiles: 0
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncResultDates, setSyncResultDates] = useState<string[] | null>(null);

  const editorContentRef = useRef(editorContent);
  useEffect(() => {
    editorContentRef.current = editorContent;
  }, [editorContent]);

  const activeDateRef = useRef(activeDate);
  useEffect(() => {
    activeDateRef.current = activeDate;
  }, [activeDate]);

  const isLoggedInRef = useRef(isLoggedIn);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    const handlePopState = async (e: PopStateEvent) => {
      const dateInState = e.state?.activeDate || null;
      if (dateInState !== activeDateRef.current) {
        if (activeDateRef.current) {
          await saveLocalEntry(activeDateRef.current, editorContentRef.current);
        }
        setActiveDate(dateInState);
        await loadEntries();
        const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
        if (autoSync && isLoggedInRef.current) {
          handleSync();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Apply Theme on load
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('past_you_theme', theme);
  }, [theme]);

  // Load entries and auth state on startup
  useEffect(() => {
    loadEntries();
    checkAuthStatus();
    
    // Auto-trigger sync on load if logged in and auto-sync is enabled
    const auth = getStoredAuthState();
    const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
    if (autoSync && auth.accessToken && Date.now() < auth.expiresAt) {
      handleSync();
    }
  }, []);

  const loadEntries = async () => {
    const all = await listLocalEntries();
    setEntries(all);
  };

  const checkAuthStatus = () => {
    const auth = getStoredAuthState();
    const valid = !!auth.accessToken && Date.now() < auth.expiresAt;
    setIsLoggedIn(valid);
  };

  const handleSync = async () => {
    const auth = getStoredAuthState();
    if (!auth.accessToken || Date.now() > auth.expiresAt) {
      // Need login/auth first
      if (auth.clientId) {
        setSyncProgress({ status: 'authenticating', message: 'Authenticating with Google...', filesProcessed: 0, totalFiles: 0 });
        try {
          await requestDriveAuth(auth.clientId);
          setIsLoggedIn(true);
        } catch (err: any) {
          setSyncProgress({ status: 'error', message: err.message || 'Authentication failed', filesProcessed: 0, totalFiles: 0 });
          return;
        }
      } else {
        setIsSettingsOpen(true);
        setSyncProgress({ status: 'error', message: 'Set up your Client ID first.', filesProcessed: 0, totalFiles: 0 });
        return;
      }
    }

    try {
      const { modifiedDates, conflictedDates } = await runSync((progress) => {
        setSyncProgress(progress);
      });
      await loadEntries();

      // Reload current active editor content if it was updated during sync
      if (activeDate) {
        const entry = await getLocalEntry(activeDate);
        if (entry) {
          setEditorContent(entry.content);
          setEditorReloadKey(prev => prev + 1);
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

  const handleSelectEntry = async (date: string) => {
    if (syncProgress.status === 'connecting' || syncProgress.status === 'syncing') {
      setToastMessage("Syncing in progress. Please wait...");
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }
    // Mark loading and clear editor state synchronously so the editor doesn't
    // mount with the previous entry's content while we fetch the new one.
    setEditorLoading(true);
    setEditorContent('');
    setActiveDate(date);

    if (window.history.state?.activeDate !== date) {
      window.history.pushState({ activeDate: date }, '');
    }

    const entry = await getLocalEntry(date);
    setEditorContent(entry?.content || '');
    setEditorLoading(false);
  };

  const handleSwitchEntryDate = async (newDate: string) => {
    setActiveDate(newDate);
    window.history.replaceState({ activeDate: newDate }, '');
    const entry = await getLocalEntry(newDate);
    setEditorContent(entry?.content || '');
  };

  const handleCreateToday = () => {
    const today = getLocalYYYYMMDD();
    handleSelectEntry(today);
  };

  const handleEditorSave = async (content: string) => {
    if (!activeDate) return;
    setEditorContent(content);
  };

  // Debounced DB writer
  useEffect(() => {
    if (!activeDate) return;
    
    const t = setTimeout(async () => {
      await saveLocalEntry(activeDate, editorContent);
      loadEntries();
    }, 400); // 400ms debounce
    
    return () => clearTimeout(t);
  }, [editorContent, activeDate]);

  return (
    <div className="flex flex-col h-full bg-bg-app transition-colors duration-200 relative">
      <Header 
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onSync={handleSync}
        syncProgress={syncProgress}
        isLoggedIn={isLoggedIn}
      />

      {activeDate && !editorLoading ? (
        <JournalEditor
          key={`${activeDate}_${editorReloadKey}`}
          date={activeDate}
          initialContent={editorContent}
          onSave={handleEditorSave}
          onBack={async () => {
            if (activeDate) {
              await saveLocalEntry(activeDate, editorContent);
            }
            if (window.history.state?.activeDate) {
              window.history.back();
            } else {
              setActiveDate(null);
              loadEntries();
              const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
              if (autoSync && isLoggedIn) {
                handleSync();
              }
            }
          }}
          onDateChange={async (newDate) => {
            if (!newDate) {
              if (activeDate) {
                await saveLocalEntry(activeDate, editorContent);
              }
              if (window.history.state?.activeDate) {
                window.history.back();
              } else {
                setActiveDate(null);
                loadEntries();
                const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
                if (autoSync && isLoggedIn) {
                  handleSync();
                }
              }
            } else {
              if (activeDate) {
                await saveLocalEntry(activeDate, editorContent);
              }
              await handleSwitchEntryDate(newDate);
            }
          }}
          onResolveConflict={async (choice) => {
            if (!activeDate) return;
            const { resolveLocalConflict } = await import('./services/db');
            const resolved = await resolveLocalConflict(activeDate, choice);
            if (resolved !== null) {
              setEditorContent(resolved);
              setEditorReloadKey(prev => prev + 1);
              await loadEntries();
              const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
              if (autoSync && isLoggedIn) {
                handleSync();
              }
            }
          }}
        />
      ) : (
        <JournalList 
          entries={entries}
          onSelectEntry={handleSelectEntry}
          onCreateToday={handleCreateToday}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => {
            setIsSettingsOpen(false);
            checkAuthStatus();
          }}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          theme={theme}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-accent-brand text-bg-app px-4 py-2 rounded-xl shadow-lg text-xs font-bold transition-all duration-300 border border-accent-brand/10 select-none pointer-events-none">
          {toastMessage}
        </div>
      )}

      {syncResultDates !== null && (
        <SyncResultModal 
          updatedDates={syncResultDates} 
          onClose={() => setSyncResultDates(null)} 
        />
      )}
    </div>
  );
}

export default App;
