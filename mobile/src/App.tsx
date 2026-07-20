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
  const [editorLoadedDate, setEditorLoadedDate] = useState<string | null>(null);
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

  const editorLoadedDateRef = useRef(editorLoadedDate);
  useEffect(() => {
    editorLoadedDateRef.current = editorLoadedDate;
  }, [editorLoadedDate]);

  const isLoggedInRef = useRef(isLoggedIn);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const editorCacheRef = useRef<Record<string, string>>({});

  const getAdjacentDate = (dateStr: string, offset: number): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const prefetchAdjacentDates = (centerDate: string) => {
    const offsets = [-2, -1, 1, 2];
    offsets.forEach(offset => {
      const adj = getAdjacentDate(centerDate, offset);
      if (adj && editorCacheRef.current[adj] === undefined) {
        getLocalEntry(adj).then(entry => {
          editorCacheRef.current[adj] = entry?.content || '';
        }).catch(() => {});
      }
    });
  };

  const saveCurrentEntry = async () => {
    if (editorLoadedDateRef.current) {
      await saveLocalEntry(editorLoadedDateRef.current, editorContentRef.current);
      await loadEntries();
    }
  };

  useEffect(() => {
    const handlePopState = async (e: PopStateEvent) => {
      const dateInState = e.state?.activeDate || null;
      if (dateInState !== activeDateRef.current) {
        const savePromise = saveCurrentEntry();
        
        // Immediately reset state to loading/blank
        setEditorContent('');
        setEditorLoadedDate(null);
        activeDateRef.current = dateInState;
        setActiveDate(dateInState);
        
        await savePromise;
        await loadEntries();
        
        if (dateInState) {
          if (editorCacheRef.current[dateInState] !== undefined) {
            setEditorContent(editorCacheRef.current[dateInState]);
            setEditorLoadedDate(dateInState);
            setEditorLoading(false);
            prefetchAdjacentDates(dateInState);
          } else {
            setEditorLoading(true);
            const entry = await getLocalEntry(dateInState);
            if (activeDateRef.current === dateInState) {
              const content = entry?.content || '';
              editorCacheRef.current[dateInState] = content;
              setEditorContent(content);
              setEditorLoadedDate(dateInState);
              setEditorLoading(false);
              prefetchAdjacentDates(dateInState);
            }
          }
        } else {
          setEditorContent('');
          setEditorLoadedDate(null);
          setEditorLoading(false);
        }

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

      // Clear cache on sync to prevent stale cached entries
      editorCacheRef.current = {};

      // Reload current active editor content if it was updated during sync
      if (activeDate) {
        const entry = await getLocalEntry(activeDate);
        if (entry) {
          const content = entry.content;
          editorCacheRef.current[activeDate] = content;
          setEditorContent(content);
          setEditorLoadedDate(activeDate);
          setEditorReloadKey(prev => prev + 1);
          prefetchAdjacentDates(activeDate);
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

  const loadEntryForEditor = async (date: string) => {
    activeDateRef.current = date;
    setActiveDate(date);

    if (editorCacheRef.current[date] !== undefined) {
      setEditorContent(editorCacheRef.current[date]);
      setEditorLoadedDate(date);
      setEditorLoading(false);
      prefetchAdjacentDates(date);
    } else {
      setEditorContent('');
      setEditorLoadedDate(null);

      const entry = await getLocalEntry(date);
      if (activeDateRef.current === date) {
        const content = entry?.content || '';
        editorCacheRef.current[date] = content;
        setEditorContent(content);
        setEditorLoadedDate(date);
        setEditorLoading(false);
        prefetchAdjacentDates(date);
      }
    }
  };

  const handleSelectEntry = async (date: string) => {
    if (syncProgress.status === 'connecting' || syncProgress.status === 'syncing') {
      setToastMessage("Syncing in progress. Please wait...");
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }
    setEditorLoading(true);
    if (window.history.state?.activeDate !== date) {
      window.history.pushState({ activeDate: date }, '');
    }
    await loadEntryForEditor(date);
  };

  const handleSwitchEntryDate = async (newDate: string) => {
    const savePromise = saveCurrentEntry();
    
    // Immediately show loading/blank state for the new date
    setEditorContent('');
    setEditorLoadedDate(null);
    activeDateRef.current = newDate;
    setActiveDate(newDate);
    
    window.history.replaceState({ activeDate: newDate }, '');
    
    await savePromise;
    
    // Check if cache has it, otherwise fetch
    if (editorCacheRef.current[newDate] !== undefined) {
      setEditorContent(editorCacheRef.current[newDate]);
      setEditorLoadedDate(newDate);
      setEditorLoading(false);
      prefetchAdjacentDates(newDate);
    } else {
      const entry = await getLocalEntry(newDate);
      if (activeDateRef.current === newDate) {
        const content = entry?.content || '';
        editorCacheRef.current[newDate] = content;
        setEditorContent(content);
        setEditorLoadedDate(newDate);
        setEditorLoading(false);
        prefetchAdjacentDates(newDate);
      }
    }
  };

  const handleCreateToday = () => {
    const today = getLocalYYYYMMDD();
    handleSelectEntry(today);
  };

  const handleEditorSave = async (content: string) => {
    if (!activeDate) return;
    setEditorContent(content);
    editorCacheRef.current[activeDate] = content;
  };

  // Debounced DB writer
  useEffect(() => {
    if (!editorLoadedDate || editorLoadedDate !== activeDate) return;
    
    const t = setTimeout(async () => {
      await saveLocalEntry(editorLoadedDate, editorContent);
      loadEntries();
    }, 400); // 400ms debounce
    
    return () => clearTimeout(t);
  }, [editorContent, activeDate, editorLoadedDate]);

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
          content={editorContent}
          isLoading={!editorLoadedDate || editorLoadedDate !== activeDate}
          onChange={handleEditorSave}
          onBack={async () => {
            await saveCurrentEntry();
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
              await saveCurrentEntry();
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
              await handleSwitchEntryDate(newDate);
            }
          }}
          onResolveConflict={async (choice) => {
            if (!activeDate) return;
            const { resolveLocalConflict } = await import('./services/db');
            const resolved = await resolveLocalConflict(activeDate, choice);
            if (resolved !== null) {
              editorCacheRef.current[activeDate] = resolved;
              setEditorContent(resolved);
              setEditorLoadedDate(activeDate);
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
          onSelectEntry={(date) => {
            handleSelectEntry(date);
            setSyncResultDates(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
