import React from "react";
import { X, CheckCircle, BookOpen } from "lucide-react";

interface SyncResultModalProps {
  updatedDates: string[];
  onClose: () => void;
  onSelectEntry?: (date: string) => void;
}

export const SyncResultModal: React.FC<SyncResultModalProps> = ({ updatedDates, onClose, onSelectEntry }) => {
  // Simple date formatter for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-fade-in">
      <div className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-accent-brand">
            <CheckCircle className="h-6 w-6 shrink-0" />
            <h3 className="text-lg font-bold text-text-primary">Sync Completed</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            The following diaries were updated/downloaded on this device:
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {updatedDates.map((date) => (
              <div 
                key={date} 
                className="flex items-center justify-between text-xs font-semibold pl-3 pr-2 py-1.5 bg-bg-app border border-border-brand/40 rounded-lg text-text-primary"
              >
                <span>{formatDate(date)} ({date})</span>
                {onSelectEntry && (
                  <button
                    onClick={() => {
                      onSelectEntry(date);
                    }}
                    className="p-1 rounded-md hover:bg-bg-surface border border-transparent hover:border-border-brand/40 text-text-secondary hover:text-accent-brand transition-all duration-150 cursor-pointer shrink-0"
                    title="Open entry"
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-accent-brand hover:bg-accent-brand-hover text-xs font-semibold text-bg-app shadow-sm transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
