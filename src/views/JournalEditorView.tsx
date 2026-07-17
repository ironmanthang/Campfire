import { useState, useEffect, useRef, useCallback } from "react";
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
  Tag,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  X
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
    handleSync,
    syncProgress,
    journalRefreshKey
  } = useAppStore();

  const { handleTagClick } = useSearchStore();

  const prevDateRef = useRef(currentDate);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [entryContent, setEntryContent] = useState("");

  // Custom Find in Editor (Ctrl+F)
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findMatches, setFindMatches] = useState<{ start: number; end: number }[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const handleFindNext = useCallback(() => {
    if (findMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % findMatches.length);
  }, [findMatches]);

  const handleFindPrev = useCallback(() => {
    if (findMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev - 1 + findMatches.length) % findMatches.length);
  }, [findMatches]);

  const handleCloseFind = useCallback(() => {
    setShowFindBar(false);
    setFindQuery("");
    setFindMatches([]);
    setActiveMatchIndex(0);
    textareaRef.current?.focus();
  }, []);

  // Update matches list reactively when query or content changes (without focusing)
  useEffect(() => {
    if (!showFindBar || !findQuery) {
      setFindMatches([]);
      setActiveMatchIndex(0);
      return;
    }

    const text = entryContent.toLowerCase();
    const query = findQuery.toLowerCase();
    const matches: { start: number; end: number }[] = [];
    let idx = text.indexOf(query);
    while (idx !== -1) {
      matches.push({ start: idx, end: idx + query.length });
      idx = text.indexOf(query, idx + query.length);
    }
    setFindMatches(matches);
    setActiveMatchIndex((prev) => {
      if (matches.length === 0) return 0;
      if (prev >= matches.length) return matches.length - 1;
      return prev;
    });
  }, [findQuery, entryContent, showFindBar]);

  // Scroll active match in the overlay into view and sync textarea scroll
  useEffect(() => {
    if (showFindBar && findMatches.length > 0) {
      // Small timeout to allow DOM to render active-find-match first
      const t = setTimeout(() => {
        const activeElement = document.getElementById("active-find-match");
        if (activeElement && overlayRef.current && textareaRef.current) {
          const container = overlayRef.current;
          const textarea = textareaRef.current;
          
          // Calculate the target scroll position (center the match vertically in the container)
          const elementTop = activeElement.offsetTop;
          const elementHeight = activeElement.offsetHeight;
          const containerHeight = container.clientHeight;
          
          const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
          
          // Apply scrollTop to both overlay and textarea
          container.scrollTop = targetScrollTop;
          textarea.scrollTop = targetScrollTop;
        }
      }, 30);
      return () => clearTimeout(t);
    }
  }, [activeMatchIndex, findMatches, showFindBar]);

  // Intercept Ctrl+F / Cmd+F to toggle search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (view !== "journal") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowFindBar((prev) => {
          if (prev) {
            // Close search bar and clear states
            setFindQuery("");
            setFindMatches([]);
            setActiveMatchIndex(0);
            textareaRef.current?.focus();
            return false;
          } else {
            // Open search bar and focus input
            setTimeout(() => {
              const input = document.getElementById("editor-find-input") as HTMLInputElement;
              if (input) {
                input.focus();
                input.select();
              }
            }, 50);
            return true;
          }
        });
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [view]);

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
  // Use a ref for the in-progress flag so toggling it does NOT cause a
  // re-render. A re-render here would restart the auto-save debounce timer
  // (its useEffect cleanup runs → new timer set) which is what caused the
  // double-sync cycle and the predictable "Auto-saving ↔ Saved" toggle.
  const isSavingRef = useRef(false);
  // Separate, UI-only state: only the save function itself writes this, so
  // it never feeds back into the debounce loop.
  type SaveStatus = 'idle' | 'saving';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  // Always-current ref to saveEntryImmediate so timer/unmount callbacks
  // never hold a stale closure without needing it in their dep arrays.
  const saveEntryImmediateRef = useRef<(date: string, content: string) => void>(() => {});

  const isDirtyRef = useRef(isDirty);
  const currentDateRef = useRef(currentDate);
  const entryContentRef = useRef(entryContent);

  // Keep refs in sync with state/props on every render
  isDirtyRef.current = isDirty;
  currentDateRef.current = currentDate;
  entryContentRef.current = entryContent;

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
      entryContentRef.current = "";
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
          isDirtyRef.current = false;
          entryContentRef.current = text;
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
  }, [currentDate, config.journal_dir, journalRefreshKey]);

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
  const saveEntryImmediate = useCallback(async (dateToSave: string, contentToSave: string) => {
    if (!config.journal_dir) return;
    // Guard against re-entrant saves (e.g. if the debounce fires while a
    // previous save is still in-flight).
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus('saving');
    try {
      await invoke("write_entry", {
        dirPath: config.journal_dir,
        date: dateToSave,
        content: contentToSave
      });
      setIsDirty(false);
      isDirtyRef.current = false;

      // Trigger Google Drive sync if auto-sync is enabled and drive is connected
      if (config.google_drive_auto_sync && config.google_drive_client_id && isDriveConnected) {
        handleSync().catch(console.error);
      }
    } catch (err) {
      console.error(err);
      showNotification(t("journalEditor.failedToSaveEntry"), "error");
    } finally {
      isSavingRef.current = false;
      setSaveStatus('idle');
    }
  }, [config.journal_dir, config.google_drive_auto_sync, config.google_drive_client_id, isDriveConnected, handleSync, showNotification, t]);

  // Keep the ref in sync with the latest version of the function.
  // This allows the debounce timer and unmount cleanup to always call the
  // up-to-date function without listing it in their own dep arrays
  // (which would restart their timers on every render).
  saveEntryImmediateRef.current = saveEntryImmediate;

  // Auto-save debouncer
  useEffect(() => {
    if (!config.journal_dir || loadingEntry || !isDirty) return;
    if (config.autosave_interval === 0) return;

    const delay = config.autosave_interval * 1000;
    const timer = setTimeout(() => {
      saveEntryImmediateRef.current(currentDate, entryContent);
    }, delay);

    return () => clearTimeout(timer);
  }, [entryContent, config.autosave_interval, isDirty, loadingEntry, currentDate]);

  const handleTextChange = (text: string) => {
    setEntryContent(text);
    setEditorTags(extractTags(text));
    setIsDirty(true);
    isDirtyRef.current = true;
    entryContentRef.current = text;
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
      if (isDirtyRef.current) {
        // Save immediately before component is destroyed.
        // Use the ref so we always call the latest version of the function
        // without adding it to this effect's dep array.
        saveEntryImmediateRef.current(currentDateRef.current, entryContentRef.current);
      }
    };
  }, []);

  const getHighlightedText = () => {
    const escaped = escapeHtml(entryContent);
    if (!showFindBar || !findQuery) return escaped;
    
    const queryEscaped = escapeHtml(findQuery).toLowerCase();
    if (!queryEscaped) return escaped;

    const escapedForRegex = queryEscaped.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedForRegex, 'gi');
    
    let matchIndex = 0;
    return escaped.replace(regex, (match) => {
      const isCurrent = matchIndex === activeMatchIndex;
      const id = isCurrent ? ' id="active-find-match"' : '';
      matchIndex++;
      return `<mark${id} class="${isCurrent ? 'bg-orange-500/50 dark:bg-orange-500/70 shadow-[0_0_0_1px_rgba(249,115,22,0.4)]' : 'bg-yellow-500/25 dark:bg-yellow-500/40'} text-transparent rounded-sm px-[1.5px] -mx-[1.5px]">${match}</mark>`;
    });
  };

  const highlightedText = getHighlightedText();

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
            {saveStatus === 'saving' ? (
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
                if (syncProgress.status !== 'syncing' && syncProgress.status !== 'connecting') {
                  handleSync(true).catch(console.error);
                }
              }}
              disabled={syncProgress.status === 'syncing' || syncProgress.status === 'connecting'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-brand hover:border-accent-brand bg-bg-surface/30 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-85 text-xs font-semibold cursor-pointer active:scale-95"
              title={
                !isDriveConnected
                  ? "Drive not connected"
                  : syncProgress.status === 'idle'
                  ? "Drive Connected (Click to sync now)"
                  : syncProgress.message
              }
            >
              {!isDriveConnected ? (
                <CloudOff className="h-3.5 w-3.5 text-text-secondary" />
              ) : syncProgress.status === 'syncing' || syncProgress.status === 'connecting' ? (
                <RefreshCw className="h-3.5 w-3.5 text-accent-brand animate-spin" />
              ) : syncProgress.status === 'error' ? (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
              ) : (
                <Cloud className="h-3.5 w-3.5 text-emerald-500" />
              )}
              <span className="hidden sm:inline">
                {!isDriveConnected
                  ? "Offline"
                  : syncProgress.status === 'syncing'
                  ? "Syncing"
                  : syncProgress.status === 'connecting'
                  ? "Connecting"
                  : syncProgress.status === 'error'
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
          {showFindBar && (
            <div className="w-full bg-bg-surface/60 border-b border-border-brand/80 flex items-center justify-between p-2 shrink-0 gap-2 animate-fade-in select-none">
              <div className="flex items-center gap-2 flex-1">
                <input
                  id="editor-find-input"
                  type="text"
                  placeholder={t("journalEditor.findPlaceholder", "Find in entry...")}
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.shiftKey) {
                        handleFindPrev();
                      } else {
                        handleFindNext();
                      }
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      handleCloseFind();
                    }
                  }}
                  className="px-2.5 py-1 text-xs bg-bg-input border border-border-brand/80 rounded-lg focus:outline-none focus:border-accent-brand text-text-primary w-48 font-sans"
                />
                <span className="text-[10px] text-text-secondary font-mono px-1 select-none min-w-[32px]">
                  {findMatches.length > 0 ? `${activeMatchIndex + 1}/${findMatches.length}` : "0/0"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleFindPrev}
                  disabled={findMatches.length === 0}
                  className="p-1 hover:bg-bg-app/80 rounded-lg transition-colors text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer"
                  title="Previous Match (Shift+F3 / Shift+Ctrl+G)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleFindNext}
                  disabled={findMatches.length === 0}
                  className="p-1 hover:bg-bg-app/80 rounded-lg transition-colors text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer"
                  title="Next Match (F3 / Ctrl+G)"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="w-[1px] h-4 bg-border-brand/60 mx-1" />
                <button
                  type="button"
                  onClick={handleCloseFind}
                  className="p-1 hover:bg-bg-app/80 rounded-lg transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {loadingEntry ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-accent-brand" />
              <span className="text-xs text-text-secondary">{t("journalEditor.loadingFlatFile")}</span>
            </div>
          ) : (
            <div className="flex-1 w-full relative overflow-hidden">
              {/* Highlight Overlay */}
              <div 
                ref={overlayRef}
                className="absolute inset-0 w-full h-full p-6 pointer-events-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-transparent border-none select-none overlay-scroll-container"
                style={{ 
                  color: "transparent",
                  backgroundColor: "transparent",
                }}
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
              <textarea
                ref={textareaRef}
                value={entryContent}
                onChange={(e) => handleTextChange(e.target.value)}
                onScroll={(e) => {
                  if (overlayRef.current) {
                    overlayRef.current.scrollTop = e.currentTarget.scrollTop;
                    overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
                onKeyDown={(e) => {
                  if (showFindBar) {
                    if (e.key === "F3") {
                      e.preventDefault();
                      if (e.shiftKey) {
                        handleFindPrev();
                      } else {
                        handleFindNext();
                      }
                    }
                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
                      e.preventDefault();
                      if (e.shiftKey) {
                        handleFindPrev();
                      } else {
                        handleFindNext();
                      }
                    }
                  }
                }}
                placeholder={t("journalEditor.editorPlaceholder")}
                className="absolute inset-0 w-full h-full p-6 bg-transparent text-text-primary text-sm leading-relaxed border-none focus:outline-none resize-none font-mono overflow-y-auto scrollbar-thin"
              />
            </div>
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
