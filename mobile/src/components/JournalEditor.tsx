import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, Edit2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DatePicker } from './DatePicker';
import { hasConflictMarkers } from '../services/merge';

interface JournalEditorProps {
  date: string;
  initialContent: string;
  onSave: (content: string) => void;
  onBack: () => void;
  onDateChange: (newDate: string) => void;
  onResolveConflict: (choice: 'local' | 'remote' | 'both') => void;
  isLoading?: boolean;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({ 
  date, 
  initialContent, 
  onSave, 
  onBack,
  onDateChange,
  onResolveConflict,
  isLoading = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [words, setWords] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wasLoadingRef = useRef(isLoading);

  // If we just finished loading, reset content to the loaded initialContent
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      setContent(initialContent);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, initialContent]);

  // Reset content when switching to a different entry date
  useEffect(() => {
    if (!isLoading) {
      setContent(initialContent);
    }
  }, [date]);

  // Focus and place cursor at the end of the text on first mount per entry
  // date, and when toggling between Edit and Preview. We do NOT depend on
  // `content` here — otherwise every keystroke would re-focus the textarea
  // and re-place the caret at the end, fighting the user's typing.
  //
  // The placement is deferred via rAF + a small timeout because on Android
  // Chrome, `setSelectionRange` called synchronously inside a `useEffect`
  // is silently ignored: the soft keyboard / IME input session isn't
  // attached to the element yet, so the selection collapses to 0.
  useEffect(() => {
    if (isPreview || !textareaRef.current) return;
    let cancelled = false;
    let rafId = 0;
    let timerId = 0;
    const placeCaret = () => {
      if (cancelled || !textareaRef.current) return;
      const length = textareaRef.current.value.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(length, length);
    };
    rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      // Run on the next frame, then again after a small delay so the IME
      // has time to attach. ~60ms covers the typical Android IME delay.
      rafId = requestAnimationFrame(() => {
        placeCaret();
        timerId = window.setTimeout(placeCaret, 60);
      });
    });
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, [isPreview, date]);

  useEffect(() => {
    if (isLoading) return;

    // Calculate word count
    const trimmed = content.trim();
    if (!trimmed) {
      setWords(0);
    } else {
      setWords(trimmed.split(/\s+/).length);
    }
    
    // Save content to DB
    onSave(content);
  }, [content, isLoading]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-app">
      {/* Top status bar */}
      <div className="px-4 py-2 border-b border-border-brand bg-bg-surface flex justify-between text-xs font-semibold text-text-secondary shrink-0 select-none">
        <span>{words} {words === 1 ? 'word' : 'words'}</span>
      </div>

      {/* Conflict Resolution Banner */}
      {!isLoading && hasConflictMarkers(content) && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md flex flex-col gap-3 animate-fade-in select-none">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
              <AlertTriangle size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-primary">Sync Conflict Detected</span>
              <span className="text-[10px] text-text-secondary leading-normal">Keep your local version or overwrite with the cloud version to resolve this conflict.</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onResolveConflict("local")}
              className="py-2 px-1 rounded-xl bg-accent-brand text-bg-app text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center truncate"
              title="Keep My Version"
            >
              Keep Mine
            </button>
            <button
              onClick={() => onResolveConflict("remote")}
              className="py-2 px-1 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center truncate"
              title="Keep Cloud Version"
            >
              Keep Cloud
            </button>
            <button
              onClick={() => onResolveConflict("both")}
              className="py-2 px-1 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-[10px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center truncate"
              title="Keep Both Versions"
            >
              Keep Both
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {isPreview ? (
          /* Preview Panel */
          <div className="flex-1 overflow-y-auto px-5 py-4 markdown-preview text-text-primary">
            <h1 className="text-xl font-bold border-b border-border-brand pb-2 mb-4">{formatDate(date)}</h1>
            {content.trim() ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-text-secondary italic text-sm">Nothing written yet. Click 'Edit' to start writing.</p>
            )}
          </div>
        ) : (
          /* Textarea Input Panel */
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isLoading ? "Loading diary..." : `Write your diary for ${formatDate(date)}...\nUse #tags to categorize your thoughts.`}
              disabled={isLoading}
              className="flex-1 w-full bg-transparent text-text-primary resize-none outline-none text-base leading-relaxed placeholder:text-text-secondary/50 font-sans"
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
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleStepDate(-1)}
            className="p-1.5 hover:bg-bg-app rounded-xl transition-colors text-text-secondary cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <DatePicker value={date} onChange={onDateChange} />

          <button 
            onClick={() => handleStepDate(1)}
            className="p-1.5 hover:bg-bg-app rounded-xl transition-colors text-text-secondary cursor-pointer"
            title="Next Day"
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
              <span>Edit</span>
            </>
          ) : (
            <>
              <Eye size={13} />
              <span>Preview</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
