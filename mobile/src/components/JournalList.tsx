import React, { useState } from 'react';
import { type LocalJournalEntry } from '../services/db';
import { Plus, Search, Calendar, FileText } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Format date cleanly
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
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
    return clean || 'Empty entry';
  };

  const getWordCount = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  // Filter entries based on search query (text content or tags)
  const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    // Support searching for tags specifically (e.g. "#ideas")
    if (query.startsWith('#')) {
      const tagQuery = query.substring(1);
      const tags = extractTags(entry.content).map(t => t.toLowerCase());
      return tags.some(t => t.includes(tagQuery));
    }
    
    return (
      entry.date.includes(query) ||
      entry.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-app relative">
      {/* Search Bar */}
      <div className="px-4 py-3 bg-bg-surface border-b border-border-brand shrink-0">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search diaries or tags (#work)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border-brand bg-bg-input text-text-primary outline-none focus:border-accent-brand transition-all"
          />
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 pb-24">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => {
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
                      <FileText size={10} /> {words} {words === 1 ? 'word' : 'words'}
                    </span>
                    {!entry.synced ? (
                      <span className="w-2 h-2 rounded-full bg-yellow-500" title="Unsynced edits" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-green-500/80" title="Synced" />
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
            <p className="text-sm font-medium">No journal entries found</p>
            {searchQuery && <p className="text-xs mt-1">Try clearing your search query</p>}
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
    </div>
  );
};
