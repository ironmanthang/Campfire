import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, FileText } from 'lucide-react';
import { type LocalJournalEntry } from '../../services/db';

interface JournalListItemProps {
  entry: LocalJournalEntry;
  onSelectEntry: (date: string) => void;
}

export const JournalListItem: React.FC<JournalListItemProps> = ({
  entry,
  onSelectEntry
}) => {
  const { t, i18n } = useTranslation();

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

  const getPreview = (content: string) => {
    const clean = content
      .replace(/[#*`_~[\]]/g, '') // remove markdown symbols
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

  const words = getWordCount(entry.content);
  const tags = extractTags(entry.content);

  return (
    <div 
      onClick={() => onSelectEntry(entry.date)}
      className="p-4 rounded-2xl bg-bg-surface border border-border-brand hover:border-accent-brand/40 transition-all duration-200 cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-text-primary font-bold text-sm">
          <Calendar size={14} className="text-accent-brand shrink-0" />
          <span>{formatDate(entry.date)}</span>
        </div>
        
        {/* Sync status dot & word count */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-text-secondary flex items-center gap-0.5">
            <FileText size={10} /> {words === 1 ? t("journalList.wordCount", { count: words }) : t("journalList.wordCountPlural", { count: words })}
          </span>
          {!entry.synced ? (
            <span
              className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full"
              title={t("journalList.unsyncedTooltip")}
              aria-label={t("journalList.unsyncedTooltip")}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{t("journalList.unsyncedBadge", "Local")}</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full"
              title={t("journalList.syncedTooltip")}
              aria-label={t("journalList.syncedTooltip")}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{t("journalList.syncedBadge", "Synced")}</span>
            </span>
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
              className="text-xs font-semibold px-2 py-0.5 rounded-md bg-accent-brand/10 text-accent-brand border border-accent-brand/10"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
