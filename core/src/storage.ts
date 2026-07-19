export interface LocalEntry {
  date: string;          // YYYY-MM-DD
  content: string;
  lastModified: number;  // ms since UNIX epoch
  synced: boolean;
  baseContent?: string;  // common ancestor at last sync
}

export interface LocalStore {
  list(): Promise<LocalEntry[]>;
  get(date: string): Promise<LocalEntry | undefined>;
  put(entry: LocalEntry): Promise<void>;
  update(date: string, patch: Partial<LocalEntry>): Promise<void>;
  delete(date: string): Promise<void>;
  // Sync base sidecar (desktop: separate file; mobile: field on entry).
  // Hides that difference from the engine.
  readSyncBase(date: string): Promise<string>;
  writeSyncBase(date: string, content: string): Promise<void>;
  deleteSyncBase(date: string): Promise<void>;
}
