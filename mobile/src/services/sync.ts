import { 
  db, 
  listLocalEntries,
  type LocalJournalEntry 
} from './db';
import { 
  getOrCreateFolderId, 
  listDriveFiles, 
  downloadFileContent, 
  uploadFile, 
  updateFileContent,
  deleteFile,
  type DriveFileInfo
} from './googleDrive';

import { buildConflictBlock, hasConflictMarkers } from './merge';

export interface SyncProgress {
  status: 'idle' | 'authenticating' | 'connecting' | 'syncing' | 'completed' | 'error';
  message: string;
  filesProcessed: number;
  totalFiles: number;
}

export type SyncCallback = (progress: SyncProgress) => void;

// Simple helper to parse Google Drive time to milliseconds
function parseDriveTime(timeStr: string): number {
  return new Date(timeStr).getTime();
}

function addSyncLog(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] ${message}`;
  console.log(logLine);
  
  try {
    const existing = localStorage.getItem('past_you_sync_logs');
    const logs = existing ? JSON.parse(existing) : [];
    logs.push(logLine);
    // Keep last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    localStorage.setItem('past_you_sync_logs', JSON.stringify(logs));
  } catch (e) {
    // fallback
  }
}

export async function runSync(
  onProgress: SyncCallback
): Promise<{ modifiedDates: string[]; conflictedDates: string[] }> {
  const modifiedDates: string[] = [];
  const conflictedDates: string[] = [];
  addSyncLog('--- Starting sync cycle ---');

  try {
    onProgress({ status: 'connecting', message: 'Connecting to Google Drive...', filesProcessed: 0, totalFiles: 0 });
    
    // 1. Get folder ID
    const folderId = await getOrCreateFolderId();
    addSyncLog(`CampfireJournal folder ID resolved: ${folderId}`);
    
    onProgress({ status: 'syncing', message: 'Fetching file lists...', filesProcessed: 0, totalFiles: 0 });
    
    // 2. Fetch lists from local and remote
    const localEntries = await listLocalEntries();
    const rawDriveFiles = await listDriveFiles(folderId);
    addSyncLog(`Fetched lists. Local: ${localEntries.length} entries, Remote: ${rawDriveFiles.length} files`);

    // Group drive files by date to find and resolve duplicates
    const filesByDate = new Map<string, DriveFileInfo[]>();
    for (const file of rawDriveFiles) {
      const date = file.name.replace('.md', '');
      if (!filesByDate.has(date)) {
        filesByDate.set(date, []);
      }
      filesByDate.get(date)!.push(file);
    }

    const driveFiles: DriveFileInfo[] = [];
    for (const [date, files] of filesByDate.entries()) {
      if (files.length > 1) {
        addSyncLog(`Duplicate files detected for date ${date}. Count: ${files.length}`);
        // Sort descending by modifiedTime (newest first)
        files.sort((a, b) => parseDriveTime(b.modifiedTime) - parseDriveTime(a.modifiedTime));
        // Keep the newest
        driveFiles.push(files[0]);
        // Delete older duplicates
        for (let i = 1; i < files.length; i++) {
          try {
            addSyncLog(`Deleting older duplicate file: ID ${files[i].id}, modified ${files[i].modifiedTime}`);
            await deleteFile(files[i].id);
          } catch (err) {
            console.error(`Failed to delete duplicate file ${files[i].id} for date ${date}:`, err);
            addSyncLog(`Error deleting duplicate ${files[i].id}: ${err}`);
          }
        }
      } else {
        driveFiles.push(files[0]);
      }
    }
    
    // Create maps for easy lookup
    const localMap = new Map<string, LocalJournalEntry>();
    for (const entry of localEntries) {
      localMap.set(entry.date, entry);
    }
    
    const driveMap = new Map<string, DriveFileInfo>();
    for (const file of driveFiles) {
      const date = file.name.replace('.md', '');
      driveMap.set(date, file);
    }
    
    // Collect all unique dates
    const allDates = new Set<string>([
      ...localMap.keys(),
      ...driveMap.keys()
    ]);
    
    const totalFiles = allDates.size;
    let filesProcessed = 0;
    
    onProgress({ 
      status: 'syncing', 
      message: `Syncing ${totalFiles} journal entries...`, 
      filesProcessed, 
      totalFiles 
    });
    
    for (const date of allDates) {
      const local = localMap.get(date);
      const remote = driveMap.get(date);
      const fileName = `${date}.md`;

      filesProcessed++;
      onProgress({
        status: 'syncing',
        message: `Processing ${date}...`,
        filesProcessed,
        totalFiles
      });

      // Skip dates that are still in conflict. The user must resolve the
      // conflict markers in the editor. Touching either side while in
      // this state would risk destroying data.
      if (local && hasConflictMarkers(local.content)) {
        addSyncLog(`Entry ${date}: Local is in conflict. Skipping sync; user must resolve.`);
        conflictedDates.push(date);
        continue;
      }

      if (local && !remote) {
        const baseContent = local.baseContent || '';
        if (baseContent.trim() !== '' && local.content === baseContent) {
          addSyncLog(`Entry ${date}: Deleted on remote and unmodified locally. Deleting local entry...`);
          await db.entries.delete(date);
          continue;
        }

        if (local.content.trim() === '') {
          addSyncLog(`Entry ${date}: Local is empty, remote doesn't exist. Deleting local entry...`);
          await db.entries.delete(date);
          continue;
        }
        addSyncLog(`Entry ${date}: Local exists, remote doesn't. Uploading...`);
        const uploadResult = await uploadFile(folderId, fileName, local.content);
        const remoteTime = parseDriveTime(uploadResult.modifiedTime);
        await db.entries.update(date, { 
          synced: true, 
          baseContent: local.content,
          lastModified: remoteTime 
        });
        addSyncLog(`Entry ${date}: Uploaded successfully.`);
      } 
      else if (!local && remote) {
        addSyncLog(`Entry ${date}: Remote exists, local doesn't. Downloading...`);
        const content = await downloadFileContent(remote.id);
        if (content.trim() === '') {
          addSyncLog(`Entry ${date}: Remote is empty. Deleting from Google Drive and local...`);
          await deleteFile(remote.id);
          await db.entries.delete(date);
          continue;
        }
        const driveTime = parseDriveTime(remote.modifiedTime);
        await db.entries.put({
          date,
          content,
          lastModified: driveTime,
          synced: true,
          baseContent: content
        });
        modifiedDates.push(date);
        addSyncLog(`Entry ${date}: Downloaded successfully. Local timestamp set to Drive modification time.`);
      } 
      else if (local && remote) {
        const localTime = local.lastModified;
        const remoteTime = parseDriveTime(remote.modifiedTime);
        const diff = Math.abs(localTime - remoteTime);
        const TIME_TOLERANCE = 5000; // 5 seconds

        addSyncLog(`Entry ${date}: Comparing timestamps. Local = ${new Date(localTime).toISOString()} (synced: ${local.synced}), Remote = ${new Date(remoteTime).toISOString()}, diff = ${diff}ms`);

        // Pre-read the base. We need it in both branches.
        const baseContent = local.baseContent || '';
        const localAgreesWithBase = local.content === baseContent;
        // mtime match + local agrees with base -> safe to skip the download
        const canSkipRemoteDownload = diff <= TIME_TOLERANCE && localAgreesWithBase;

        if (local.content.trim() === '') {
          addSyncLog(`Entry ${date}: Local content is empty. Cleaning up...`);
          await deleteFile(remote.id);
          await db.entries.delete(date);
          continue;
        }

        if (canSkipRemoteDownload) {
          addSyncLog(`Entry ${date}: In sync (mtime matches, local matches base).`);
          const updates: Partial<LocalJournalEntry> = {};
          if (!local.synced) {
            updates.synced = true;
          }
          if (baseContent !== local.content) {
            updates.baseContent = local.content;
          }
          if (Object.keys(updates).length > 0) {
            await db.entries.update(date, updates);
          }
        } else {
          // Need actual remote content to make a proper decision.
          const remoteContent = await downloadFileContent(remote.id);

          if (local.content === remoteContent) {
            addSyncLog(`Entry ${date}: Local and cloud agree. Aligning...`);
            const updates: Partial<LocalJournalEntry> = {};
            updates.lastModified = remoteTime;
            updates.synced = true;
            if (baseContent !== local.content) {
              updates.baseContent = local.content;
            }
            await db.entries.update(date, updates);
          } else if (localAgreesWithBase) {
            // Local matches the recorded base, but cloud differs.
            // Cloud is the only thing that changed -> safely download it.
            addSyncLog(`Entry ${date}: Only cloud changed. Downloading cloud...`);
            await db.entries.put({
              date,
              content: remoteContent,
              lastModified: remoteTime,
              synced: true,
              baseContent: remoteContent
            });
            modifiedDates.push(date);
          } else if (remoteContent === baseContent) {
            // Cloud matches the recorded base, but local differs.
            // Only the local was edited -> safely upload the local to the cloud.
            addSyncLog(`Entry ${date}: Only local changed. Uploading local...`);
            const updateResult = await updateFileContent(remote.id, local.content);
            const newRemoteTime = parseDriveTime(updateResult.modifiedTime);
            await db.entries.update(date, {
              synced: true,
              baseContent: local.content,
              lastModified: newRemoteTime
            });
            modifiedDates.push(date);
          } else {
            // Both local and cloud differ from the base AND from each other.
            // Cannot determine which side is "right" -> surface the conflict
            // to the user. Write a conflict block to the local file (so the
            // user sees both versions in the editor) and leave the cloud
            // untouched. The base is also left intact, so a future sync can
            // do a real 3-way merge after the user resolves.
            addSyncLog(`Entry ${date}: CONFLICT - local and cloud disagree. Writing conflict block to local.`);
            const localLabel = `Mobile - ${new Date(localTime).toLocaleString()}`;
            const remoteLabel = `Cloud - ${new Date(remoteTime).toLocaleString()}`;
            const conflictBlock = buildConflictBlock(local.content, remoteContent, localLabel, remoteLabel);
            await db.entries.put({
              date,
              content: conflictBlock,
              lastModified: remoteTime,
              synced: false,
              baseContent: baseContent, // keep base intact
            });
            conflictedDates.push(date);
            addSyncLog(`Entry ${date}: Conflict written. Cloud preserved.`);
          }
        }
      }
    }
    
    // Save last synced timestamp
    localStorage.setItem('past_you_last_sync_time', Date.now().toString());
    
    onProgress({ 
      status: 'completed', 
      message: 'Sync completed successfully!', 
      filesProcessed: totalFiles, 
      totalFiles 
    });

    addSyncLog(`--- Sync completed. Updated dates: [${modifiedDates.join(', ')}], Conflicted dates: [${conflictedDates.join(', ')}] ---`);
    return { modifiedDates, conflictedDates };
  } catch (error: any) {
    console.error('Sync failed:', error);
    addSyncLog(`Sync failed with error: ${error.message || error}`);
    onProgress({ 
      status: 'error', 
      message: error.message || 'An error occurred during synchronization.', 
      filesProcessed: 0, 
      totalFiles: 0 
    });
    throw error;
  }
}


