import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type LocalJournalEntry } from '../../services/db';
import { Plus, Search, FileText, SlidersHorizontal, X, Heart } from 'lucide-react';
import { JournalListItem } from './JournalListItem';
import { FilterModal, type DateRangeFilter, type SortOrderFilter } from './FilterModal';
import { useDraggableButton } from '../../hooks/useDraggableButton';
import { DEFAULT_HEART_SIZE } from '../../constants/heart';

interface JournalListProps {
  entries: LocalJournalEntry[];
  onSelectEntry: (date: string) => void;
  onCreateToday: () => void;
  onDonateOpen: () => void;
  onStartHeartRain?: (durationMs?: number) => void;
}

export const JournalList: React.FC<JournalListProps> = ({
  entries,
  onSelectEntry,
  onCreateToday,
  onDonateOpen,
  onStartHeartRain,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('campfire_mobile_search_query') || '';
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const saved = localStorage.getItem('campfire_mobile_filter_dateRange');
    if (saved === '30d' || saved === '3m' || saved === 'year') {
      return saved;
    }
    return 'all';
  });
  const [sortOrder, setSortOrder] = useState<SortOrderFilter>(() => {
    const saved = localStorage.getItem('campfire_mobile_filter_sortOrder');
    if (saved === 'oldest') {
      return saved;
    }
    return 'newest';
  });

  // Heart Customization State
  const [showDonateHeart, setShowDonateHeart] = useState<boolean>(() => {
    return localStorage.getItem('campfire_mobile_show_donate_heart') !== 'false';
  });
  const [heartClickFalls, setHeartClickFalls] = useState<boolean>(() => {
    return localStorage.getItem('campfire_mobile_heart_click_falls') === 'true';
  });
  const [heartSize, setHeartSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('campfire_mobile_heart_size') || String(DEFAULT_HEART_SIZE), 10);
  });
  const [heartRainDuration, setHeartRainDuration] = useState<number>(() => {
    return parseInt(localStorage.getItem('campfire_mobile_heart_rain_duration') || '5', 10);
  });
  const [customImage, setCustomImage] = useState<string | null>(() => {
    return localStorage.getItem('campfire_mobile_heart_custom_image');
  });

  // Listen for config changes and resets
  useEffect(() => {
    const updateHeartConfig = () => {
      setShowDonateHeart(localStorage.getItem('campfire_mobile_show_donate_heart') !== 'false');
      setHeartClickFalls(localStorage.getItem('campfire_mobile_heart_click_falls') === 'true');
      setHeartSize(parseInt(localStorage.getItem('campfire_mobile_heart_size') || String(DEFAULT_HEART_SIZE), 10));
      setHeartRainDuration(parseInt(localStorage.getItem('campfire_mobile_heart_rain_duration') || '5', 10));
      setCustomImage(localStorage.getItem('campfire_mobile_heart_custom_image'));
    };

    window.addEventListener('heart-config-changed', updateHeartConfig);
    return () => window.removeEventListener('heart-config-changed', updateHeartConfig);
  }, []);

  const donateBtn = useDraggableButton({
    storageKey: 'campfire_mobile_donate_pos',
    defaultCorner: 'bottom-left',
    buttonWidth: heartSize,
    buttonHeight: heartSize,
    buffer: 20,
  });

  const addBtn = useDraggableButton({
    storageKey: 'campfire_mobile_add_pos',
    defaultCorner: 'bottom-right',
    buttonWidth: 56,
    buttonHeight: 56,
    buffer: 20,
  });

  // Listen for position reset event
  useEffect(() => {
    const handleReset = () => {
      donateBtn.resetPosition();
    };
    window.addEventListener('heart-reset', handleReset);
    return () => window.removeEventListener('heart-reset', handleReset);
  }, [donateBtn]);

  const setContainerRefs = (node: HTMLDivElement | null) => {
    donateBtn.containerRef.current = node;
    addBtn.containerRef.current = node;
  };

  useEffect(() => {
    localStorage.setItem('campfire_mobile_search_query', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('campfire_mobile_filter_dateRange', dateRange);
  }, [dateRange]);

  useEffect(() => {
    localStorage.setItem('campfire_mobile_filter_sortOrder', sortOrder);
  }, [sortOrder]);

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

  const handleHeartClick = () => {
    // DEBUG: visual toast on phone
    const _d = document.createElement('div');
    _d.textContent = `❤️ handleHeartClick: falls=${heartClickFalls} rain=${heartRainDuration}s hasRainFn=${!!onStartHeartRain}`;
    Object.assign(_d.style, {
      position: 'fixed', top: '40px', left: '8px', right: '8px',
      padding: '8px 12px', background: 'rgba(180,0,0,0.9)', color: '#fff',
      fontSize: '12px', fontFamily: 'monospace', borderRadius: '8px',
      zIndex: '9999', pointerEvents: 'none',
    });
    document.body.appendChild(_d);
    setTimeout(() => _d.remove(), 4000);

    if (heartClickFalls) {
      onStartHeartRain?.(heartRainDuration * 1000);
    } else {
      onDonateOpen();
    }
  };

  return (
    <div ref={setContainerRefs} className="flex-1 flex flex-col min-h-0 bg-bg-app relative overflow-hidden">
      {/* Search Bar & Filter */}
      <div className="px-4 py-3 bg-bg-surface border-b border-border-brand shrink-0 flex items-center gap-2 select-none">
        <div className="relative flex-1 flex items-center">
          <Search size={16} className="absolute left-3 text-text-secondary" />
          <input
            type="text"
            placeholder={t("journalList.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-border-brand bg-bg-input text-text-primary outline-none focus:border-accent-brand transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 rounded-lg hover:bg-bg-surface text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              title={t("journalList.clearSearchTooltip")}
            >
              <X size={14} />
            </button>
          )}
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
          sortedEntries.map((entry) => (
            <JournalListItem
              key={entry.date}
              entry={entry}
              onSelectEntry={onSelectEntry}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-secondary">
            <FileText size={48} className="text-border-brand mb-3" />
            <p className="text-sm font-medium">{t("journalList.emptyTitle")}</p>
            {(searchQuery || dateRange !== 'all') && <p className="text-xs mt-1">{t("journalList.emptyHint")}</p>}
          </div>
        )}
      </div>

      {/* Floating Donate Heart Button */}
      {showDonateHeart && (
        <button 
          {...donateBtn.bind}
          onClick={donateBtn.handleTap(handleHeartClick)}
          style={{
            left: donateBtn.position ? `${donateBtn.position.x}px` : undefined,
            top: donateBtn.position ? `${donateBtn.position.y}px` : undefined,
            width: `${heartSize}px`,
            height: `${heartSize}px`,
            touchAction: 'none',
            opacity: donateBtn.position ? 1 : 0,
          }}
          className={`absolute z-30 flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
            customImage
              ? ''
              : 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.65)] hover:drop-shadow-[0_0_18px_rgba(239,68,68,0.85)]'
          } ${
            donateBtn.isDragging || donateBtn.isInertia ? 'transition-none scale-110' : 'transition-all duration-300 ease-out hover:scale-110 active:scale-95'
          }`}
          title={t("header.donateTooltip")}
        >
          {customImage ? (
            <img
              src={customImage}
              alt=""
              draggable={false}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <Heart style={{ width: heartSize, height: heartSize }} className="fill-red-500 text-red-500 pointer-events-none animate-heartbeat" />
          )}
        </button>
      )}

      {/* Floating Action Button (Current Date / Add) */}
      <button 
        {...addBtn.bind}
        onClick={addBtn.handleTap(onCreateToday)}
        style={{
          left: addBtn.position ? `${addBtn.position.x}px` : undefined,
          top: addBtn.position ? `${addBtn.position.y}px` : undefined,
          width: '56px',
          height: '56px',
          touchAction: 'none',
          opacity: addBtn.position ? 1 : 0,
        }}
        className={`absolute z-30 w-[56px] h-[56px] rounded-full bg-accent-brand text-bg-app shadow-[0_0_16px] shadow-accent-brand/45 hover:shadow-[0_0_22px] hover:shadow-accent-brand/65 hover:bg-accent-brand-hover flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
          addBtn.isDragging || addBtn.isInertia ? 'transition-none scale-110' : 'transition-all duration-300 ease-out hover:scale-105 active:scale-95'
        }`}
      >

        <Plus size={26} className="pointer-events-none" />
      </button>

      {/* Filter Modal Sheet */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        dateRange={dateRange}
        sortOrder={sortOrder}
        onDateRangeChange={setDateRange}
        onSortOrderChange={setSortOrder}
        onReset={() => {
          setSearchQuery('');
          setDateRange('all');
          setSortOrder('newest');
        }}
      />
    </div>
  );
};

