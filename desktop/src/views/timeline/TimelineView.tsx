import React, { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { JournalEntryMetadata } from "../../types";
import { useResizer } from "../../hooks/useResizer";
import { useEntrySelection } from "../../hooks/useEntrySelection";
import { DeleteConfirmModal } from "../../components/modals/data_management/DeleteConfirmModal";
import { usePersistedState } from "../../hooks/usePersistedState";
import { useEarliestEntryDate } from "../../hooks/useEarliestEntryDate";
import { useAppStore } from "../../store/useAppStore";
import { useSearchStore } from "../../store/useSearchStore";
import { useDateRangeFilter } from "../../hooks/useDateRangeFilter";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineEntryList } from "./TimelineEntryList";

import { SortOrder } from "../../components/common";

export function TimelineView() {
  const { t, i18n } = useTranslation();
  const [timelineEntries, setTimelineEntries] = useState<JournalEntryMetadata[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  const {
    config,
    journalRefreshKey,
    setCurrentDate,
    navigateToView,
    showNotification,
    handleExport,
    handleSync,
    isDriveConnected,
    sidebarCollapsed,
    toggleSidebar
  } = useAppStore();

  const { searchQuery, handleTagClick } = useSearchStore();

  const earliestDate = useEarliestEntryDate();
  const {
    startDate: filterStartDate,
    endDate: filterEndDate,
    activePresetLabel,
    onStartChange: onFilterStartChange,
    onEndChange: onFilterEndChange,
    onPresetLabelChange,
  } = useDateRangeFilter({
    keyPrefix: "timeline",
    earliestDate,
    defaultPreset: "All",
  });
  const [sortOrder, setSortOrder] = usePersistedState<SortOrder>("timeline_sort_order", "newest");
  const [clickMode, setClickMode] = usePersistedState<"open" | "select">("timeline_click_mode", "open");

  const [timelineWidth, startDrag] = useResizer({
    key: "timeline_width",
    defaultVal: 768,
    mode: "px",
  });

  // Mirror useJournalSave's gate so we don't surface a confusing "Connect
  // Google Drive" toast when the user deletes while disconnected.
  const shouldAutoSyncOnDelete =
    !!config.google_drive_auto_sync &&
    !!config.google_drive_client_id &&
    !!isDriveConnected;

  const {
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
  } = useEntrySelection({
    journalDir: config.journal_dir,
    onDeleteSuccess: (dates: string[]) => {
      setTimelineEntries((prev) => prev.filter((e) => !dates.includes(e.date)));
    },
    showNotification,
    handleExport,
    handleSync,
    shouldAutoSync: shouldAutoSyncOnDelete,
  });

  // Load Timeline
  const loadTimeline = async () => {
    if (!config.journal_dir) return;
    setLoadingTimeline(true);
    setVisibleCount(50);
    setIsSelecting(false);
    setSelectedDates(new Set());
    try {
      const list: JournalEntryMetadata[] = await invoke("list_entries", {
        dirPath: config.journal_dir
      });
      setTimelineEntries(list);
    } catch (err) {
      console.error(err);
      showNotification(t("timeline.failedToLoad"), "error");
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.journal_dir, journalRefreshKey]);

  const filteredEntries = useMemo(() => {
    const list = timelineEntries.filter((entry) => {
      if (filterStartDate && entry.date < filterStartDate) return false;
      if (filterEndDate && entry.date > filterEndDate) return false;
      return true;
    });
    return list.sort((a, b) => {
      return sortOrder === "newest"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
    });
  }, [timelineEntries, filterStartDate, filterEndDate, sortOrder]);

  // Derive grouped structure
  const groupedEntries = useMemo(() => {
    const sliced = filteredEntries.slice(0, visibleCount);
    const groups: { label: string; entries: JournalEntryMetadata[] }[] = [];
    let currentGroup: { label: string; entries: JournalEntryMetadata[] } | null = null;

    for (const entry of sliced) {
      const parts = entry.date.split("-");
      if (parts.length !== 3) continue;
      const [year, month] = parts;
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
      if (!currentGroup || currentGroup.label !== label) {
        currentGroup = { label, entries: [] };
        groups.push(currentGroup);
      }
      currentGroup.entries.push(entry);
    }
    return groups;
  }, [filteredEntries, visibleCount, i18n.language]);

  // Sticky-header fade: when the next month-header approaches the previous
  // sticky header, fade the previous header out so the new one slides under.
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const containerTop = container.getBoundingClientRect().top;
    const headers = container.querySelectorAll(".month-group-header");

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i] as HTMLElement;
      const rect = header.getBoundingClientRect();
      const distance = rect.top - containerTop;

      if (distance <= 0) {
        const nextHeader = headers[i + 1] as HTMLElement | undefined;
        if (nextHeader) {
          const nextRect = nextHeader.getBoundingClientRect();
          const nextDistance = nextRect.top - containerTop;

          if (nextDistance <= 80 && nextDistance > 0) {
            const opacity = nextDistance / 80;
            header.style.opacity = opacity.toString();
          } else if (nextDistance <= 0) {
            header.style.opacity = "0";
          } else {
            header.style.opacity = "1";
          }
        } else {
          header.style.opacity = "1";
        }
      } else {
        header.style.opacity = "1";
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-app">
      <TimelineHeader
        isSelecting={isSelecting}
        selectedCount={selectedDates.size}
        filteredTotal={filteredEntries.length}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        onSelectAllToggle={() => {
          if (selectedDates.size === filteredEntries.length) {
            setSelectedDates(new Set());
            setIsSelecting(false);
          } else {
            setSelectedDates(new Set(filteredEntries.map((e) => e.date)));
          }
        }}
        onExport={handleExportSelected}
        isExportDisabled={selectedDates.size === 0}
        onDelete={() => {
          if (selectedDates.size > 0) {
            confirmDelete(Array.from(selectedDates));
          }
        }}
        isDeleteDisabled={selectedDates.size === 0}
        onCancelSelection={() => {
          setIsSelecting(false);
          setSelectedDates(new Set());
        }}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        onFilterStartChange={onFilterStartChange}
        onFilterEndChange={onFilterEndChange}
        activePresetLabel={activePresetLabel}
        onPresetLabelChange={onPresetLabelChange}
        earliestDate={earliestDate}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        clickMode={clickMode}
        onClickModeToggle={() => {
          setClickMode(clickMode === "open" ? "select" : "open");
        }}
        selectedCountLabel={t("timeline.selectedCount", { selected: selectedDates.size, total: filteredEntries.length })}
        selectAllLabel={t("timeline.selectAll")}
        deselectAllLabel={t("timeline.deselectAll")}
        exportJsonLabel={t("timeline.exportJson")}
        exportTextLabel={t("timeline.exportText")}
        deleteSelectedLabel={t("timeline.deleteSelected")}
        cancelLabel={t("timeline.cancel")}
        titleLabel={t("timeline.title")}
        subtitleLabel={t("timeline.subtitle")}
        clickToOpenTooltip={t("common.clickToOpenTooltip")}
        clickToOpenLabel={t("common.clickToOpen")}
        clickToSelectTooltip={t("common.clickToSelectTooltip")}
        clickToSelectLabel={t("common.clickToSelect")}
      />

      <div className="flex-1 overflow-y-auto" onScroll={handleTimelineScroll}>
        {loadingTimeline ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-brand" />
            <p className="text-sm text-text-secondary">{t("timeline.scanning")}</p>
          </div>
        ) : timelineEntries.length > 0 ? (
          filteredEntries.length > 0 ? (
            <TimelineEntryList
              groups={groupedEntries}
              selectedDates={selectedDates}
              isSelecting={isSelecting}
              toggleSelection={toggleSelection}
              setIsSelecting={setIsSelecting}
              setSelectedDates={setSelectedDates}
              setCurrentDate={setCurrentDate}
              navigateToView={navigateToView}
              confirmDelete={confirmDelete}
              searchQuery={searchQuery}
              handleTagClick={(tag: string) => handleTagClick(tag, navigateToView)}
              clickMode={clickMode}
              visibleCount={visibleCount}
              filteredTotal={filteredEntries.length}
              timelineWidth={timelineWidth}
              startDrag={startDrag}
              onLoadMore={() => setVisibleCount((v) => v + 50)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary text-center py-20">
              <AlertCircle className="h-10 w-10 text-border-brand mb-2" />
              <p className="text-sm font-semibold">{t("timeline.noEntriesFound")}</p>
              <p className="text-xs mt-1">{t("timeline.adjustFilter")}</p>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary text-center">
            <BookOpen className="h-10 w-10 text-border-brand mb-2" />
            <p className="text-sm">{t("timeline.noJournalFiles")}</p>
            <p className="text-xs mt-1">{t("timeline.startWriting")}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          dates={deleteConfirm.dates}
          onCancel={closeDeleteConfirm}
          onConfirm={handleConfirmExecute}
        />
      )}
    </div>
  );
}
