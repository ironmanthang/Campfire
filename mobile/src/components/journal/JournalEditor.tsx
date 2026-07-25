import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Eye, Edit2, AlertTriangle, Undo2, Redo2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DatePicker } from '../common/DatePicker';
import { hasConflictMarkers } from '../../services/merge';

interface JournalEditorProps {
  date: string;
  content: string;
  onChange: (content: string) => void;
  onBack: () => void;
  onDateChange: (newDate: string) => void;
  onResolveConflict: (choice: 'local' | 'remote' | 'both') => void;
  isLoading?: boolean;
}

const MAX_HISTORY = 20;

export const JournalEditor: React.FC<JournalEditorProps> = ({
  date,
  content,
  onChange,
  onBack,
  onDateChange,
  onResolveConflict,
  isLoading = false
}) => {
  const { t, i18n } = useTranslation();
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Undo / Redo history state
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const lastSavedRef = useRef<string>(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset scroll position and clear history buffers when switching to a different entry date
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
    setPast([]);
    setFuture([]);
    lastSavedRef.current = content;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [date]);

  // Sync baseline snapshot when content loads asynchronously and history is empty
  useEffect(() => {
    if (past.length === 0 && future.length === 0 && !timerRef.current) {
      lastSavedRef.current = content;
    }
  }, [content]);

  // Clean up timer on unmount (e.g. going back to home screen)
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Reset scroll to top when entering edit mode from preview
  useEffect(() => {
    if (!isPreview && textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  }, [isPreview]);

  // Calculate word count
  const trimmed = content.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStepDate = (amount: number) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + amount);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  // Debounced snapshot recorder for typing pauses (700ms)
  const handleContentChange = (newVal: string) => {
    onChange(newVal);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (newVal !== lastSavedRef.current) {
        setPast((prevPast) => {
          if (prevPast.length > 0 && prevPast[prevPast.length - 1] === lastSavedRef.current) {
            return prevPast;
          }
          return [...prevPast, lastSavedRef.current].slice(-MAX_HISTORY);
        });
        setFuture([]);
        lastSavedRef.current = newVal;
      }
    }, 700);
  };

  const canUndo = past.length > 0 || (content !== lastSavedRef.current);
  const canRedo = future.length > 0;

  const handleUndo = () => {
    if (!canUndo) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (content !== lastSavedRef.current) {
      // Undo active uncommitted typing back to baseline
      const activeContent = content;
      const targetState = lastSavedRef.current;
      setFuture((prevFuture) => [activeContent, ...prevFuture].slice(0, MAX_HISTORY));
      onChange(targetState);
    } else if (past.length > 0) {
      // Pop previous snapshot from history
      const activeContent = content;
      const previousState = past[past.length - 1];
      setPast((prevPast) => prevPast.slice(0, -1));
      setFuture((prevFuture) => [activeContent, ...prevFuture].slice(0, MAX_HISTORY));
      lastSavedRef.current = previousState;
      onChange(previousState);
    }

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const nextState = future[0];
    const newFuture = future.slice(1);
    const activeContent = content;

    setPast((prevPast) => [...prevPast, activeContent].slice(-MAX_HISTORY));
    setFuture(newFuture);
    lastSavedRef.current = nextState;
    onChange(nextState);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-app">
      {/* Top status bar */}
      <div className="px-3 py-1.5 border-b border-border-brand bg-bg-surface flex items-center justify-between text-xs font-semibold text-text-secondary shrink-0 select-none">
        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={isPreview || isLoading || !canUndo}
          className="p-2 px-3 rounded-xl border border-border-brand/40 hover:border-accent-brand/50 hover:bg-bg-app hover:text-text-primary transition-all active:scale-95 disabled:opacity-25 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
          title={t("journalEditor.undoTooltip")}
          aria-label={t("journalEditor.undoTooltip")}
        >
          <Undo2 size={16} />
        </button>

        {/* Word count */}
        <span className="text-center font-medium">
          {words === 1 ? t("journalEditor.wordCount", { count: words }) : t("journalEditor.wordCountPlural", { count: words })}
        </span>

        {/* Redo button */}
        <button
          onClick={handleRedo}
          disabled={isPreview || isLoading || !canRedo}
          className="p-2 px-3 rounded-xl border border-border-brand/40 hover:border-accent-brand/50 hover:bg-bg-app hover:text-text-primary transition-all active:scale-95 disabled:opacity-25 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
          title={t("journalEditor.redoTooltip")}
          aria-label={t("journalEditor.redoTooltip")}
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Conflict Resolution Banner */}
      {!isLoading && hasConflictMarkers(content) && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md flex flex-col gap-3 animate-fade-in select-none">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
              <AlertTriangle size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-primary">{t("journalEditor.conflictTitle")}</span>
              <span className="text-[10px] text-text-secondary leading-normal">{t("journalEditor.conflictBody")}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onResolveConflict("local")}
              className="py-2 px-1 rounded-xl bg-accent-brand text-bg-app text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center truncate"
              title={t("journalEditor.conflictKeepMineTitle")}
            >
              {t("journalEditor.conflictKeepMine")}
            </button>
            <button
              onClick={() => onResolveConflict("remote")}
              className="py-2 px-1 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center truncate"
              title={t("journalEditor.conflictKeepCloudTitle")}
            >
              {t("journalEditor.conflictKeepCloud")}
            </button>
            <button
              onClick={() => onResolveConflict("both")}
              className="py-2 px-1 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center truncate"
              title={t("journalEditor.conflictKeepBothTitle")}
            >
              {t("journalEditor.conflictKeepBoth")}
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {isPreview ? (
          /* Preview Panel */
          <div 
            className="flex-1 overflow-y-auto px-5 py-4 markdown-preview text-text-primary"
            style={{ fontSize: 'var(--editor-font-size)' }}
          >
            <h1 className="text-xl font-bold border-b border-border-brand pb-2 mb-4">{formatDate(date)}</h1>
            {content.trim() ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-text-secondary italic text-sm">{t("journalEditor.previewEmpty")}</p>
            )}
          </div>
        ) : (
          /* Textarea Input Panel */
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={isLoading ? "" : t("journalEditor.placeholder", { date: formatDate(date) })}
              disabled={isLoading}
              style={{ fontSize: 'var(--editor-font-size)' }}
              className="flex-1 w-full bg-transparent text-text-primary resize-none outline-none leading-relaxed placeholder:text-text-secondary/50 font-sans"
            />
          </div>
        )}
      </div>

      {/* Bottom Sub-Header Banner */}
      <div className="px-4 py-2 bg-bg-surface border-t border-border-brand flex items-center justify-between shrink-0 select-none">
        <button
          onClick={onBack}
          className="flex items-center gap-1 -ml-2 text-sm font-semibold text-text-secondary hover:text-text-primary px-2 py-1.5 rounded-xl hover:bg-bg-app transition-colors"
        >
          <ChevronLeft size={20} />
          <span>{t("journalEditor.backButton")}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStepDate(-1)}
            className="p-1.5 hover:bg-bg-app rounded-xl transition-colors text-text-secondary cursor-pointer"
            title={t("journalEditor.previousDayTooltip")}
          >
            <ChevronLeft size={16} />
          </button>

          <DatePicker value={date} onChange={onDateChange} />

          <button
            onClick={() => handleStepDate(1)}
            className="p-1.5 hover:bg-bg-app rounded-xl transition-colors text-text-secondary cursor-pointer"
            title={t("journalEditor.nextDayTooltip")}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-1 text-xs font-semibold text-accent-brand border border-accent-brand/20 bg-accent-brand/5 hover:bg-accent-brand/10 px-3 py-1.5 rounded-xl transition-all"
        >
          {isPreview ? (
            <>
              <Edit2 size={13} />
              <span>{t("journalEditor.editButton")}</span>
            </>
          ) : (
            <>
              <Eye size={13} />
              <span>{t("journalEditor.previewButton")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

