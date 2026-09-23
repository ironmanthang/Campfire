import { useState, useEffect } from "react";
import { Loader2, X, CheckCircle2 } from "lucide-react";
import { Sidebar } from "./components/sidebar";
import { AboutModal } from "./components/modals/general/AboutModal";
import { SupportModal } from "./components/modals/general/SupportModal";
import { FeedbackModal } from "./components/modals/general/FeedbackModal";
import { ErrorModal } from "./components/modals/general/ErrorModal";
import { HeartGateModal } from "./components/modals/general/HeartGateModal";
import { DraggableHeart } from "./components/heart/DraggableHeart";
import { FallingHearts } from "./components/heart/FallingHearts";
import { HelpModal, FullscreenHoverExit, DonateBanner } from "./components/common";
import { ScratchpadView } from "./views/ScratchpadView";
import { ToolExecutorTestPanel } from "./components/dev/ToolExecutorPanel";
import { SyncResultModal } from "./components/modals/data_management/SyncResultModal";
import { ScratchpadConflictModal } from "./components/modals/data_management/ScratchpadConflictModal";
import { SettingsView } from "./views/SettingsView";
import { JournalEditorView } from "./views/journal/JournalEditorView";
import { TimelineView } from "./views/timeline";
import { SearchView } from "./views/search/SearchView";
import { ChatView } from "./views/chat/ChatView";
import { ReflectionView } from "./views/ReflectionView";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { useAppStore } from "./store/useAppStore";
import { useOllamaStore } from "./store/useOllamaStore";
import { useAmbientAudio } from "./hooks/useAmbientAudio";
import { useBannerLogic } from "./hooks/useBannerLogic";
import { useTextZoom } from "./hooks/useTextZoom";
import { matchesShortcut } from "./components/heart/shortcut";
import { ImportReportModal } from "./components/modals/data_management/ImportReportModal";
import { preloadSfx } from "./services/audioService";

