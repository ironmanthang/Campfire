import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

interface UseEntrySelectionProps {
  journalDir: string;
  onDeleteSuccess: (deletedDates: string[]) => void;
  showNotification: (text: string, type: "success" | "error") => void;
  handleExport: (format: "json" | "text", dates?: string[]) => void;
  handleSync?: () => Promise<void>;
}

export function useEntrySelection({
  journalDir,
  onDeleteSuccess,
  showNotification,
  handleExport,
  handleSync
}: UseEntrySelectionProps) {
  const { t } = useTranslation();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ dates: string[] } | null>(null);

  const handleExportSelected = (format: "json" | "text") => {
    if (selectedDates.size === 0) return;
    handleExport(format, Array.from(selectedDates));
  };

  const deleteEntry = async (date: string) => {
    try {
      await invoke("delete_entry", { dirPath: journalDir, date });
      // Clean up sync_base so the next sync knows this was intentional
      await invoke("delete_sync_base", { dirPath: journalDir, date }).catch(() => {});
      onDeleteSuccess([date]);
      showNotification(t("timeline.notifications.entryDeleted"), "success");
      // Propagate deletion to Drive immediately if auto-sync is on
      handleSync?.().catch(console.error);
    } catch (err) {
      console.error(err);
      showNotification(t("timeline.notifications.failedToDeleteEntry"), "error");
    }
  };

  const deleteSelected = async () => {
    if (selectedDates.size === 0) return;
    try {
      const dates = Array.from(selectedDates);
      await invoke("delete_entries", { dirPath: journalDir, dates });
      // Clean up sync_base files so deletions propagate correctly on next sync
      await Promise.all(
        dates.map((date) =>
          invoke("delete_sync_base", { dirPath: journalDir, date }).catch(() => {})
        )
      );
      onDeleteSuccess(dates);
      setSelectedDates(new Set());
      setIsSelecting(false);
      showNotification(t("timeline.notifications.entriesDeleted", { count: dates.length }), "success");
      // Propagate deletions to Drive immediately if auto-sync is on
      handleSync?.().catch(console.error);
    } catch (err) {
      console.error(err);
      showNotification(t("timeline.notifications.failedToDeleteEntries"), "error");
    }
  };

  const confirmDelete = (dates: string[]) => {
    setDeleteConfirm({ dates });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm(null);
  };

  const handleConfirmExecute = async () => {
    if (!deleteConfirm) return;
    const dates = deleteConfirm.dates;
    setDeleteConfirm(null);
    if (dates.length === 1) {
      await deleteEntry(dates[0]);
    } else {
      await deleteSelected();
    }
  };

  const toggleSelection = (date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
        if (next.size === 0) {
          setIsSelecting(false);
        }
      } else {
        next.add(date);
      }
      return next;
    });
  };

  return {
    isSelecting,
    setIsSelecting,
    selectedDates,
    setSelectedDates,
    deleteConfirm,
    confirmDelete,
    closeDeleteConfirm,
    handleConfirmExecute,
    handleExportSelected,
    toggleSelection,
  };
}
