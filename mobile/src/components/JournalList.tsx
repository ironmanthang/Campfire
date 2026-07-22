import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type LocalJournalEntry } from '../services/db';
import { Plus, Search, Calendar, FileText, SlidersHorizontal } from 'lucide-react';

interface JournalListProps {
  entries: LocalJournalEntry[];
  onSelectEntry: (date: string) => void;
  onCreateToday: () => void;
}

export const JournalList: React.FC<JournalListProps> = ({
  entries,
  onSelectEntry,
  onCreateToday
}) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | '30d' | '3m' | 'year'>(() => {
    const saved = localStorage.getItem('campfire_mobile_filter_dateRange');
    if (saved === '30d' || saved === '3m' || saved === 'year') {
      return saved;
    }
    return 'all';
  });
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(() => {
    const saved = localStorage.getItem('campfire_mobile_filter_sortOrder');
    if (saved === 'oldest') {
      return saved;
    }
    return 'newest';
  });

  useEffect(() => {
    localStorage.setItem('campfire_mobile_filter_dateRange', dateRange);
  }, [dateRange]);

  useEffect(() => {
    localStorage.setItem('campfire_mobile_filter_sortOrder', sortOrder);
  }, [sortOrder]);

  // Format date cleanly
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Extract tags from journal content
  const extractTags = (content: string): string[] => {
    const tags: string[] = [];
    const words = content.split(/\s+/);
    for (const word of words) {
      if (word.startsWith('#') && word.length > 1) {
        const cleaned = word.replace(/[^a-zA-Z0-9-_]/g, '');
        if (cleaned && !tags.includes(cleaned)) {
          tags.push(cleaned);
        }
      }
    }
    return tags;
  };

  // Get preview snippet of content
  const getPreview = (content: string) => {
    const clean = content
      .replace(/[#*`_~\[\]]/g, '') // remove markdown symbols
      .replace(/\s+/g, ' ')
      .trim();
    if (clean.length > 90) {
      return clean.substring(0, 90) + '...';
    }
    return clean || t("journalList.emptyPreview");
  };

  const getWordCount = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  // Filter entries based on search query (text content or tags) and date range
  const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      // Support searching for tags specifically (e.g. "#ideas")
      if (query.startsWith('#')) {
        const tagQuery = query.substring(1);
        const tags = extractTags(entry.content).map(t => t.toLowerCase());
        if (!tags.some(t => t.includes(tagQuery))) return false;
      } else {
        const matches = (
          entry.date.includes(query) ||
          entry.content.toLowerCase().includes(query)
        );
        if (!matches) return false;
      }
    }
    
    // Filter by Date Range
    if (dateRange !== 'all') {
      const entryDateObj = new Date(entry.date);
      const entryTime = entryDateObj.getTime();
      if (isNaN(entryTime)) return true;
      
      const now = new Date();
      const diffTime = now.getTime() - entryTime;
      
      if (dateRange === '30d') {
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        if (diffTime > thirtyDaysMs) return false;
      } else if (dateRange === '3m') {
        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        if (diffTime > ninetyDaysMs) return false;
      } else if (dateRange === 'year') {
        if (entryDateObj.getFullYear() !== now.getFullYear()) return false;
      }
    }
    
    return true;
  });

  // Sort entries based on Sort Order
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    
    if (isNaN(timeA) || isNaN(timeB)) return 0;
    
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-app relative">
      {/* Search Bar & Filter */}
      <div className="px-4 py-3 bg-bg-surface border-b border-border-brand shrink-0 flex items-center gap-2 select-none">
        <div className="relative flex-1 flex items-center">
          <Search size={16} className="absolute left-3 text-text-secondary" />
          <input
            type="text"
            placeholder={t("journalList.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border-brand bg-bg-input text-text-primary outline-none focus:border-accent-brand transition-all"
          />
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`p-2 rounded-xl border transition-all active:scale-95 shrink-0 cursor-pointer ${
            dateRange !== 'all' || sortOrder !== 'newest'
              ? 'border-accent-brand bg-accent-brand/10 text-accent-brand font-bold'
              : 'border-border-brand bg-bg-input text-text-secondary hover:text-text-primary'
          }`}
          title={t("journalList.filterTooltip")}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 pb-24 select-none">
        {sortedEntries.length > 0 ? (
          sortedEntries.map((entry) => {
            const words = getWordCount(entry.content);
            const tags = extractTags(entry.content);
            
            return (
              <div 
                key={entry.date}
                onClick={() => onSelectEntry(entry.date)}
                className="p-4 rounded-2xl bg-bg-surface border border-border-brand hover:border-accent-brand/40 transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-text-primary font-bold text-sm">
                    <Calendar size={14} className="text-accent-brand shrink-0" />
                    <span>{formatDate(entry.date)}</span>
                  </div>
                  
                  {/* Sync status dot */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-text-secondary flex items-center gap-0.5">
                      <FileText size={10} /> {words === 1 ? t("journalList.wordCount", { count: words }) : t("journalList.wordCountPlural", { count: words })}
                    </span>
                    {!entry.synced ? (
                      <span className="w-2 h-2 rounded-full bg-yellow-500" title={t("journalList.unsyncedTooltip")} />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-green-500/80" title={t("journalList.syncedTooltip")} />
                    )}
                  </div>
                </div>

                <p className="text-text-secondary text-xs line-clamp-2 leading-relaxed mb-2">
                  {getPreview(entry.content)}
                </p>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent-brand/10 text-accent-brand border border-accent-brand/10"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-secondary">
            <FileText size={48} className="text-border-brand mb-3" />
            <p className="text-sm font-medium">{t("journalList.emptyTitle")}</p>
            {(searchQuery || dateRange !== 'all') && <p className="text-xs mt-1">{t("journalList.emptyHint")}</p>}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={onCreateToday}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent-brand text-bg-app shadow-lg shadow-accent-brand/35 hover:bg-accent-brand-hover hover:scale-105 flex items-center justify-center transition-all duration-200 active:scale-95"
      >
        <Plus size={26} />
      </button>

      {/* Filter Modal Sheet */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none" 
          onClick={() => setIsFilterOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-bg-surface border border-border-brand rounded-2xl p-5 space-y-5 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-border-brand">
              <span className="font-bold text-text-primary text-base">{t("journalList.filterTitle")}</span>
              <button
                onClick={() => {
                  setDateRange('all');
                  setSortOrder('newest');
                }}
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
                    onClick={() => setDateRange(opt.value as any)}
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
                    onClick={() => setSortOrder(opt.value as any)}
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
              onClick={() => setIsFilterOpen(false)}
              className="w-full py-3 rounded-2xl bg-accent-brand hover:bg-accent-brand-hover text-bg-app text-sm font-bold shadow-md shadow-accent-brand/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              {t("journalList.filterApply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