function App() {
  const t = useTranslation().t;
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);


  // Toggle tool executor panel on Ctrl + Alt + T (development only)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "t") {
        setShowDevPanel((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const {
    config,
    loadingConfig,
    loadConfig,
    view,
    forceViewAndResetHistory,
    statusMessage,
    clearNotification,
    goBack,
    goForward,
    showNotification,
    syncResultDates,
    setSyncResultDates,
    pendingScratchpadConflict,
    resolveScratchpadConflict,
    importReport,
    setImportReport,
    triggerJournalRefresh,
    journalRefreshKey,
    heartGateOpen,
    setHeartGateOpen,
    updateConfigField,
    startHeartRain,
  } = useAppStore();

  const {
    verifyOllamaConnection
  } = useOllamaStore();

  useAmbientAudio();

  useEffect(() => {
    preloadSfx();
  }, []);

  // Global heart shortcut. When the configured combo is pressed anywhere in
  // the app, fire the same action the floating heart's click would: open the
  // support modal by default, or start a heart rain if the user enabled
  // "Make hearts fall on click". Suppressed when the user is typing in an
  // input, textarea, or contenteditable element so journal/chat text isn't
  // hijacked.
  const heartShortcut = config.heart_shortcut;
  useEffect(() => {
    if (!heartShortcut) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip when the user is typing into a text field.
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      if (!matchesShortcut(e, heartShortcut)) return;
      e.preventDefault();
      if (config.heart_click_falls) {
        startHeartRain((config.heart_rain_duration ?? 5) * 1000);
      } else {
        setIsSupportOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [heartShortcut, config.heart_click_falls, config.heart_rain_duration, startHeartRain]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const {
    showDonateBanner,
    bannerReason,
    dismissMaybeLater,
    dismissNeverAsk,
  } = useBannerLogic(config.journal_dir, journalRefreshKey);

  useTextZoom();

  // Poll Ollama status on active view updates
  useEffect(() => {
    verifyOllamaConnection();
  }, [view, verifyOllamaConnection]);

  // Synchronize language when config is loaded or updated
  useEffect(() => {
    if (!loadingConfig && config.language) {
      i18n.changeLanguage(config.language);
    }
  }, [loadingConfig, config.language]);

  // Force onboarding if directory isn't configured
  useEffect(() => {
    if (!loadingConfig && !config.journal_dir) {
      forceViewAndResetHistory("settings");
      showNotification(t("app.welcomeNotification"), "success");
    }
  }, [loadingConfig, config.journal_dir, showNotification, t, forceViewAndResetHistory]);

  // Add global mouseup/mousedown listener for M4/M5 (browser back/forward) buttons
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        if (e.button === 3) {
          goBack();
        } else if (e.button === 4) {
          goForward();
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [goBack, goForward]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-app text-text-primary">
      {/* Top Hover Exit Button in Fullscreen Mode */}
      <FullscreenHoverExit />

      {/* Sidebar Navigation */}
      <Sidebar
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Soft Donation Reminder Banner */}
        <DonateBanner
          show={showDonateBanner}
          reason={bannerReason}
          onSupport={() => setIsSupportOpen(true)}
          onMaybeLater={dismissMaybeLater}
          onNeverAsk={dismissNeverAsk}
        />

        {/* Success toast notification */}
        {statusMessage && statusMessage.type === "success" && (
          <div
            className="fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-bg-surface/85 backdrop-blur-md border-accent-brand text-text-primary text-xs font-semibold shadow-xl animate-fade-in max-w-sm w-fit break-words"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
            <button
              onClick={clearNotification}
              className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-bg-app/40 transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Error Modal */}
        <ErrorModal
          isOpen={statusMessage !== null && statusMessage.type === "error"}
          message={statusMessage?.type === "error" ? statusMessage.text : ""}
          onClose={clearNotification}
        />

        {loadingConfig ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent-brand" />
            <p className="text-sm text-text-secondary">{t("app.loadingConfig")}</p>
          </div>
        ) : (
          <>
            {/* VIEW Router */}
            {view === "settings" && <SettingsView />}

            {view === "journal" && <JournalEditorView />}

            {view === "timeline" && <TimelineView />}

            {view === "search" && <SearchView />}

            {view === "scratchpad" && <ScratchpadView />}

            <div className={`flex-1 flex flex-col overflow-hidden ${view === "chat" ? "" : "hidden"}`}>
              <ChatView visible={view === "chat"} />
            </div>
            <div className={`flex-1 flex flex-col overflow-hidden ${view === "reflection" ? "" : "hidden"}`}>
              <ReflectionView />
            </div>
          </>
        )}
      </main>

      {/* Global About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Global Support Modal */}
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* Global Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Global Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Global Heart Gate Modal (shown when enabling click-to-fall for the first time) */}
      <HeartGateModal
        isOpen={heartGateOpen}
        onCancel={() => setHeartGateOpen(false)}
        onConfirm={async () => {
          await updateConfigField("heart_gate_dismissed", true);
          await updateConfigField("heart_click_falls", true);
          setHeartGateOpen(false);
        }}
      />

        {/* Floating draggable donation heart (renders only when show_donate_heart is true) */}
      <DraggableHeart onClick={() => setIsSupportOpen(true)} />

      {/* Falling hearts particle overlay */}
      <FallingHearts />

      {/* Sync result modal */}
      {syncResultDates !== null && (
        <SyncResultModal 
          updatedDates={syncResultDates} 
          onClose={() => {
            setSyncResultDates(null);
            // Refresh journal AFTER modal closes so the editor shows the
            // newly-downloaded content instead of ghost (pre-sync) content.
            triggerJournalRefresh();
          }} 
        />
      )}

      {importReport !== null && (
        <ImportReportModal
          report={importReport}
          onClose={() => {
            setImportReport(null);
          }}
        />
      )}

      {pendingScratchpadConflict !== null && (
        <ScratchpadConflictModal
          onResolve={(choice) => {
            resolveScratchpadConflict(choice);
          }}
        />
      )}

      {/* Dev Tool Test Panel Overlay */}
      {showDevPanel && <ToolExecutorTestPanel />}
    </div>
  );
}

export default App;
