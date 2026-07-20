import { StateCreator } from "zustand";
import { getLocalYYYYMMDD } from "../../lib/dateUtils";
import { AppState } from "../useAppStore";

export interface NotificationMessage {
  text: string;
  type: "success" | "error";
}

export interface ImportReport {
  source_format: string;
  new_entries: string[];
  appended_entries: string[];
  skipped: { date: string; reason: string }[];
  errors: { date: string | null; message: string }[];
}

export interface UiSlice {
  // Notifications
  statusMessage: NotificationMessage | null;
  notificationTimeout: any;
  showNotification: (text: string, type: "success" | "error") => void;
  clearNotification: () => void;

  // Journal UI
  journalRefreshKey: number;
  triggerJournalRefresh: () => void;
  currentDate: string;
  setCurrentDate: (date: string) => void;

  importReport: ImportReport | null;
  setImportReport: (report: ImportReport | null) => void;

  // Layout
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const createUiSlice: StateCreator<
  AppState,
  [],
  [],
  UiSlice
> = (set, get) => ({
  statusMessage: null,
  notificationTimeout: null,

  showNotification: (text, type) => {
    const { notificationTimeout } = get();
    if (notificationTimeout) clearTimeout(notificationTimeout);
    set({ statusMessage: { text, type } });
    if (type === "success") {
      const timeout = setTimeout(() => {
        set({ statusMessage: null, notificationTimeout: null });
      }, 4000);
      set({ notificationTimeout: timeout });
    } else {
      set({ notificationTimeout: null });
    }
  },

  clearNotification: () => {
    const { notificationTimeout } = get();
    if (notificationTimeout) clearTimeout(notificationTimeout);
    set({ statusMessage: null, notificationTimeout: null });
  },

  journalRefreshKey: 0,
  triggerJournalRefresh: () => set((state) => ({ journalRefreshKey: state.journalRefreshKey + 1 })),

  importReport: null,
  setImportReport: (report) => set({ importReport: report }),

  currentDate: getLocalYYYYMMDD(),
  setCurrentDate: (date) => set({ currentDate: date }),

  sidebarCollapsed: localStorage.getItem("sidebar-collapsed") === "true",
  toggleSidebar: () => {
    const collapsed = !get().sidebarCollapsed;
    localStorage.setItem("sidebar-collapsed", String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },
});
