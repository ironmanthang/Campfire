export interface SyncProgress {
  status: 'idle' | 'authenticating' | 'connecting' | 'syncing' | 'completed' | 'error';
  message: string;
  filesProcessed: number;
  totalFiles: number;
}

export type SyncCallback = (progress: SyncProgress) => void;

export interface SyncConfig {
  /** Label used in conflict blocks (e.g. "Desktop", "Mobile"). */
  conflictLabel: string;
}
