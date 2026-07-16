import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  BookOpen,
  Loader2,
  AlertCircle
} from "lucide-react";
import { JournalEntryMetadata } from "../types";
import { getLocalYYYYMMDD } from "../lib/dateUtils";
import { useResizer } from "../hooks/useResizer";
import { useEntrySelection } from "../hooks/useEntrySelection";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { useTranslation } from "react-i18next";
import { TimelineEntryCard } from "../components/TimelineEntryCard";
import { SidebarToggleButton } from "../components/SidebarToggleButton";
import { usePersistedState } from "../hooks/usePersistedState";
import { DateRangePicker } from "../components/common/DateRangePicker";
import { DragHandles } from "../components/common/DragHandles";
import { SelectionToolbar } from "../components/common/SelectionToolbar";
import { useAppStore } from "../store/useAppStore";
import { useSearchStore } from "../store/useSearchStore";

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
    sidebarCollapsed,
    toggleSidebar
  } = useAppStore();

  const { searchQuery, handleTagClick } = useSearchStore();

  const [filterStartDate, setFilterStartDate] = usePersistedState("timeline_filter_start", "2010-01-01");
  const [filterEndDate, setFilterEndDate] = usePersistedState("timeline_filter_end", getLocalYYYYMMDD);
  const [activePresetLabel, setActivePresetLabel] = usePersistedState("timeline_active_preset", "All");
  const [clickMode, setClickMode] = usePersistedState<"open" | "select">("timeline_click_mode", "open");

  const [timelineWidth, startDrag] = useResizer({
    key: "timeline_width",
    defaultVal: 768,
    mode: "px",
  });

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
    onDeleteSuccess: (dates) => {
      setTimelineEntries((prev) => prev.filter((e) => !dates.includes(e.date)));
    },
    showNotification,
    handleExport,
    handleSync,
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
  }, [config.journal_dir, journalRefreshKey]);

  const filteredEntries = useMemo(() => {
    return timelineEntries.filter((entry) => {
      if (filterStartDate && entry.date < filterStartDate) return false;
      if (filterEndDate && entry.date > filterEndDate) return false;
      return true;
    });
  }, [timelineEntries, filterStartDate, filterEndDate]);

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

  // Flatten grouped entries for flat rendering
  const flatTimelineElements = useMemo(() => {
    const elements: (
      | { type: "header"; label: string; count: number; dateKey: string }
      | { type: "entry"; entry: JournalEntryMetadata }
    )[] = [];

    for (const group of groupedEntries) {
      const dateKey = `header-${group.label}`;
      elements.push({ type: "header", label: group.label, count: group.entries.length, dateKey });
      for (const entry of group.entries) {
        elements.push({ type: "entry", entry });
      }
    }
    return elements;
  }, [groupedEntries]);

  // Sticky headers scroll handler
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
      <header className="min-h-[96px] py-4 px-6 border-b border-border-brand shrink-0 flex flex-wrap justify-between items-center bg-bg-surface/10 backdrop-blur-md select-none gap-4">
        {isSelecting ? (
          <SelectionToolbar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            selectedCountLabel={t("timeline.selectedCount", { selected: selectedDates.size, total: filteredEntries.length })}
            isAllSelected={selectedDates.size === filteredEntries.length}
            selectAllLabel={t("timeline.selectAll")}
            deselectAllLabel={t("timeline.deselectAll")}
            onSelectAllToggle={() => {
              if (selectedDates.size === filteredEntries.length) {
                setSelectedDates(new Set());
                setIsSelecting(false);
              } else {
                setSelectedDates(new Set(filteredEntries.map(e => e.date)));
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
            onCancel={() => {
              setIsSelecting(false);
              setSelectedDates(new Set());
            }}
            exportJsonLabel={t("timeline.exportJson")}
            exportTextLabel={t("timeline.exportText")}
            deleteSelectedLabel={t("timeline.deleteSelected")}
            cancelLabel={t("timeline.cancel")}
          />
        ) : (
          <>
            <div className="flex items-start gap-4">
              <SidebarToggleButton
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={toggleSidebar}
                className="mt-1"
              />
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{t("timeline.title")}</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {t("timeline.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-secondary bg-bg-surface/40 p-3 rounded-xl border border-border-brand/40">
              <DateRangePicker
                startDate={filterStartDate}
                endDate={filterEndDate}
                onStartChange={(val) => {
                  setFilterStartDate(val);
                  setActivePresetLabel("");
                }}
                onEndChange={(val) => {
                  setFilterEndDate(val);
                  setActivePresetLabel("");
                }}
                activePresetLabel={activePresetLabel}
                onPresetLabelChange={setActivePresetLabel}
              />

              <button
                onClick={() => {
                  setClickMode(clickMode === "open" ? "select" : "open");
                }}
                className="px-4 py-1.5 rounded-lg border border-border-brand hover:border-accent-brand text-text-primary hover:bg-bg-surface/50 text-sm font-medium transition-all duration-200 cursor-pointer ml-2 flex items-center gap-1.5 select-none"
                title={clickMode === "open" ? "Clicking card will open the editor" : "Clicking card will select the entry"}
              >
                {clickMode === "open" ? (
                  <>
                    <BookOpen className="h-4 w-4 text-accent-brand shrink-0" />
                    <span>Click to Open</span>
                  </>
                ) : (
                  <>
                    <input type="checkbox" checked disabled className="h-3.5 w-3.5 rounded border border-border-brand text-accent-brand bg-bg-input shrink-0 cursor-not-allowed pointer-events-none" />
                    <span>Click to Select</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto" onScroll={handleTimelineScroll}>
        {loadingTimeline ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-brand" />
            <p className="text-sm text-text-secondary">{t("timeline.scanning")}</p>
          </div>
        ) : timelineEntries.length > 0 ? (
          filteredEntries.length > 0 ? (
            <div
              className="relative mx-auto w-full px-6 py-6 space-y-6"
              style={{ maxWidth: `${timelineWidth}px` }}
            >
            <DragHandles startDrag={startDrag} />

            {/* Timeline vertical line running continuously behind everything */}
            <div className="absolute left-[24px] top-6 bottom-16 w-[1px] bg-border-brand/60" />

            {flatTimelineElements.map((el) => {
              if (el.type === "header") {
                return (
                  <h3
                    key={el.dateKey}
                    className="sticky top-0 z-10 bg-bg-app -mx-6 px-6 py-3 text-xs font-bold text-accent-brand border-b border-border-brand/40 uppercase tracking-wider font-mono select-none month-group-header transition-opacity duration-150"
                  >
                    {t("timeline.monthGroupHeader", { monthYear: el.label, count: el.count })}
                    {/* Hanging gradient mask to fade scrolling content smoothly */}
                    <div className="absolute top-full left-0 right-0 h-6 bg-gradient-to-b from-bg-app to-transparent pointer-events-none" />
                  </h3>
                );
              }

              const entry = el.entry;
              const isSelected = selectedDates.has(entry.date);
              return (
                <TimelineEntryCard
                  key={entry.date}
                  entry={entry}
                  isSelecting={isSelecting}
                  isSelected={isSelected}
                  toggleSelection={toggleSelection}
                  setIsSelecting={setIsSelecting}
                  setSelectedDates={setSelectedDates}
                  setCurrentDate={setCurrentDate}
                  navigateToView={navigateToView}
                  confirmDelete={confirmDelete}
                  searchQuery={searchQuery}
                  handleTagClick={handleTagClick}
                  clickMode={clickMode}
                />
              );
            })}

            {visibleCount < filteredEntries.length && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => setVisibleCount((v) => v + 50)}
                  className="px-5 py-2 rounded-lg border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary hover:bg-bg-surface/30 transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  {t("timeline.loadMore", { remaining: filteredEntries.length - visibleCount })}
                </button>
              </div>
            )}
          </div>
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
