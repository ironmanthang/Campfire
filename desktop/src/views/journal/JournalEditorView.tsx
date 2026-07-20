import { useJournalEditor } from "./useJournalEditor";
import { JournalEditorHeader } from "./JournalEditorHeader";
import { JournalEditorPane } from "./JournalEditorPane";
import { JournalPreviewPane } from "./JournalPreviewPane";
import { JournalEditorFooter } from "./JournalEditorFooter";

export function JournalEditorView() {
  const {
    config,
    currentDate,
    setCurrentDate,
    sidebarCollapsed,
    toggleSidebar,
    navigateToView,
    isDriveConnected,
    handleSync,
    syncProgress,
    handleTagClick,
    textareaRef,
    overlayRef,
    entryContent,
    showFindBar,
    findQuery,
    setFindQuery,
    findMatches,
    activeMatchIndex,
    handleFindNext,
    handleFindPrev,
    handleCloseFind,
    editorWidthPercent,
    startDrag,
    resetWidth,
    loadingEntry,
    isDirty,
    saveStatus,
    editorTags,
    saveEntryImmediate,
    handleTextChange,
    stepDate,
    highlightedText,
    initialSyncInProgress,
    resolveConflict,
  } = useJournalEditor();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <JournalEditorHeader
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        currentDate={currentDate}
        stepDate={stepDate}
        setCurrentDate={setCurrentDate}
        saveStatus={saveStatus}
        isDirty={isDirty}
        config={config}
        isDriveConnected={isDriveConnected}
        syncProgress={syncProgress}
        handleSync={handleSync}
        saveEntryImmediate={saveEntryImmediate}
        entryContent={entryContent}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <JournalEditorPane
          entryContent={entryContent}
          loadingEntry={loadingEntry}
          initialSyncInProgress={initialSyncInProgress}
          showFindBar={showFindBar}
          findQuery={findQuery}
          setFindQuery={setFindQuery}
          findMatches={findMatches}
          activeMatchIndex={activeMatchIndex}
          handleFindPrev={handleFindPrev}
          handleFindNext={handleFindNext}
          handleCloseFind={handleCloseFind}
          highlightedText={highlightedText}
          textareaRef={textareaRef}
          overlayRef={overlayRef}
          handleTextChange={handleTextChange}
          editorWidthPercent={editorWidthPercent}
          resolveConflict={resolveConflict}
        />

        {/* Drag Handle Divider */}
        <div
          className={`w-4 shrink-0 cursor-ew-resize hover:bg-accent-brand/5 z-30 group flex items-center justify-center select-none relative ${
            editorWidthPercent === 0
              ? "ml-0 mr-[-8px]"
              : editorWidthPercent === 100
              ? "mr-0 ml-[-8px]"
              : "-mx-2"
          }`}
          onMouseDown={startDrag}
          onDoubleClick={resetWidth}
        >
          {/* Visual border line */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-border-brand/60 group-hover:bg-accent-brand/40 transition-colors" />
          {/* Grabbable notch */}
          <div className="w-[2px] h-12 bg-border-brand/20 group-hover:bg-accent-brand/80 rounded transition-colors duration-150 z-10 sticky top-1/2 -translate-y-1/2" />
        </div>

        <JournalPreviewPane
          entryContent={entryContent}
          editorWidthPercent={editorWidthPercent}
        />
      </div>

      <JournalEditorFooter
        editorTags={editorTags}
        entryContent={entryContent}
        handleTagClick={handleTagClick}
        navigateToView={navigateToView}
      />
    </div>
  );
}
export default JournalEditorView;
