import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { useResizer } from "../../hooks/useResizer";
import { useAppStore } from "../../store/useAppStore";
import { useSearchStore } from "../../store/useSearchStore";
import { useJournalSearch } from "./useJournalSearch";
import { useJournalSave } from "./useJournalSave";

export function useJournalEditor() {
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
    journalRefreshKey,
    initialSyncInProgress,
  } = useAppStore();

  const { handleTagClick } = useSearchStore();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [editorWidthPercent, startDrag, resetWidth] = useResizer({
    key: "editor_width_percent",
    defaultVal: 50,
    mode: "percent",
    min: 0,
    max: 100,
    snapThreshold: 5,
  });

  const {
    entryContent,
    loadingEntry,
    isDirty,
    saveStatus,
    editorTags,
    saveEntryImmediate,
    handleTextChange,
  } = useJournalSave({
    config,
    currentDate,
    view,
    showNotification,
    isDriveConnected,
    handleSync,
    journalRefreshKey,
    textareaRef,
  });

  const {
    showFindBar,
    findQuery,
    setFindQuery,
    findMatches,
    activeMatchIndex,
    handleFindNext,
    handleFindPrev,
    handleCloseFind,
    highlightedText,
  } = useJournalSearch({
    entryContent,
    view,
    textareaRef,
    overlayRef,
  });

  const stepDate = async (amount: number, isShift: boolean) => {
    if (isShift) {
      if (!config.journal_dir) return;
      try {
        const list: { date: string }[] = await invoke("list_entries", {
          dirPath: config.journal_dir,
        });

        if (amount < 0) {
          const target = list.find((e) => e.date < currentDate);
          if (target) {
            setCurrentDate(target.date);
          } else {
            showNotification(t("journalEditor.noOlderEntries"), "success");
          }
        } else {
          const target = [...list].reverse().find((e) => e.date > currentDate);
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
      const d = new Date(year, month - 1, day + amount);
      const getLocalYYYYMMDD = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const dStr = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${dStr}`;
      };
      setCurrentDate(getLocalYYYYMMDD(d));
    }
  };

  return {
    config,
    currentDate,
    setCurrentDate,
    view,
    sidebarCollapsed,
    toggleSidebar,
    navigateToView,
    isDriveConnected,
    handleSync,
    syncProgress,
    handleTagClick,
    textareaRef,
    overlayRef,
    entryContent,
    showFindBar,
    findQuery,
    setFindQuery,
    findMatches,
    activeMatchIndex,
    handleFindNext,
    handleFindPrev,
    handleCloseFind,
    editorWidthPercent,
    startDrag,
    resetWidth,
    loadingEntry,
    isDirty,
    saveStatus,
    editorTags,
    saveEntryImmediate,
    handleTextChange,
    stepDate,
    highlightedText,
    initialSyncInProgress,
    t,
  };
}
