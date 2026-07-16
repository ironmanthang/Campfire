import React, { useState, useEffect } from 'react';
import { ChevronLeft, Eye, Edit2, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface JournalEditorProps {
  date: string;
  initialContent: string;
  onSave: (content: string) => void;
  onBack: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({ 
  date, 
  initialContent, 
  onSave, 
  onBack 
}) => {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [words, setWords] = useState(0);

  // Reset content when switching to a different entry date
  useEffect(() => {
    setContent(initialContent);
  }, [date]);

  useEffect(() => {
    // Calculate word count
    const trimmed = content.trim();
    if (!trimmed) {
      setWords(0);
    } else {
      setWords(trimmed.split(/\s+/).length);
    }
    
    // Save content to DB
    onSave(content);
  }, [content]);

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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-app">
      {/* Sub-Header */}
      <div className="px-4 py-2 bg-bg-surface border-b border-border-brand flex items-center justify-between shrink-0 select-none">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 -ml-2 text-sm font-semibold text-text-secondary hover:text-text-primary px-2 py-1.5 rounded-xl hover:bg-bg-app transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
          <Calendar size={12} className="text-accent-brand" />
          {date}
        </span>

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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Write your diary for ${formatDate(date)}...\nUse #tags to categorize your thoughts.`}
              className="flex-1 w-full bg-transparent text-text-primary resize-none outline-none text-base leading-relaxed placeholder:text-text-secondary/50 font-sans"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="px-4 py-2 border-t border-border-brand bg-bg-surface flex justify-between text-xs font-semibold text-text-secondary shrink-0 select-none">
        <span>{words} {words === 1 ? 'word' : 'words'}</span>
        <span className="text-green-500/95 font-medium">Autosaved</span>
      </div>
    </div>
  );
};
