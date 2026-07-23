import { Search as SearchIcon, Sparkles, Loader2, Info, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SidebarToggleButton } from "../layout/SidebarToggleButton";
import { ModelSelector } from "../ai/ModelSelector";
import { DateRangePicker } from "../common/DateRangePicker";
import { SelectionToolbar } from "../common/SelectionToolbar";
import { TagCloudPanel } from "./TagCloudPanel";
import { useAppStore } from "../../store/useAppStore";
import { useOllamaStore } from "../../store/useOllamaStore";
import { useSearchStore } from "../../store/useSearchStore";
import { useSearchContext } from "../../views/search/SearchContext";

export function SearchHeader() {
  const { t } = useTranslation();

  const { sidebarCollapsed, toggleSidebar, navigateToView } = useAppStore();
  const { ollamaConnected, pinnedModels, togglePinModel } = useOllamaStore();
  const {
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    tagMode,
    setTagMode,
    handleTagClick
  } = useSearchStore();

  const {
    isSelecting,
    setIsSelecting,
    selectedDates,
    setSelectedDates,
    filteredResults,
    handleExportSelected,
    confirmDelete,
    setShowHelpModal,
    embeddingModel,
    setEmbeddingModel,
    embeddingModels,
    searchInputRef,
    searchStartDate,
    setSearchStartDate,
    searchEndDate,
    setSearchEndDate,
    activePresetLabel,
    setActivePresetLabel,
    searchResultsLength,
    allUniqueTags,
    tagsCollapsed,
    setTagsCollapsed,
    isIndexing,
    indexProgress,
    clickMode,
    setClickMode
  } = useSearchContext();

  return (
    <header className="relative z-20 p-6 border-b border-border-brand shrink-0 space-y-4 select-none min-h-[96px] bg-bg-surface/10 backdrop-blur-md">
      {isSelecting ? (
        <SelectionToolbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          selectedCountLabel={t("searchView.selectedCount", {
            selected: selectedDates.size,
            total: new Set(filteredResults.map((e) => e.date)).size,
          })}
          isAllSelected={selectedDates.size === new Set(filteredResults.map((e) => e.date)).size}
          selectAllLabel={t("searchView.selectAll")}
          deselectAllLabel={t("searchView.deselectAll")}
          onSelectAllToggle={() => {
            const uniqueDates = new Set(filteredResults.map((e) => e.date));
            if (selectedDates.size === uniqueDates.size) {
              setSelectedDates(new Set());
              setIsSelecting(false);
            } else {
              setSelectedDates(uniqueDates);
            }
          }}
          onExport={handleExportSelected}
          isExportDisabled={selectedDates.size === 0}
          onDelete={() => {
            if (selectedDates.size > 0) {
              confirmDelete(Array.from(selectedDates));
            }
          }}
          isDeleteDisabled={selectedDates.size === 0}
          onCancel={() => {
            setIsSelecting(false);
            setSelectedDates(new Set());
          }}
          exportJsonLabel={t("searchView.exportJson")}
          exportTextLabel={t("searchView.exportText")}
          deleteSelectedLabel={t("searchView.deleteSelected")}
          cancelLabel={t("searchView.cancel")}
        />
      ) : (
        <>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <SidebarToggleButton
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={toggleSidebar}
                className="mt-1"
              />
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{t("searchView.title")}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-sm text-text-secondary">{t("searchView.subtitle")}</p>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-text-secondary hover:text-accent-brand transition-colors p-0.5 rounded cursor-pointer flex items-center justify-center"
                    title={t("searchView.helpModalTooltip")}
                  >
                    <Info className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {searchMode === "semantic" && (
                <div className="flex items-center gap-2 text-xs text-text-secondary select-none">
                  <span className="font-medium">{t("searchView.modelLabel")}</span>
                  {embeddingModels.length > 0 ? (
                    <ModelSelector
                      selectedModel={embeddingModel}
                      onSelectModel={(name) => {
                        setEmbeddingModel(name);
                      }}
                      models={embeddingModels}
                      pinnedModels={pinnedModels}
                      onTogglePin={togglePinModel}
                    />
                  ) : (
                    <div className="text-xs text-red-500 font-semibold border border-red-500/25 bg-red-500/10 px-2 py-1 rounded">
                      {t("searchView.noEmbeddingModels")}
                    </div>
                  )}
                </div>
              )}

              <div className="flex rounded-lg bg-bg-app p-0.5 border border-border-brand select-none">
                <button
                  onClick={() => setSearchMode("keyword")}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    searchMode === "keyword"
                      ? "bg-accent-brand text-bg-app shadow-sm font-bold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {t("searchView.modeKeyword")}
                </button>
                <button
                  onClick={() => {
                    if (ollamaConnected) setSearchMode("semantic");
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={!ollamaConnected}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    searchMode === "semantic"
                      ? "bg-accent-brand text-bg-app shadow-sm font-bold"
                      : "text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                  title={
                    !ollamaConnected
                      ? t("sidebar.navChatTooltipDisconnected")
                      : t("searchView.ollamaTooltipSemantic")
                  }
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("searchView.modeSemantic")}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-text-secondary" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchMode === "keyword"
                    ? t("searchView.placeholderKeyword")
                    : t("searchView.placeholderSemantic")
                }
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-brand bg-bg-surface text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors"
              />
            </div>

            {/* Tag matching mode toggle */}
            {searchMode === "keyword" && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-bg-surface/40 px-2 py-1 rounded-xl border border-border-brand/40 shrink-0">
                <span className="text-xs uppercase text-text-secondary pl-1 pr-0.5 select-none">
                  {t("searchView.tagModeLabel")}
                </span>
                <div className="flex rounded-lg bg-bg-app p-0.5 border border-border-brand/60 select-none">
                  <button
                    onClick={() => setTagMode("and")}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      tagMode === "and"
                        ? "bg-accent-brand text-bg-app shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t("searchView.tagModeAnd")}
                  </button>
                  <button
                    onClick={() => setTagMode("or")}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      tagMode === "or"
                        ? "bg-accent-brand text-bg-app shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t("searchView.tagModeOr")}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs font-semibold text-text-secondary bg-bg-surface/40 px-3 py-1.5 rounded-xl border border-border-brand/40 shrink-0">
              <DateRangePicker
                startDate={searchStartDate}
                endDate={searchEndDate}
                onStartChange={(val) => {
                  setSearchStartDate(val);
                  setActivePresetLabel("");
                }}
                onEndChange={(val) => {
                  setSearchEndDate(val);
                  setActivePresetLabel("");
                }}
                activePresetLabel={activePresetLabel}
                onPresetLabelChange={setActivePresetLabel}
              />

              {searchResultsLength > 0 && (
                <button
                  onClick={() => {
                    setClickMode(clickMode === "open" ? "select" : "open");
                  }}
                  className="px-4 py-1.5 rounded-lg border border-border-brand hover:border-accent-brand text-text-primary hover:bg-bg-surface/50 text-sm font-medium transition-all duration-200 cursor-pointer ml-2 flex items-center gap-1.5 select-none"
                  title={clickMode === "open" ? "Clicking card will open the editor" : "Clicking card will select the entry"}
                >
                  {clickMode === "open" ? (
                    <>
                      <BookOpen className="h-4 w-4 text-accent-brand shrink-0" />
                      <span>Click to Open</span>
                    </>
                  ) : (
                    <>
                      <input type="checkbox" checked disabled className="h-3.5 w-3.5 rounded border border-border-brand text-accent-brand bg-bg-input shrink-0 cursor-not-allowed pointer-events-none" />
                      <span>Click to Select</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <TagCloudPanel
            searchMode={searchMode}
            allUniqueTags={allUniqueTags}
            tagsCollapsed={tagsCollapsed}
            setTagsCollapsed={setTagsCollapsed}
            searchQuery={searchQuery}
            handleTagClick={(tag) => handleTagClick(tag, navigateToView)}
          />
        </>
      )}

      {isIndexing && (
        <div className="flex items-center gap-2 text-xs text-accent-brand animate-pulse select-none">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{indexProgress || t("searchView.indexingProgressDefault")}</span>
        </div>
      )}
    </header>
  );
}
