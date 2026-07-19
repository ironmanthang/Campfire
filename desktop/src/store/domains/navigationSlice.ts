import { StateCreator } from "zustand";
import { ViewType } from "../../types";
import { AppState } from "../useAppStore";

export interface NavigationSlice {
  view: ViewType;
  history: ViewType[];
  historyIndex: number;

  navigateToView: (nextView: ViewType) => void;
  forceViewAndResetHistory: (nextView: ViewType) => void;
  goBack: () => void;
  goForward: () => void;
}

export const createNavigationSlice: StateCreator<
  AppState,
  [],
  [],
  NavigationSlice
> = (set, get) => ({
  view: "journal",
  history: ["journal"],
  historyIndex: 0,

  navigateToView: (nextView) => {
    const { view, historyIndex } = get();
    if (nextView === view) return;
    const nextHistory = get().history.slice(0, historyIndex + 1);
    nextHistory.push(nextView);
    set({ view: nextView, history: nextHistory, historyIndex: nextHistory.length - 1 });
  },

  forceViewAndResetHistory: (nextView) => {
    set({ view: nextView, history: [nextView], historyIndex: 0 });
  },

  goBack: () => {
    const { historyIndex, history } = get();
    const prevIndex = historyIndex - 1;
    if (prevIndex >= 0) set({ historyIndex: prevIndex, view: history[prevIndex] });
  },

  goForward: () => {
    const { historyIndex, history } = get();
    const nextIndex = historyIndex + 1;
    if (nextIndex < history.length) set({ historyIndex: nextIndex, view: history[nextIndex] });
  },
});
