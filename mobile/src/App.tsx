import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { JournalList } from './components/JournalList';
import { JournalEditor } from './components/JournalEditor';
import { SettingsModal } from './components/SettingsModal';
import { SyncResultModal } from './components/SyncResultModal';
import { DonateModal } from './components/DonateModal';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useJournalDb } from './hooks/useJournalDb';
import { useJournalNavigation } from './hooks/useJournalNavigation';
import { useGoogleSync } from './hooks/useGoogleSync';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(() => localStorage.getItem('past_you_custom_logo'));

  // Refs to break circular hook dependencies
  const activeDateRef = useRef<string | null>(null);
  const loadEntriesRef = useRef<() => void>(() => {});
  const handleSyncRef = useRef<() => void>(() => {});
  const clearCacheRef = useRef<() => void>(() => {});
  const forceReloadEditorRef = useRef<(date: string, content: string) => void>(() => {});

  // 1. Theme state & toggler
  const { theme, toggleTheme } = useTheme();

  // 2. Google OAuth & Sync hook
  const {
    isLoggedIn,
    syncProgress,
    syncResultDates,
    setSyncResultDates,
    toastMessage,
    setToastMessage,
    checkAuthStatus,
    handleSync
  } = useGoogleSync({
    activeDate: activeDateRef.current,
    loadEntries: () => loadEntriesRef.current(),
    clearCache: () => clearCacheRef.current(),
    forceReloadEditor: (date, content) => forceReloadEditorRef.current(date, content),
    onOpenSettings: () => setIsSettingsOpen(true)
  });

  // 3. Navigation, Prefetching & Caching hook
  const {
    activeDate,
    setActiveDate,
    editorContent,
    editorLoadedDate,
    editorLoading,
    editorReloadKey,
    saveCurrentEntry,
    handleSelectEntry,
    handleSwitchEntryDate,
    handleCreateToday,
    handleEditorSave,
    forceReloadEditor,
    clearCache
  } = useJournalNavigation({
    loadEntries: () => loadEntriesRef.current(),
    onSyncTrigger: () => {
      const autoSync = localStorage.getItem('past_you_auto_sync') !== 'false';
      if (autoSync) {
        handleSyncRef.current();
      }
    },
    syncProgressStatus: syncProgress.status,
    setToastMessage
  });

  // 4. Local database entries & debounced autosave hook
  const { entries, loadEntries } = useJournalDb(editorContent, activeDate, editorLoadedDate);

  // Update refs to point to the latest hook functions
  activeDateRef.current = activeDate;
  loadEntriesRef.current = loadEntries;
  handleSyncRef.current = handleSync;
  clearCacheRef.current = clearCache;
  forceReloadEditorRef.current = forceReloadEditor;

  return (
    <div className="flex flex-col h-full bg-bg-app transition-colors duration-200 relative">
      <Header 
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onSync={handleSync}
        onDonateOpen={() => setIsDonateOpen(true)}
        syncProgress={syncProgress}
        isLoggedIn={isLoggedIn}
        customLogo={customLogo}
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
              forceReloadEditor(activeDate, resolved);
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
          onThemeToggle={toggleTheme}
          theme={theme}
          customLogo={customLogo}
          onLogoChange={setCustomLogo}
        />
      )}

      <DonateModal 
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
      />

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
