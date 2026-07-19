import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Check,
  Save,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { DatePicker } from "../../components/common/DatePicker";
import { SidebarToggleButton } from "../../components/SidebarToggleButton";
import { useTranslation } from "react-i18next";

interface JournalEditorHeaderProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  currentDate: string;
  stepDate: (amount: number, isShift: boolean) => Promise<void>;
  setCurrentDate: (date: string) => void;
  saveStatus: "idle" | "saving";
  isDirty: boolean;
  config: any;
  isDriveConnected: boolean;
  syncProgress: {
    status: "idle" | "authenticating" | "connecting" | "syncing" | "completed" | "error";
    message: string;
    filesProcessed: number;
    totalFiles: number;
  };
  handleSync: (force?: boolean) => Promise<void>;
  saveEntryImmediate: (date: string, content: string) => Promise<void>;
  entryContent: string;
}

export function JournalEditorHeader({
  sidebarCollapsed,
  toggleSidebar,
  currentDate,
  stepDate,
  setCurrentDate,
  saveStatus,
  isDirty,
  config,
  isDriveConnected,
  syncProgress,
  handleSync,
  saveEntryImmediate,
  entryContent,
}: JournalEditorHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="p-4 border-b border-border-brand flex items-center justify-between shrink-0 bg-bg-surface/50">
      <div className="flex items-center gap-3">
        <SidebarToggleButton
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          className="p-1.5"
        />
        <button
          onClick={(e) => stepDate(-1, e.shiftKey)}
          onMouseDown={(e) => e.preventDefault()}
          className="p-1.5 border border-border-brand rounded-lg hover:bg-bg-surface transition-colors"
          title={t("journalEditor.prevDayTooltip")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <DatePicker value={currentDate} onChange={setCurrentDate} />
        <button
          onClick={(e) => stepDate(1, e.shiftKey)}
          onMouseDown={(e) => e.preventDefault()}
          className="p-1.5 border border-border-brand rounded-lg hover:bg-bg-surface transition-colors"
          title={t("journalEditor.nextDayTooltip")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Saving / Save Indicator */}
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {saveStatus === "saving" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-brand" />
              <span>{t("journalEditor.statusWriting")}</span>
            </>
          ) : isDirty ? (
            <>
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
              <span>{t("journalEditor.statusAutoSaving")}</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-accent-brand" />
              <span>{t("journalEditor.statusSaved")}</span>
            </>
          )}
        </div>

        {/* Cloud Sync Status */}
        {config.google_drive_client_id && (
          <button
            onClick={() => {
              if (syncProgress.status !== "syncing" && syncProgress.status !== "connecting") {
                handleSync(true).catch(console.error);
              }
            }}
            disabled={syncProgress.status === "syncing" || syncProgress.status === "connecting"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-brand hover:border-accent-brand bg-bg-surface/30 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-85 text-xs font-semibold cursor-pointer active:scale-95"
            title={
              !isDriveConnected
                ? "Drive not connected"
                : syncProgress.status === "idle"
                ? "Drive Connected (Click to sync now)"
                : syncProgress.message
            }
          >
            {!isDriveConnected ? (
              <CloudOff className="h-3.5 w-3.5 text-text-secondary" />
            ) : syncProgress.status === "syncing" || syncProgress.status === "connecting" ? (
              <RefreshCw className="h-3.5 w-3.5 text-accent-brand animate-spin" />
            ) : syncProgress.status === "error" ? (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            ) : (
              <Cloud className="h-3.5 w-3.5 text-emerald-500" />
            )}
            <span className="hidden sm:inline">
              {!isDriveConnected
                ? "Offline"
                : syncProgress.status === "syncing"
                ? "Syncing"
                : syncProgress.status === "connecting"
                ? "Connecting"
                : syncProgress.status === "error"
                ? "Error"
                : "Synced"}
            </span>
          </button>
        )}

        {/* Manual Save Trigger */}
        {config.autosave_interval === 0 && isDirty && (
          <button
            onClick={() => saveEntryImmediate(currentDate, entryContent)}
            onMouseDown={(e) => e.preventDefault()}
            className="px-3.5 py-1.5 bg-accent-brand text-bg-app rounded-lg text-xs font-semibold hover:bg-accent-brand-hover transition-colors flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {t("journalEditor.saveButton")}
          </button>
        )}
      </div>
    </header>
  );
}
