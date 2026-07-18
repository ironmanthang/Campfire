import { Loader2, AlertCircle, Search as SearchIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SearchResult } from "../../types";
import { DragHandles } from "../../components/common";
import { SearchResultCard } from "../../components/search";
import { useSearchContext } from "./SearchContext";
import { useAppStore } from "../../store/useAppStore";
import { useSearchStore } from "../../store/useSearchStore";

interface SearchResultListProps {
  searching: boolean;
  searchResults: SearchResult[];
  toggleSelection: (date: string) => void;
  entryTagsMap: Record<string, string[]>;
  startDrag: (e: React.MouseEvent) => void;
  searchWidth: number;
}

export function SearchResultList({
  searching,
  searchResults,
  toggleSelection,
  entryTagsMap,
  startDrag,
  searchWidth,
}: SearchResultListProps) {
  const { t } = useTranslation();
  const { setCurrentDate, navigateToView } = useAppStore();
  const { searchQuery, handleTagClick } = useSearchStore();
  const {
    isSelecting,
    setIsSelecting,
    selectedDates,
    setSelectedDates,
    filteredResults,
    confirmDelete,
    clickMode,
  } = useSearchContext();

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="relative mx-auto w-full px-6 py-6 min-h-full flex flex-col"
        style={{ maxWidth: `${searchWidth}px` }}
      >
        <DragHandles startDrag={startDrag} />

        {searching ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-accent-brand" />
            <span className="text-xs text-text-secondary">{t("searchView.searching")}</span>
          </div>
        ) : searchResults.length > 0 ? (
          filteredResults.length > 0 ? (
            <div className="space-y-3.5 w-full">
              <p className="text-xs text-text-secondary mb-2">
                {t("searchView.matchesCount", { count: filteredResults.length })}
                {searchResults.length !== filteredResults.length && ` ${t("searchView.filteredFrom", { total: searchResults.length })}`}
              </p>
              {filteredResults.map((result, idx) => {
                const isSelected = selectedDates.has(result.date);
                return (
                  <SearchResultCard
                    key={`${result.date}-${result.line_number}-${idx}`}
                    result={result}
                    isSelecting={isSelecting}
                    isSelected={isSelected}
                    toggleSelection={toggleSelection}
                    setIsSelecting={setIsSelecting}
                    setSelectedDates={setSelectedDates}
                    setCurrentDate={setCurrentDate}
                    setView={navigateToView}
                    confirmDelete={confirmDelete}
                    entryTagsMap={entryTagsMap}
                    searchQuery={searchQuery}
                    handleTagClick={(tag) => handleTagClick(tag, navigateToView)}
                    clickMode={clickMode}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary text-center py-20">
              <AlertCircle className="h-8 w-8 text-border-brand mb-2" />
              <p className="text-sm font-semibold">{t("searchView.noMatchesRangeTitle")}</p>
              <p className="text-xs mt-1">{t("searchView.noMatchesRangeDesc")}</p>
            </div>
          )
        ) : searchQuery.trim() ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
            <AlertCircle className="h-8 w-8 text-border-brand mb-2" />
            <p className="text-sm">{t("searchView.noMatchesQuery", { query: searchQuery })}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary text-center">
            <SearchIcon className="h-10 w-10 text-border-brand mb-2" />
            <p className="text-sm">{t("searchView.enterQuery")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
