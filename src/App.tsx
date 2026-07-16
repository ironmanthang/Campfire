import { useState, useEffect } from "react";
import { Loader2, X, CheckCircle2 } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { AboutModal } from "./components/AboutModal";
import { FeedbackModal } from "./components/FeedbackModal";
import { ErrorModal } from "./components/ErrorModal";
import { HelpModal } from "./components/common";
import { ToolExecutorTestPanel } from "./services/_toolExecutor.test";
import { SyncResultModal } from "./components/SyncResultModal";
import { SettingsView } from "./views/SettingsView";
import { JournalEditorView } from "./views/JournalEditorView";
import { TimelineView } from "./views/TimelineView";
import { SearchView } from "./views/SearchView";
import { ChatView } from "./views/ChatView";
import { ReflectionView } from "./views/ReflectionView";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { useAppStore } from "./store/useAppStore";
import { useOllamaStore } from "./store/useOllamaStore";

function App() {
  const { t } = useTranslation();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<"app" | "me">("app");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Toggle tool executor panel on Ctrl + Alt + T
  useEffect(() => {
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
    setSyncResultDates
  } = useAppStore();

  const {
    verifyOllamaConnection
  } = useOllamaStore();

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
        onOpenAbout={(tab = "app") => {
          setAboutInitialTab(tab);
          setIsAboutOpen(true);
        }}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
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
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} initialTab={aboutInitialTab} />

      {/* Global Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Global Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Sync result modal */}
      {syncResultDates !== null && (
        <SyncResultModal 
          updatedDates={syncResultDates} 
          onClose={() => setSyncResultDates(null)} 
        />
      )}

      {/* Dev Tool Test Panel Overlay */}
      {showDevPanel && <ToolExecutorTestPanel />}
    </div>
  );
}

export default App;
