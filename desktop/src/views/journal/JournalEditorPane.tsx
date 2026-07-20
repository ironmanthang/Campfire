import React from "react";
import { Loader2, ChevronLeft, ChevronRight, X, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { hasConflictMarkers } from "../../services/sync/merge";

interface JournalEditorPaneProps {
  entryContent: string;
  loadingEntry: boolean;
  showFindBar: boolean;
  findQuery: string;
  setFindQuery: (query: string) => void;
  findMatches: { start: number; end: number }[];
  activeMatchIndex: number;
  handleFindPrev: () => void;
  handleFindNext: () => void;
  handleCloseFind: () => void;
  highlightedText: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  handleTextChange: (text: string) => void;
  editorWidthPercent: number;
  initialSyncInProgress: boolean;
  resolveConflict: (choice: "local" | "remote" | "both") => Promise<void>;
}

export function JournalEditorPane({
  entryContent,
  loadingEntry,
  showFindBar,
  findQuery,
  setFindQuery,
  findMatches,
  activeMatchIndex,
  handleFindPrev,
  handleFindNext,
  handleCloseFind,
  highlightedText,
  textareaRef,
  overlayRef,
  handleTextChange,
  editorWidthPercent,
  initialSyncInProgress,
  resolveConflict,
}: JournalEditorPaneProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col h-full pr-3 overflow-hidden"
      style={{
        width: `${editorWidthPercent}%`,
        display: editorWidthPercent === 0 ? "none" : "flex",
      }}
    >
      {showFindBar && (
        <div className="w-full bg-bg-surface/60 border-b border-border-brand/80 flex items-center justify-between p-2 shrink-0 gap-2 animate-fade-in select-none">
          <div className="flex items-center gap-2 flex-1">
            <input
              id="editor-find-input"
              type="text"
              placeholder={t("journalEditor.findPlaceholder", "Find in entry...")}
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) {
                    handleFindPrev();
                  } else {
                    handleFindNext();
                  }
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  handleCloseFind();
                }
              }}
              className="px-2.5 py-1 text-xs bg-bg-input border border-border-brand/80 rounded-lg focus:outline-none focus:border-accent-brand text-text-primary w-48 font-sans"
            />
            <span className="text-[10px] text-text-secondary font-mono px-1 select-none min-w-[32px]">
              {findMatches.length > 0 ? `${activeMatchIndex + 1}/${findMatches.length}` : "0/0"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleFindPrev}
              disabled={findMatches.length === 0}
              className="p-1 hover:bg-bg-app/80 rounded-lg transition-colors text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer"
              title="Previous Match (Shift+F3 / Shift+Ctrl+G)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleFindNext}
              disabled={findMatches.length === 0}
              className="p-1 hover:bg-bg-app/80 rounded-lg transition-colors text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer"
              title="Next Match (F3 / Ctrl+G)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="w-[1px] h-4 bg-border-brand/60 mx-1" />
            <button
              type="button"
              onClick={handleCloseFind}
              className="p-1 hover:bg-bg-app/80 rounded-lg transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {loadingEntry || initialSyncInProgress ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent-brand" />
          <span className="text-xs text-text-secondary">
            {initialSyncInProgress ? "Syncing with cloud memory..." : t("journalEditor.loadingFlatFile")}
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden w-full h-full">
          {hasConflictMarkers(entryContent) && (
            <div className="mx-6 mt-4 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md flex flex-col gap-4 animate-fade-in select-none">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary">Sync Conflict Detected</span>
                  <span className="text-xs text-text-secondary">Keep your version or overwrite with the cloud version to resolve:</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-12 flex-wrap">
                <button
                  type="button"
                  onClick={() => resolveConflict("local")}
                  className="px-3.5 py-1.5 rounded-xl bg-accent-brand text-bg-app hover:bg-accent-brand-hover text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Keep My Version
                </button>
                <button
                  type="button"
                  onClick={() => resolveConflict("remote")}
                  className="px-3.5 py-1.5 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Keep Cloud Version
                </button>
                <button
                  type="button"
                  onClick={() => resolveConflict("both")}
                  className="px-3.5 py-1.5 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Keep Both
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 w-full relative overflow-hidden mt-2">
            {/* Highlight Overlay */}
            <div
            ref={overlayRef}
            className="absolute inset-0 w-full h-full p-6 pointer-events-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-transparent border-none select-none overlay-scroll-container"
            style={{
              color: "transparent",
              backgroundColor: "transparent",
            }}
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
          <textarea
            ref={textareaRef}
            value={entryContent}
            onChange={(e) => handleTextChange(e.target.value)}
            onScroll={(e) => {
              if (overlayRef.current) {
                overlayRef.current.scrollTop = e.currentTarget.scrollTop;
                overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            onKeyDown={(e) => {
              if (showFindBar) {
                if (e.key === "F3") {
                  e.preventDefault();
                  if (e.shiftKey) {
                    handleFindPrev();
                  } else {
                    handleFindNext();
                  }
                }
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
                  e.preventDefault();
                  if (e.shiftKey) {
                    handleFindPrev();
                  } else {
                    handleFindNext();
                  }
                }
              }
            }}
            placeholder={t("journalEditor.editorPlaceholder")}
            className="absolute inset-0 w-full h-full p-6 bg-transparent text-text-primary text-sm leading-relaxed border-none focus:outline-none resize-none font-mono overflow-y-auto scrollbar-thin"
          />
        </div>
      </div>
      )}
    </div>
  );
}
