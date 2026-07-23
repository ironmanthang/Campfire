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
import { HelpModal } from "./components/common";
import { ToolExecutorTestPanel } from "./services/toolExecutorPanel";
import { SyncResultModal } from "./components/modals/data_management/SyncResultModal";
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
import { matchesShortcut } from "./components/heart/shortcut";
import { ImportReportModal } from "./components/modals/data_management/ImportReportModal";
import { invoke } from "@tauri-apps/api/core";
import { calculateStreak } from "@campfire/core";

function App() {
  const t = useTranslation().t;
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const [showDonateBanner, setShowDonateBanner] = useState(false);
  const [bannerReason, setBannerReason] = useState<"count" | "streak" | null>(null);

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
        startHeartRain(5000);
      } else {
        setIsSupportOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [heartShortcut, config.heart_click_falls, startHeartRain]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!config.journal_dir) return;

    const checkStats = async () => {
      const neverAsk = localStorage.getItem("donate-reminder-never-ask") === "true";
      const maybeLater = sessionStorage.getItem("donate-reminder-maybe-later") === "true";
      if (neverAsk || maybeLater) {
        setShowDonateBanner(false);
        return;
      }

      try {
        const list: { date: string }[] = await invoke("list_entries", {
          dirPath: config.journal_dir,
        });
        const count = list.length;
        const dates = list.map((e) => e.date);
        const streak = calculateStreak(dates);

        if (count >= 10 || streak >= 30) {
          setShowDonateBanner(true);
          setBannerReason(count >= 10 ? "count" : "streak");
        } else {
          setShowDonateBanner(false);
        }
      } catch (err) {
        console.error("Failed to check stats for donation banner:", err);
      }
    };

    checkStats();

    window.addEventListener("donate-banner-refresh", checkStats);
    return () => window.removeEventListener("donate-banner-refresh", checkStats);
  }, [config.journal_dir, journalRefreshKey]);

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

  // Global Ctrl + Mouse Wheel listener for zoom in/out text
  useEffect(() => {
    // Load initial zoom level from localStorage
    const savedZoom = localStorage.getItem("text-zoom-level");
    let currentZoom = savedZoom ? parseInt(savedZoom, 10) : 100;
    
    // Apply initial zoom
    document.documentElement.style.fontSize = `${currentZoom}%`;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Prevent default browser/webview zoom behavior
        e.preventDefault();

        // Determine zoom direction
        const delta = e.deltaY;
        if (delta < 0) {
          // Zoom in
          currentZoom = Math.min(200, currentZoom + 5);
        } else if (delta > 0) {
          // Zoom out
          currentZoom = Math.max(70, currentZoom - 5);
        }

        // Apply and persist zoom level
        document.documentElement.style.fontSize = `${currentZoom}%`;
        localStorage.setItem("text-zoom-level", currentZoom.toString());
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          currentZoom = Math.min(200, currentZoom + 5);
          document.documentElement.style.fontSize = `${currentZoom}%`;
          localStorage.setItem("text-zoom-level", currentZoom.toString());
        } else if (e.key === "-") {
          e.preventDefault();
          currentZoom = Math.max(70, currentZoom - 5);
          document.documentElement.style.fontSize = `${currentZoom}%`;
          localStorage.setItem("text-zoom-level", currentZoom.toString());
        } else if (e.key === "0") {
          e.preventDefault();
          currentZoom = 100;
          document.documentElement.style.fontSize = `${currentZoom}%`;
          localStorage.setItem("text-zoom-level", currentZoom.toString());
        }
      }
    };

    // Note: { passive: false } is critical to allow preventing the default scroll/zoom event
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);


  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-app text-text-primary">
      {/* Sidebar Navigation */}
      <Sidebar
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Soft Donation Reminder Banner */}
        {showDonateBanner && (
          <div className="bg-accent-brand/10 border-b border-border-brand/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-lg">🎉</span>
              <p className="text-xs font-semibold leading-relaxed text-text-primary">
                {bannerReason === "count"
                  ? t("donateBanner.countMessage", { count: 10 })
                  : t("donateBanner.streakMessage", { streak: 30 })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
              <button
                onClick={() => setIsSupportOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-accent-brand text-bg-app font-bold text-xs shadow hover:bg-accent-brand/90 transition-all cursor-pointer"
              >
                {t("donateBanner.supportBtn")}
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem("donate-reminder-maybe-later", "true");
                  setShowDonateBanner(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-brand hover:border-accent-brand text-xs font-bold text-text-primary transition-all cursor-pointer"
              >
                {t("donateBanner.maybeLaterBtn")}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("donate-reminder-never-ask", "true");
                  setShowDonateBanner(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-brand hover:border-accent-brand text-xs font-bold text-text-primary transition-all cursor-pointer"
              >
                {t("donateBanner.dontAskBtn", { defaultValue: "Don't Ask Again" })}
              </button>
            </div>
          </div>
        )}

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
            <p className="text-sm text-text-secondary">Loading local memory config...</p>
          </div>
        ) : (
          <>
            {/* VIEW Router */}
            {view === "settings" && <SettingsView />}

            {view === "journal" && <JournalEditorView />}

            {view === "timeline" && <TimelineView />}

            {view === "search" && <SearchView />}

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

      {/* Dev Tool Test Panel Overlay */}
      {showDevPanel && <ToolExecutorTestPanel />}
    </div>
  );
}

export default App;
