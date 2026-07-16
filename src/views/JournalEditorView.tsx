import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import ReactMarkdown from "react-markdown";
import {
  ChevronLeft,
  Calendar,
  ChevronRight,
  Loader2,
  Clock,
  Check,
  Save,
  Tag
} from "lucide-react";
import { formatToDDMMYY, getLocalYYYYMMDD } from "../lib/dateUtils";
import { useResizer } from "../hooks/useResizer";
import { useTranslation } from "react-i18next";
import { SidebarToggleButton } from "../components/SidebarToggleButton";
import { useAppStore } from "../store/useAppStore";
import { useSearchStore } from "../store/useSearchStore";
import { extractTags } from "../lib/tagUtils";

export function JournalEditorView() {
  const { t } = useTranslation();
  
  const {
    config,
    currentDate,
    setCurrentDate,
    view,
    showNotification,
    sidebarCollapsed,
    toggleSidebar,
    navigateToView,
    isDriveConnected,
    handleSync
  } = useAppStore();

  const { handleTagClick } = useSearchStore();

  const prevDateRef = useRef(currentDate);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [entryContent, setEntryContent] = useState("");

  const [editorWidthPercent, startDrag, resetWidth] = useResizer({
    key: "editor_width_percent",
    defaultVal: 50,
    mode: "percent",
    min: 0,
    max: 100,
    snapThreshold: 5,
  });
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorTags, setEditorTags] = useState<string[]>([]);

  // Load entry content when currentDate or journal_dir changes
  useEffect(() => {
    if (!config.journal_dir) return;

    // Immediately save previous unsaved entry to the PREVIOUS date if needed
    if (isDirty && prevDateRef.current !== currentDate) {
      saveEntryImmediate(prevDateRef.current, entryContent);
    }

    // Keep track of the current date for future transitions
    prevDateRef.current = currentDate;

    let active = true;
    async function loadEntry() {
      setLoadingEntry(true);
      setEntryContent(""); // Clear old content immediately to prevent visual leakage in preview
      setEditorTags([]); // Clear tags too
      try {
        const text = await invoke<string>("read_entry", {
          dirPath: config.journal_dir,
          date: currentDate
        });
        if (active) {
          setEntryContent(text);
          setEditorTags(extractTags(text));
          setIsDirty(false);
        }
      } catch (err) {
        console.error("Error loading entry:", err);
        showNotification(t("journalEditor.failedToLoadEntry"), "error");
      } finally {
        if (active) setLoadingEntry(false);
      }
    }

    loadEntry();
    return () => {
      active = false;
    };
  }, [currentDate, config.journal_dir]);

  // Focus textarea when done loading an entry and editor view is active
  useEffect(() => {
    if (!loadingEntry && view === "journal" && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [loadingEntry, view]);

  // Keep focus on "do-nothing" clicks if no text is selected
  useEffect(() => {
    if (view !== "journal") return;
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Skip if user clicked an input, select, textarea, button or scrollable controls
      if (target.closest("textarea, input, select, button, [role='button']")) return;
      
      // Let the browser handle standard text selections (e.g. copying text)
      const selection = window.getSelection()?.toString();
      if (selection && selection.trim().length > 0) return;

      // Refocus textarea programmatically
      textareaRef.current?.focus();
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [view]);

  // Manual & Auto Save
  const saveEntryImmediate = async (dateToSave: string, contentToSave: string) => {
    if (!config.journal_dir) return;
    setIsSaving(true);
    try {
      await invoke("write_entry", {
        dirPath: config.journal_dir,
        date: dateToSave,
        content: contentToSave
      });
      setIsDirty(false);

      // Trigger Google Drive sync if auto-sync is enabled and drive is connected
      if (config.google_drive_auto_sync && config.google_drive_client_id && isDriveConnected) {
        handleSync().catch(console.error);
      }
    } catch (err) {
      console.error(err);
      showNotification(t("journalEditor.failedToSaveEntry"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save debouncer
  useEffect(() => {
    if (!config.journal_dir || loadingEntry || !isDirty) return;
    if (config.autosave_interval === 0) return;

    const delay = config.autosave_interval * 1000;
    const timer = setTimeout(() => {
      saveEntryImmediate(currentDate, entryContent);
    }, delay);

    return () => clearTimeout(timer);
  }, [entryContent, config.autosave_interval, isDirty, loadingEntry, currentDate]);

  const handleTextChange = (text: string) => {
    setEntryContent(text);
    setEditorTags(extractTags(text));
    setIsDirty(true);
  };


  const stepDate = async (amount: number, isShift: boolean) => {
    if (isShift) {
      if (!config.journal_dir) return;
      try {
        const list: { date: string }[] = await invoke("list_entries", {
          dirPath: config.journal_dir
        });
        
        if (amount < 0) {
          // Go to the closest older entry with content (date < currentDate)
          const target = list.find(e => e.date < currentDate);
          if (target) {
            setCurrentDate(target.date);
          } else {
            showNotification(t("journalEditor.noOlderEntries"), "success");
          }
        } else {
          // Go to the closest newer entry with content (date > currentDate)
          const target = [...list].reverse().find(e => e.date > currentDate);
          if (target) {
            setCurrentDate(target.date);
          } else {
            showNotification(t("journalEditor.noNewerEntries"), "success");
          }
        }
      } catch (err) {
        console.error(err);
        showNotification(t("journalEditor.failedToFindEntry"), "error");
      }
    } else {
      const [year, month, day] = currentDate.split("-").map(Number);
      const d = new Date(year, month - 1, day + amount); // local calendar math
      setCurrentDate(getLocalYYYYMMDD(d));
    }
  };

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirty) {
        // Save immediately before component is destroyed
        saveEntryImmediate(currentDate, entryContent);
      }
    };
  }, [isDirty, currentDate, entryContent]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Header / Controls */}
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
          <div className="relative flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent-brand" />
            <span className="text-sm font-semibold pointer-events-none">
              {formatToDDMMYY(currentDate)}
            </span>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          </div>
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
            {isSaving ? (
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

      {/* Editor Content Area (Split Screen) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Raw Markdown Textarea */}
        <div 
          className="flex flex-col h-full pr-3 overflow-hidden"
          style={{ 
            width: `${editorWidthPercent}%`,
            display: editorWidthPercent === 0 ? "none" : "flex"
          }}
        >
          {loadingEntry ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-accent-brand" />
              <span className="text-xs text-text-secondary">{t("journalEditor.loadingFlatFile")}</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={entryContent}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={t("journalEditor.editorPlaceholder")}
              className="flex-1 w-full p-6 bg-transparent text-text-primary text-sm leading-relaxed border-none focus:outline-none resize-none font-mono"
            />
          )}
        </div>

        {/* Drag Handle Divider */}
        <div
          className={`w-4 shrink-0 cursor-ew-resize hover:bg-accent-brand/5 z-30 group flex items-center justify-center select-none relative ${
            editorWidthPercent === 0
              ? "ml-0 mr-[-8px]"
              : editorWidthPercent === 100
              ? "mr-0 ml-[-8px]"
              : "-mx-2"
          }`}
          onMouseDown={startDrag}
          onDoubleClick={resetWidth}
        >
          {/* Visual border line */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-border-brand/60 group-hover:bg-accent-brand/40 transition-colors" />
          {/* Grabbable notch */}
          <div className="w-[2px] h-12 bg-border-brand/20 group-hover:bg-accent-brand/80 rounded transition-colors duration-150 z-10 sticky top-1/2 -translate-y-1/2" />
        </div>

        {/* Right Side: Markdown Preview */}
        <div 
          className="overflow-y-auto p-6 bg-bg-surface/20 h-full flex-1"
          style={{ 
            width: `${100 - editorWidthPercent}%`,
            display: editorWidthPercent === 100 ? "none" : "block"
          }}
        >
          {entryContent.trim() ? (
            <div className="prose max-w-none markdown-preview">
              <ReactMarkdown>{entryContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary select-none">
              <p className="text-sm">{t("journalEditor.previewEmpty")}</p>
              <p className="text-xs mt-1">{t("journalEditor.previewInstruction")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tag & Meta Footer */}
      <footer className="p-3 border-t border-border-brand bg-bg-surface/40 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pr-4">
          <Tag className="h-3.5 w-3.5 text-accent-brand shrink-0" />
          {editorTags.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {editorTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag, navigateToView)}
                  className="px-2 py-0.5 rounded bg-accent-brand/10 border border-accent-brand/20 text-accent-brand font-medium text-[10px] hover:bg-accent-brand/20 hover:border-accent-brand transition-colors cursor-pointer select-none"
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-text-secondary text-[10px]">{t("journalEditor.noTags")}</span>
          )}
        </div>
        <div className="text-text-secondary shrink-0 pl-2">
          {t("timeline.wordCount", { count: entryContent.split(/\s+/).filter(Boolean).length })}
        </div>
      </footer>
    </div>
  );
}
