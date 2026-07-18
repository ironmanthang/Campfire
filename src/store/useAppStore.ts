import { create } from "zustand";
import { createConfigSlice, ConfigSlice } from "./domains/configSlice";
import { createSyncSlice, SyncSlice } from "./domains/syncSlice";
import { createNavigationSlice, NavigationSlice } from "./domains/navigationSlice";
import { createUiSlice, UiSlice, NotificationMessage } from "./domains/uiSlice";

// Re-export shared types so consumers don't need to reach into domains/
export type { NotificationMessage };

export type AppState = ConfigSlice & SyncSlice & NavigationSlice & UiSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createConfigSlice(...a),
  ...createSyncSlice(...a),
  ...createNavigationSlice(...a),
  ...createUiSlice(...a),
}));
