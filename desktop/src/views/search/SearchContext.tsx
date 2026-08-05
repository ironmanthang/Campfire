import { createContext, useContext } from "react";
import { SearchResult } from "../../types";
import { OllamaModelInfo } from "../../services/ollama";
import { SortOrder } from "../../components/common";

export interface SearchContextType {
  earliestDate: string;
  isSelecting: boolean;
  setIsSelecting: (selecting: boolean) => void;
  selectedDates: Set<string>;
  setSelectedDates: (dates: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  filteredResults: SearchResult[];
  handleExportSelected: (format: "json" | "text") => void;
  confirmDelete: (dates: string[]) => void;
  setShowHelpModal: (show: boolean) => void;
  embeddingModel: string;
  setEmbeddingModel: (model: string) => void;
  embeddingModels: OllamaModelInfo[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchStartDate: string;
  setSearchStartDate: (date: string) => void;
  searchEndDate: string;
  setSearchEndDate: (date: string) => void;
  activePresetLabel: string;
  setActivePresetLabel: (label: string) => void;
  sortOrder: SortOrder;
  setSortOrder: (val: SortOrder) => void;
  searchResultsLength: number;
  allUniqueTags: string[];
  tagsCollapsed: boolean;
  setTagsCollapsed: (collapsed: boolean) => void;
  isIndexing: boolean;
  indexProgress: string;
  clickMode: "open" | "select";
  setClickMode: (mode: "open" | "select") => void;
}

export const SearchContext = createContext<SearchContextType | null>(null);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }
  return context;
};
