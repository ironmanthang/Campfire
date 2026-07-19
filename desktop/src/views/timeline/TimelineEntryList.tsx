import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { JournalEntryMetadata } from "../../types";
import { TimelineEntryCard } from "../../components/TimelineEntryCard";
import { DragHandles } from "../../components/common/DragHandles";

export type TimelineElement =
  | { type: "header"; label: string; count: number; dateKey: string }
  | { type: "entry"; entry: JournalEntryMetadata };

export interface TimelineEntryListProps {
  groups: { label: string; entries: JournalEntryMetadata[] }[];
  selectedDates: Set<string>;
  isSelecting: boolean;
  toggleSelection: (date: string) => void;
  setIsSelecting: (val: boolean) => void;
  setSelectedDates: (val: Set<string>) => void;
  setCurrentDate: (date: string) => void;
  navigateToView: (view: any) => void;
  confirmDelete: (dates: string[]) => void;
  searchQuery: string;
  handleTagClick: (tag: string) => void;
  clickMode: "open" | "select";
  visibleCount: number;
  filteredTotal: number;
  timelineWidth: number;
  startDrag: (e: React.MouseEvent) => void;
  onLoadMore: () => void;
}

export const TimelineEntryList: React.FC<TimelineEntryListProps> = ({
  groups,
  selectedDates,
  isSelecting,
  toggleSelection,
  setIsSelecting,
  setSelectedDates,
  setCurrentDate,
  navigateToView,
  confirmDelete,
  searchQuery,
  handleTagClick,
  clickMode,
  visibleCount,
  filteredTotal,
  timelineWidth,
  startDrag,
  onLoadMore,
}) => {
  const { t } = useTranslation();

  // Flatten grouped entries for flat rendering
  const flatTimelineElements = useMemo<TimelineElement[]>(() => {
    const elements: TimelineElement[] = [];
    for (const group of groups) {
      const dateKey = `header-${group.label}`;
      elements.push({ type: "header", label: group.label, count: group.entries.length, dateKey });
      for (const entry of group.entries) {
        elements.push({ type: "entry", entry });
      }
    }
    return elements;
  }, [groups]);

  return (
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

      {visibleCount < filteredTotal && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={onLoadMore}
            className="px-5 py-2 rounded-lg border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary hover:bg-bg-surface/30 transition-all cursor-pointer shadow-sm flex items-center gap-2"
          >
            {t("timeline.loadMore", { remaining: filteredTotal - visibleCount })}
          </button>
        </div>
      )}
    </div>
  );
};
