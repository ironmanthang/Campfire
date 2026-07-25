import React from 'react';
import { useTranslation } from 'react-i18next';

export type DateRangeFilter = 'all' | '30d' | '3m' | 'year';
export type SortOrderFilter = 'newest' | 'oldest';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: DateRangeFilter;
  sortOrder: SortOrderFilter;
  onDateRangeChange: (val: DateRangeFilter) => void;
  onSortOrderChange: (val: SortOrderFilter) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  dateRange,
  sortOrder,
  onDateRangeChange,
  onSortOrderChange,
  onReset
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-brand rounded-2xl p-5 space-y-5 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2 border-b border-border-brand">
          <span className="font-bold text-text-primary text-base">{t("journalList.filterTitle")}</span>
          <button
            onClick={onReset}
            className="text-xs font-semibold text-accent-brand hover:underline cursor-pointer"
          >
            {t("journalList.filterReset")}
          </button>
        </div>

        {/* Date Range Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t("journalList.filterDateRangeLabel")}</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'all', label: t("journalList.filterDateAll") },
              { value: '30d', label: t("journalList.filterDate30d") },
              { value: '3m', label: t("journalList.filterDate3m") },
              { value: 'year', label: t("journalList.filterDateYear") }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onDateRangeChange(opt.value as DateRangeFilter)}
                className={`py-2 px-1 text-xs font-bold rounded-xl text-center border transition-all active:scale-95 cursor-pointer ${
                  dateRange === opt.value
                    ? 'bg-accent-brand text-bg-app border-accent-brand'
                    : 'bg-bg-input text-text-secondary border-border-brand hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Order Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t("journalList.filterSortLabel")}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'newest', label: t("journalList.filterSortNewest") },
              { value: 'oldest', label: t("journalList.filterSortOldest") }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortOrderChange(opt.value as SortOrderFilter)}
                className={`py-2 px-3 text-xs font-bold rounded-xl text-center border transition-all active:scale-95 cursor-pointer ${
                  sortOrder === opt.value
                    ? 'bg-accent-brand text-bg-app border-accent-brand'
                    : 'bg-bg-input text-text-secondary border-border-brand hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-accent-brand hover:bg-accent-brand-hover text-bg-app text-sm font-bold shadow-md shadow-accent-brand/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          {t("journalList.filterApply")}
        </button>
      </div>
    </div>
  );
};
