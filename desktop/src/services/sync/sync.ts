// Thin wrapper around the @campfire/core sync engine. The engine lives
// in core/src/sync.ts; this file just injects the desktop-specific
// adapter (TauriLocalStore wrapping the Rust journal commands) and pins
// the conflict label to 'Desktop'.

import {
  runSync as coreRunSync,
  type SyncCallback,
  type SyncProgress,
  type RunSyncResult,
} from '@campfire/core';
import { TauriLocalStore } from './tauriLocalStore';
import {
  getOrCreateFolderId,
  listDriveFiles,
  downloadFileContent,
  uploadFile,
  updateFileContent,
  deleteFile,
} from '../googleDrive';

export type { SyncProgress, RunSyncResult };

export async function runSync(
  journalDir: string,
  onProgress: SyncCallback
): Promise<RunSyncResult> {
  const drive = {
    getOrCreateFolderId,
    listDriveFiles,
    downloadFileContent,
    uploadFile,
    updateFileContent,
    deleteFile,
  };

  return coreRunSync(
    new TauriLocalStore(journalDir),
    drive,
    console, // log() falls through to console.log
    { conflictLabel: 'Desktop' },
    onProgress,
  );
}
