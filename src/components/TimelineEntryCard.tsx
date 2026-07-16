import { BookOpen, Trash2 } from "lucide-react";
import { JournalEntryMetadata, ViewType } from "../types";
import { formatToDDMMYY } from "../lib/dateUtils";
import { useTranslation } from "react-i18next";

interface TimelineEntryCardProps {
  entry: JournalEntryMetadata;
  isSelecting: boolean;
  isSelected: boolean;
  toggleSelection: (date: string) => void;
  setIsSelecting: (selecting: boolean) => void;
  setSelectedDates: (dates: Set<string>) => void;
  setCurrentDate: (date: string) => void;
  navigateToView: (view: ViewType) => void;
  confirmDelete: (dates: string[]) => void;
  searchQuery: string;
  handleTagClick: (tag: string, navigateToView: (view: ViewType) => void) => void;
  clickMode: "open" | "select";
}

export function TimelineEntryCard({
  entry,
  isSelecting,
  isSelected,
  toggleSelection,
  setIsSelecting,
  setSelectedDates,
  setCurrentDate,
  navigateToView,
  confirmDelete,
  searchQuery,
  handleTagClick,
  clickMode,
}: TimelineEntryCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="relative pl-6 group/card entry-card-wrapper"
      data-date={entry.date}
    >
      {/* Dot marker centered on vertical line */}
      <div className="absolute -left-[5px] top-5 h-2.5 w-2.5 rounded-full border border-accent-brand group-hover/card:bg-accent-brand group-hover/card:scale-110 transition-all duration-200" />

      {/* Card */}
      <div
        onClick={() => {
          if (isSelecting) {
            toggleSelection(entry.date);
          } else if (clickMode === "open") {
            setCurrentDate(entry.date);
            navigateToView("journal");
          } else {
            setIsSelecting(true);
            setSelectedDates(new Set([entry.date]));
          }
        }}
        className={`relative p-5 rounded-xl border transition-all duration-200 ${
          isSelecting && isSelected
            ? "border-accent-brand bg-accent-brand/5 shadow-sm"
            : "border-border-brand bg-bg-surface hover:border-accent-brand/60 hover:translate-x-0.5"
        } cursor-pointer`}
      >
        {/* Action or Checkbox */}
        <div className="absolute right-4 top-4" onClick={(e) => e.stopPropagation()}>
          {isSelecting ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {
                toggleSelection(entry.date);
              }}
              className="h-4 w-4 rounded border-border-brand text-accent-brand focus:ring-accent-brand/30 accent-accent-brand cursor-pointer"
            />
          ) : clickMode === "open" ? (
            <div className="flex flex-col items-center gap-1.5 opacity-20 group-hover/card:opacity-100 transition-opacity duration-200">
              <input
                type="checkbox"
                checked={false}
                onChange={() => {
                  setIsSelecting(true);
                  setSelectedDates(new Set([entry.date]));
                }}
                className="h-4 w-4 rounded border-border-brand text-accent-brand focus:ring-accent-brand/30 accent-accent-brand cursor-pointer shrink-0"
                title="Select entry"
              />
              <button
                onClick={() => {
                  confirmDelete([entry.date]);
                }}
                className="p-1 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-red-500/60 hover:text-red-500 transition-all duration-150 cursor-pointer"
                title={t("timeline.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1 opacity-20 group-hover/card:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => {
                  setCurrentDate(entry.date);
                  navigateToView("journal");
                }}
                className="p-1 rounded-md hover:bg-bg-app border border-transparent hover:border-border-brand/40 text-text-secondary hover:text-accent-brand transition-all duration-150 cursor-pointer"
                title={t("timeline.openEditor")}
              >
                <BookOpen className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  confirmDelete([entry.date]);
                }}
                className="p-1 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-red-500/60 hover:text-red-500 transition-all duration-150 cursor-pointer"
                title={t("timeline.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-2 pr-8">
          <span className="font-bold text-sm text-accent-brand font-mono">
            {formatToDDMMYY(entry.date)}
          </span>
          <span className="text-[10px] text-text-secondary">
            {t("timeline.wordCount", { count: entry.word_count })}
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 pr-8">
          {entry.preview || t("timeline.emptyEntry")}
        </p>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3.5">
            {entry.tags.map((tag) => {
              const isFilterActive = searchQuery
                .toLowerCase()
                .split(/\s+/)
                .includes(`#${tag.toLowerCase()}`);
              return (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTagClick(tag, navigateToView);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium select-none transition-colors border cursor-pointer ${
                    isFilterActive
                      ? "bg-accent-brand text-bg-app border-accent-brand font-bold"
                      : "bg-accent-brand/10 text-accent-brand border-transparent hover:bg-accent-brand/20"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
