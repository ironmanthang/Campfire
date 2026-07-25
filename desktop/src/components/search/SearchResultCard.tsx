import { BookOpen, Trash2 } from "lucide-react";
import { SearchResult } from "../../types";
import { formatToDDMMYY } from "../../lib/dateUtils";
import { useTranslation } from "react-i18next";

interface SearchResultCardProps {
  result: SearchResult;
  isSelecting: boolean;
  isSelected: boolean;
  toggleSelection: (date: string) => void;
  setIsSelecting: (selecting: boolean) => void;
  setSelectedDates: (dates: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setCurrentDate: (date: string) => void;
  setView: (view: "journal" | "timeline" | "search" | "chat" | "reflection" | "settings") => void;
  confirmDelete: (dates: string[]) => void;
  entryTagsMap: Record<string, string[]>;
  searchQuery: string;
  handleTagClick: (tag: string) => void;
  clickMode: "open" | "select";
}

export function SearchResultCard({
  result,
  isSelecting,
  isSelected,
  toggleSelection,
  setIsSelecting,
  setSelectedDates,
  setCurrentDate,
  setView,
  confirmDelete,
  entryTagsMap,
  searchQuery,
  handleTagClick,
  clickMode,
}: SearchResultCardProps) {
  const { t } = useTranslation();

  return (
    <div
      onClick={() => {
        if (isSelecting) {
          toggleSelection(result.date);
        } else if (clickMode === "open") {
          setCurrentDate(result.date);
          setView("journal");
        } else {
          setIsSelecting(true);
          setSelectedDates(new Set([result.date]));
        }
      }}
      className={`relative p-4 rounded-xl border transition-all duration-200 group/card ${
        isSelecting && isSelected
          ? "border-accent-brand bg-accent-brand/5 shadow-sm"
          : "border-border-brand bg-bg-surface hover:border-accent-brand hover:translate-x-0.5"
      } cursor-pointer`}
    >
      {/* Action or Checkbox */}
      <div className="absolute right-4 top-4" onClick={(e) => e.stopPropagation()}>
        {isSelecting ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {
              toggleSelection(result.date);
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
                setSelectedDates(new Set([result.date]));
              }}
              className="h-4 w-4 rounded border-border-brand text-accent-brand focus:ring-accent-brand/30 accent-accent-brand cursor-pointer shrink-0"
              title={t("searchView.selectEntry", "Select entry")}
            />
            <button
              onClick={() => {
                confirmDelete([result.date]);
              }}
              className="p-1 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-red-500/60 hover:text-red-500 transition-all duration-150 cursor-pointer"
              title={t("searchView.menuDelete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 opacity-20 group-hover/card:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => {
                setCurrentDate(result.date);
                setView("journal");
              }}
              className="p-1 rounded-md hover:bg-bg-app border border-transparent hover:border-border-brand/40 text-text-secondary hover:text-accent-brand transition-all duration-150 cursor-pointer"
              title={t("searchView.menuOpenEditor")}
            >
              <BookOpen className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                confirmDelete([result.date]);
              }}
              className="p-1 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-red-500/60 hover:text-red-500 transition-all duration-150 cursor-pointer"
              title={t("searchView.menuDelete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-1.5 text-xs pr-8">
        <span className="font-bold text-accent-brand font-mono">{formatToDDMMYY(result.date)}</span>
        <span className="text-text-secondary font-mono flex items-center gap-2">
          {t("searchView.lineLabel", { line: result.line_number })}
          {result.similarity !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-accent-brand/15 text-accent-brand text-xs font-bold">
              {t("searchView.matchPercentage", { percent: Math.round(result.similarity * 100) })}
            </span>
          )}
        </span>
      </div>
      <p className="text-xs text-text-primary bg-bg-app/40 p-2.5 rounded border border-border-brand/40 font-mono truncate pr-8">
        {result.snippet}
      </p>
      {entryTagsMap[result.date]?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {entryTagsMap[result.date].map((tag) => {
            const isFilterActive = searchQuery.toLowerCase().split(/\s+/).includes(`#${tag.toLowerCase()}`);
            return (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagClick(tag);
                }}
                className={`px-1.5 py-0.5 rounded text-xs font-medium select-none transition-colors border cursor-pointer ${
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
  );
}
