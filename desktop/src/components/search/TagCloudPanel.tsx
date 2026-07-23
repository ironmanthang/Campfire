import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TagCloudPanelProps {
  searchMode: "keyword" | "semantic";
  allUniqueTags: string[];
  tagsCollapsed: boolean;
  setTagsCollapsed: (collapsed: boolean) => void;
  searchQuery: string;
  handleTagClick: (tag: string) => void;
}

export function TagCloudPanel({
  searchMode,
  allUniqueTags,
  tagsCollapsed,
  setTagsCollapsed,
  searchQuery,
  handleTagClick,
}: TagCloudPanelProps) {
  const { t } = useTranslation();

  if (searchMode !== "keyword" || allUniqueTags.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-center justify-between select-none">
        <button
          onClick={() => setTagsCollapsed(!tagsCollapsed)}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <span>{t("searchView.quickFilterTitle")}</span>
          <span className="text-xs bg-bg-app border border-border-brand/40 px-1.5 py-0.5 rounded-md text-text-secondary font-mono">
            {allUniqueTags.length}
          </span>
          {tagsCollapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-text-secondary" />
          )}
        </button>
      </div>

      {!tagsCollapsed && (
        <div className="flex flex-wrap gap-1.5 max-h-[96px] overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
          {allUniqueTags.map((tag) => {
            const isFilterActive = searchQuery.toLowerCase().split(/\s+/).includes(`#${tag.toLowerCase()}`);
            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer ${
                  isFilterActive
                    ? "bg-accent-brand text-bg-app border-accent-brand font-bold shadow-sm"
                    : "bg-bg-surface hover:bg-bg-surface/80 text-text-primary border-border-brand hover:border-accent-brand"
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
