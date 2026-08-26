import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Check,
  Save,
  Lock,
  Unlock,
} from "lucide-react";
import { DatePicker } from "../../components/common/DatePicker";
import { SidebarToggleButton } from "../../components/layout/SidebarToggleButton";
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
  saveEntryImmediate: (date: string, content: string) => Promise<void>;
  entryContent: string;
  isLocked?: boolean;
  toggleLock?: () => void;
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
  saveEntryImmediate,
  entryContent,
  isLocked,
  toggleLock,
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
          className="p-1.5 border border-border-brand rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
          title={t("journalEditor.prevDayTooltip")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <DatePicker value={currentDate} onChange={setCurrentDate} />
        <button
          onClick={(e) => stepDate(1, e.shiftKey)}
          onMouseDown={(e) => e.preventDefault()}
          className="p-1.5 border border-border-brand rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
          title={t("journalEditor.nextDayTooltip")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Manual Save Trigger (when autosave is disabled) */}
        {config.autosave_interval === 0 && isDirty ? (
          <button
            onClick={() => saveEntryImmediate(currentDate, entryContent)}
            onMouseDown={(e) => e.preventDefault()}
            className="p-1.5 bg-accent-brand text-bg-app rounded-lg hover:bg-accent-brand-hover transition-colors flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
            title={t("journalEditor.saveButton")}
          >
            <Save className="h-4 w-4" />
          </button>
        ) : (
          /* Autosave / Disk Save Status Indicator (Fixed icon, no layout shift) */
          <div
            className="p-1.5 flex items-center justify-center text-text-secondary shrink-0"
            title={
              saveStatus === "saving"
                ? t("journalEditor.statusWriting")
                : isDirty
                ? t("journalEditor.statusAutoSaving")
                : t("journalEditor.statusSaved")
            }
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent-brand" />
            ) : isDirty ? (
              <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
            ) : (
              <Check className="h-4 w-4 text-accent-brand" />
            )}
          </div>
        )}

        {/* Lock / Unlock Toggle Button (Fixed icon) */}
        {toggleLock && (
          <button
            onClick={toggleLock}
            className="p-1.5 rounded-lg border border-border-brand hover:border-accent-brand bg-bg-surface/30 text-text-secondary hover:text-text-primary transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
            title={
              isLocked
                ? "Entry is locked (Read-Only). Click to unlock editing."
                : "Lock entry (Prevent accidental edits)."
            }
          >
            {isLocked ? (
              <Lock className="h-4 w-4 text-text-secondary" />
            ) : (
              <Unlock className="h-4 w-4 text-amber-500" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
