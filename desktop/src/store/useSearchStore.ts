import { create } from "zustand";

interface SearchState {
  searchQuery: string;
  searchMode: "keyword" | "semantic";
  tagMode: "and" | "or";
  
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: "keyword" | "semantic") => void;
  setTagMode: (mode: "and" | "or") => void;
  handleTagClick: (tag: string, navigateToView: (view: any) => void) => void;
}

const toggleTagInQuery = (query: string, tag: string): string => {
  const tagWithHash = `#${tag}`;
  const words = query.split(/\s+/).filter(Boolean);
  const tagIndex = words.findIndex(w => w.toLowerCase() === tagWithHash.toLowerCase());
  
  if (tagIndex !== -1) {
    words.splice(tagIndex, 1);
  } else {
    words.push(tagWithHash);
  }
  
  return words.join(" ");
};

export const useSearchStore = create<SearchState>((set, get) => ({
  searchQuery: localStorage.getItem("search_query_persist") || "",
  searchMode: (localStorage.getItem("search_mode_persist") as "keyword" | "semantic") || "keyword",
  tagMode: (localStorage.getItem("search_tag_mode_persist") as "and" | "or") || "and",

  setSearchQuery: (query) => {
    localStorage.setItem("search_query_persist", query);
    set({ searchQuery: query });
  },

  setSearchMode: (mode) => {
    localStorage.setItem("search_mode_persist", mode);
    set({ searchMode: mode });
  },

  setTagMode: (mode) => {
    localStorage.setItem("search_tag_mode_persist", mode);
    set({ tagMode: mode });
  },

  handleTagClick: (tag, navigateToView) => {
    const { searchQuery } = get();
    const nextQuery = toggleTagInQuery(searchQuery, tag);
    localStorage.setItem("search_query_persist", nextQuery);
    localStorage.setItem("search_mode_persist", "keyword");
    
    set({
      searchQuery: nextQuery,
      searchMode: "keyword"
    });
    
    navigateToView("search");
  }
}));
