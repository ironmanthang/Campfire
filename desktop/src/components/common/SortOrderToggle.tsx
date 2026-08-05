import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

export type SortOrder = "newest" | "oldest";

interface SortOrderToggleProps {
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  className?: string;
}

export function SortOrderToggle({
  sortOrder,
  onSortOrderChange,
  className = "",
}: SortOrderToggleProps) {
  const { t } = useTranslation();

  const handleToggle = () => {
    onSortOrderChange(sortOrder === "newest" ? "oldest" : "newest");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`px-3 py-1.5 rounded-lg border border-border-brand/60 hover:border-accent-brand text-text-primary hover:bg-bg-surface/50 text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 select-none ${className}`}
      title={t("common.sortOrder")}
    >
      <ArrowUpDown className="h-3.5 w-3.5 text-accent-brand shrink-0" />
      <span>{sortOrder === "newest" ? t("common.sortNewest") : t("common.sortOldest")}</span>
    </button>
  );
}
