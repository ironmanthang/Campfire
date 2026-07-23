import { StateCreator } from "zustand";
import { getLocalYYYYMMDD } from "../../lib/dateUtils";
import { AppState } from "../useAppStore";

// Single, module-level timer state for the "click rain" effect. Lives outside
// the store because (a) it never needs to trigger renders, (b) it must
// survive a `startHeartRain` call without becoming stale when the store
// updates, and (c) it must be globally cancelable from anywhere in the app.
let heartRainTimeout: ReturnType<typeof setTimeout> | null = null;
let heartRainStopTimeout: ReturnType<typeof setTimeout> | null = null;

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

export interface FallingHeart {
  id: number;
  x: number; // start horizontal position in px (viewport-relative)
  size: number; // px
  speed: number; // 1-10, used to pick a CSS animation duration
  durationMs: number; // resolved ms for this heart
  driftX: number; // px horizontal drift over the fall
  rotation: number; // deg end rotation
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

  // Falling hearts (transient, not persisted)
  hearts: FallingHeart[];
  fireHearts: (count: number) => void;
  removeHeart: (id: number) => void;

  /**
   * Spawn one heart at a time on a randomized 300–500 ms interval for
   * `durationMs`. Each call resets the timer, so clicking again within the
   * window extends the rain for another full `durationMs` from the latest
   * click. Calling with `durationMs <= 0` is a no-op (rain is one-shot per
   * session of clicks).
   */
  startHeartRain: (durationMs: number) => void;

  // Heart gate modal
  heartGateOpen: boolean;
  setHeartGateOpen: (open: boolean) => void;
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

  hearts: [],
  fireHearts: (count) => {
    const speedSetting = get().config?.heart_fall_speed ?? 5;
    const sizeSetting = get().config?.heart_size ?? 24;
    const max = 50;
    const current = get().hearts;
    const room = Math.max(0, max - current.length);
    const toAdd = Math.min(count, room);
    if (toAdd <= 0) return;
    const newHearts: FallingHeart[] = [];
    for (let i = 0; i < toAdd; i++) {
      // Speed 1 (slow) -> ~6s, Speed 10 (fast) -> ~1.2s
      const durationMs = Math.round(6000 - (speedSetting - 1) * (4800 / 9));
      const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
      newHearts.push({
        id: Date.now() + i + Math.floor(Math.random() * 1000),
        x: Math.random() * Math.max(0, vw - sizeSetting),
        size: sizeSetting,
        speed: speedSetting,
        durationMs,
        driftX: (Math.random() - 0.5) * 80,
        rotation: (Math.random() - 0.5) * 120,
      });
    }
    set({ hearts: [...current, ...newHearts] });
  },
  removeHeart: (id) => {
    set((state) => ({ hearts: state.hearts.filter((h) => h.id !== id) }));
  },

  startHeartRain: (durationMs) => {
    if (durationMs <= 0) return;

    // Each click resets the rain. Clear any pending spawn / stop timers and
    // re-schedule from this click, so the rain lasts `durationMs` past the
    // most recent click.
    if (heartRainTimeout) {
      clearTimeout(heartRainTimeout);
      heartRainTimeout = null;
    }
    if (heartRainStopTimeout) {
      clearTimeout(heartRainStopTimeout);
      heartRainStopTimeout = null;
    }

    const { fireHearts } = get();

    // Fire one immediately, then schedule the next one 300–500 ms later.
    fireHearts(1);
    const scheduleNext = () => {
      const delay = 300 + Math.floor(Math.random() * 201); // 300..500 ms
      heartRainTimeout = setTimeout(() => {
        heartRainTimeout = null;
        fireHearts(1);
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    // Stop the rain `durationMs` from now. If the user clicks again before
    // this fires, the early-clear above will cancel it and we'll reschedule.
    heartRainStopTimeout = setTimeout(() => {
      if (heartRainTimeout) {
        clearTimeout(heartRainTimeout);
        heartRainTimeout = null;
      }
      heartRainStopTimeout = null;
    }, durationMs);
  },

  heartGateOpen: false,
  setHeartGateOpen: (open) => set({ heartGateOpen: open }),
});
