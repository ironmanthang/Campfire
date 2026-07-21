import { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useResizer } from "../../hooks/useResizer";
import { useEntrySelection } from "../../hooks/useEntrySelection";
import { DeleteConfirmModal } from "../../components/modals/data_management/DeleteConfirmModal";
import { SearchResult, EmbeddingCacheData, JournalEntryMetadata } from "../../types";
import {
  createEmptyCache,
  loadEmbeddingsCache,
  buildEmbeddingIndex,
  performSemanticSearch,
  isEmbeddingModel
} from "../../services/embeddings";
import { getLocalYYYYMMDD } from "../../lib/dateUtils";
import { useTranslation } from "react-i18next";
import { usePersistedState } from "../../hooks/usePersistedState";
import { useAutoFocus } from "../../hooks/useAutoFocus";
import { SearchHeader, SearchHelpModal } from "../../components/search";
import { useAppStore } from "../../store/useAppStore";
import { useOllamaStore } from "../../store/useOllamaStore";
import { useSearchStore } from "../../store/useSearchStore";
import { SearchContext, SearchContextType } from "./SearchContext";
import { SearchResultList } from "./SearchResultList";

export function SearchView() {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { config, showNotification, handleExport, handleSync, isDriveConnected } = useAppStore();
  const { ollamaConnected, modelsList } = useOllamaStore();
  const { searchQuery, searchMode, tagMode } = useSearchStore();

  const [searchWidth, startDrag] = useResizer({
    key: "search_width",
    defaultVal: 768,
    mode: "px",
  });

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [entryTagsMap, setEntryTagsMap] = useState<Record<string, string[]>>({});
  const [tagsCollapsed, setTagsCollapsed] = usePersistedState("search_tags_collapsed_persist", true);

  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    for (const tags of Object.values(entryTagsMap)) {
      for (const tag of tags) {
        tagsSet.add(tag);
      }
    }
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [entryTagsMap]);

  useEffect(() => {
    const loadTagsMap = async () => {
      if (!config.journal_dir) return;
      try {
        const list: JournalEntryMetadata[] = await invoke("list_entries", {
          dirPath: config.journal_dir
        });
        const map: Record<string, string[]> = {};
        for (const entry of list) {
          map[entry.date] = entry.tags;
        }
        setEntryTagsMap(map);
      } catch (err) {
        console.error("Failed to load tags map", err);
      }
    };

    loadTagsMap();
  }, [config.journal_dir]);

  // Mirror useJournalSave's gate so we don't surface a confusing "Connect
  // Google Drive" toast when the user deletes while disconnected.
  const shouldAutoSyncOnDelete =
    !!config.google_drive_auto_sync &&
    !!config.google_drive_client_id &&
    !!isDriveConnected;

  const {
    isSelecting,
    setIsSelecting,
    selectedDates,
    setSelectedDates,
    deleteConfirm,
    confirmDelete,
    closeDeleteConfirm,
    handleConfirmExecute,
    handleExportSelected,
    toggleSelection,
  } = useEntrySelection({
    journalDir: config.journal_dir,
    onDeleteSuccess: (dates) => {
      setSearchResults((prev) => prev.filter((r) => !dates.includes(r.date)));
    },
    showNotification,
    handleExport,
    handleSync,
    shouldAutoSync: shouldAutoSyncOnDelete,
  });

  const [searching, setSearching] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [embeddingModel, setEmbeddingModel] = usePersistedState("embedding_model", "nomic-embed-text");
  const [embeddingCache, setEmbeddingCache] = useState<EmbeddingCacheData>(() => createEmptyCache(embeddingModel));
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState("");

  const [searchStartDate, setSearchStartDate] = usePersistedState("search_filter_start", "2010-01-01");
  const [searchEndDate, setSearchEndDate] = usePersistedState("search_filter_end", getLocalYYYYMMDD);
  const [activePresetLabel, setActivePresetLabel] = usePersistedState("search_active_preset", "All");
  const [clickMode, setClickMode] = usePersistedState<"open" | "select">("search_click_mode", "open");

  useAutoFocus(searchInputRef, true, [searchStartDate, searchEndDate, searchMode, embeddingModel]);

  const embeddingModels = useMemo(() => {
    return modelsList.filter((m) => isEmbeddingModel(m.name, m.capabilities));
  }, [modelsList]);

  const filteredResults = useMemo(() => {
    return searchResults.filter((result) => {
      if (searchStartDate && result.date < searchStartDate) return false;
      if (searchEndDate && result.date > searchEndDate) return false;
      return true;
    });
  }, [searchResults, searchStartDate, searchEndDate]);

  // Unified flow to load and index the embedding cache, preventing race conditions
  useEffect(() => {
    if (!config.journal_dir) {
      setEmbeddingCache(createEmptyCache(embeddingModel));
      return;
    }

    let active = true;

    const loadAndIndex = async () => {
      setIsIndexing(true);
      try {
        const cache = await loadEmbeddingsCache(config.journal_dir, embeddingModel);
        if (!active) return;
        setEmbeddingCache(cache);

        if (searchMode === "semantic" && ollamaConnected) {
          const updatedCache = await buildEmbeddingIndex(
            config.journal_dir,
            cache,
            embeddingModel,
            (current, total) => {
              if (active) setIndexProgress(t("searchView.indexingProgress", { current, total }));
            }
          );
          if (active) {
            setEmbeddingCache(updatedCache);
            setIndexProgress("");
          }
        } else {
          if (active) setIndexProgress("");
        }
      } catch (err) {
        console.error("Indexing or cache load failed:", err);
        if (active) setIndexProgress("Indexing failed");
      } finally {
        if (active) setIsIndexing(false);
      }
    };

    loadAndIndex();

    return () => {
      active = false;
    };
  }, [searchMode, config.journal_dir, ollamaConnected, embeddingModel]);

  // Execute Search
  useEffect(() => {
    if (!config.journal_dir || !searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      setIsSelecting(false);
      setSelectedDates(new Set());
      return;
    }

    setSearching(true);
    setIsSelecting(false);
    setSelectedDates(new Set());
    const delayDebounceFn = setTimeout(async () => {
      try {
        if (searchMode === "keyword") {
          const results: SearchResult[] = await invoke("search_entries", {
            dirPath: config.journal_dir,
            query: searchQuery,
            tagMode
          });
          setSearchResults(results);
        } else {
          if (!ollamaConnected) {
            setSearchResults([]);
            return;
          }
          const lowerModel = embeddingModel.toLowerCase();
          let similarityThreshold = 0.30;

          if (lowerModel.includes("moe")) {
            similarityThreshold = 0.10;
          } else if (lowerModel.includes("gemma")) {
            similarityThreshold = 0.20;
          } else if (lowerModel.includes("qwen")) {
            similarityThreshold = 0.25;
          }

          const results = await performSemanticSearch(
            searchQuery,
            embeddingCache,
            embeddingModel,
            similarityThreshold,
            20
          );
          setSearchResults(results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchMode, tagMode, config.journal_dir, embeddingCache, ollamaConnected, embeddingModel]);

  const searchContextValue = useMemo<SearchContextType>(() => ({
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
    searchResultsLength: searchResults.length,
    allUniqueTags,
    tagsCollapsed,
    setTagsCollapsed,
    isIndexing,
    indexProgress,
    clickMode,
    setClickMode,
  }), [
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
    searchStartDate,
    setSearchStartDate,
    searchEndDate,
    setSearchEndDate,
    activePresetLabel,
    setActivePresetLabel,
    searchResults.length,
    allUniqueTags,
    tagsCollapsed,
    setTagsCollapsed,
    isIndexing,
    indexProgress,
    clickMode,
    setClickMode,
  ]);

  return (
    <SearchContext.Provider value={searchContextValue}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <SearchHeader />

        <SearchResultList
          searching={searching}
          searchResults={searchResults}
          toggleSelection={toggleSelection}
          entryTagsMap={entryTagsMap}
          startDrag={startDrag}
          searchWidth={searchWidth}
        />

        {showHelpModal && (
          <SearchHelpModal
            onClose={() => setShowHelpModal(false)}
            embeddingModel={embeddingModel}
          />
        )}

        {deleteConfirm && (
          <DeleteConfirmModal
            dates={deleteConfirm.dates}
            onCancel={closeDeleteConfirm}
            onConfirm={handleConfirmExecute}
          />
        )}
      </div>
    </SearchContext.Provider>
  );
}
