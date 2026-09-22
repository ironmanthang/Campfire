import React from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ScratchpadSearchBarProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchFilter: string;
  setSearchFilter: (value: string) => void;
  onClose: () => void;
  matchedCount: number;
}

export function ScratchpadSearchBar({
  searchInputRef,
  searchFilter,
  setSearchFilter,
  onClose,
  matchedCount,
}: ScratchpadSearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-accent-brand/40 rounded-2xl shadow-xs animate-fade-in">
      <Search className="h-4 w-4 text-accent-brand shrink-0" />
      <input
        ref={searchInputRef}
        type="text"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (searchFilter) {
              setSearchFilter("");
            } else {
              onClose();
            }
          }
        }}
        placeholder={t("scratchpad.searchPlaceholder", "Filter notes...")}
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
      />
      {searchFilter.trim() && (
        <span className="text-xs text-text-secondary font-mono px-2 py-0.5 rounded-md bg-bg-app border border-border-brand/40 select-none">
          {t("scratchpad.searchMatches", "{{count}} matches", { count: matchedCount })}
        </span>
      )}
      <button
        type="button"
        onClick={() => {
          setSearchFilter("");
          onClose();
        }}
        className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/50 transition-colors cursor-pointer"
        title={t("common.close", "Close")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
