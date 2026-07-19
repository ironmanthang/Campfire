// Thin wrapper around the @campfire/core sync engine. The engine lives
// in core/src/sync.ts; this file just injects the mobile-specific
// adapters (DexieLocalStore + the mobile googleDrive functions +
// localStorageLogger) and pins the conflict label to 'Mobile'.

import {
  runSync as coreRunSync,
  type SyncCallback,
  type SyncProgress,
  type RunSyncResult,
} from '@campfire/core';
import { DexieLocalStore } from './dexieLocalStore';
import { localStorageLogger } from './localStorageLogger';
import {
  getOrCreateFolderId,
  listDriveFiles,
  downloadFileContent,
  uploadFile,
  updateFileContent,
  deleteFile,
} from './googleDrive';

export type { SyncProgress, RunSyncResult };

export async function runSync(onProgress: SyncCallback): Promise<RunSyncResult> {
  const drive = {
    getOrCreateFolderId,
    listDriveFiles,
    downloadFileContent,
    uploadFile,
    updateFileContent,
    deleteFile,
  };

  return coreRunSync(
    new DexieLocalStore(),
    drive,
    localStorageLogger,
    { conflictLabel: 'Mobile' },
    onProgress,
  );
}
