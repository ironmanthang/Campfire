import { invoke } from '@tauri-apps/api/core';
import { 
  getOrCreateFolderId, 
  listDriveFiles, 
  downloadFileContent, 
  uploadFile, 
  updateFileContent,
  deleteFile,
  type DriveFileInfo 
} from '../googleDrive';
import { buildConflictBlock, hasConflictMarkers } from '../merge';

export interface SyncProgress {
  status: 'idle' | 'authenticating' | 'connecting' | 'syncing' | 'completed' | 'error';
  message: string;
  filesProcessed: number;
  totalFiles: number;
}

export type SyncCallback = (progress: SyncProgress) => void;

interface LocalEntrySyncInfo {
  date: string;
  content: string;
  last_modified: number; // ms since UNIX epoch
}

function parseDriveTime(timeStr: string): number {
  return new Date(timeStr).getTime();
}

export async function runSync(
  journalDir: string,
  onProgress: SyncCallback
): Promise<{ modifiedDates: string[]; conflictedDates: string[] }> {
  if (!journalDir) {
    throw new Error('Journal storage directory is not configured.');
  }

  const downloadedDates: string[] = []; // cloud → local (user must be notified)
  const conflictedDates: string[] = [];
  console.log(`[Sync] Starting desktop sync for folder: ${journalDir}`);

  try {
    onProgress({ status: 'connecting', message: 'Connecting to Google Drive...', filesProcessed: 0, totalFiles: 0 });

    const folderId = await getOrCreateFolderId();
    console.log(`[Sync] Google Drive folder ID resolved: ${folderId}`);

    onProgress({ status: 'syncing', message: 'Fetching file lists...', filesProcessed: 0, totalFiles: 0 });

    // Fetch local and remote files
    const localEntries = await invoke<LocalEntrySyncInfo[]>('list_local_entries_for_sync', { dirPath: journalDir });
    const rawDriveFiles = await listDriveFiles(folderId);
    console.log(`[Sync] Fetched lists. Local: ${localEntries.length} entries, Remote: ${rawDriveFiles.length} files`);

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
        console.log(`[Sync] Duplicate files detected on Drive for date ${date}. Count: ${files.length}`);
        const isNativeBlob = (f: DriveFileInfo) =>
          !f.mimeType?.startsWith('application/vnd.google-apps.');

        const nativeFiles = files.filter(isNativeBlob);
        const googleDocFiles = files.filter(f => !isNativeBlob(f));

        if (nativeFiles.length > 0) {
          // Use the newest native file, delete all others (native dupes + Google Docs)
          nativeFiles.sort((a, b) => parseDriveTime(b.modifiedTime) - parseDriveTime(a.modifiedTime));
          driveFiles.push(nativeFiles[0]);
          const toDelete = [...nativeFiles.slice(1), ...googleDocFiles];
          for (const f of toDelete) {
            try {
              console.log(`[Sync] Deleting duplicate/converted file: ID ${f.id}, modified ${f.modifiedTime}, mimeType ${f.mimeType}`);
              await deleteFile(f.id);
            } catch (err) {
              console.error(`[Sync] Failed to delete duplicate file ${f.id} for date ${date}:`, err);
            }
          }
        } else {
          // All files for this date are Google Docs — use the newest (export fallback)
          files.sort((a, b) => parseDriveTime(b.modifiedTime) - parseDriveTime(a.modifiedTime));
          driveFiles.push(files[0]);
          for (let i = 1; i < files.length; i++) {
            try {
              console.log(`[Sync] Deleting duplicate Google Doc: ID ${files[i].id}, modified ${files[i].modifiedTime}`);
              await deleteFile(files[i].id);
            } catch (err) {
              console.error(`[Sync] Failed to delete duplicate file ${files[i].id} for date ${date}:`, err);
            }
          }
        }
      } else {
        driveFiles.push(files[0]);
      }
    }

    const localMap = new Map<string, LocalEntrySyncInfo>();
    for (const entry of localEntries) {
      localMap.set(entry.date, entry);
    }

    const driveMap = new Map<string, DriveFileInfo>();
    for (const file of driveFiles) {
      const date = file.name.replace('.md', '');
      driveMap.set(date, file);
    }

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

      // Skip dates that are still in conflict. The local file contains
      // conflict markers that the user must resolve in the editor. Touching
      // either the local or the cloud while in this state would risk
      // destroying the user's data. We still re-add the date to
      // conflictedDates so the user is reminded to resolve it.
      if (local && hasConflictMarkers(local.content)) {
        console.log(`[Sync] Entry ${date}: Local is in conflict. Skipping sync; user must resolve.`);
        conflictedDates.push(date);
        continue;
      }

      if (local && !remote) {
        const baseContent = await invoke<string>('read_sync_base', { dirPath: journalDir, date });
        if (baseContent.trim() !== '' && local.content === baseContent) {
          console.log(`[Sync] Entry ${date}: Deleted on remote and unmodified locally. Deleting local entry...`);
          await invoke('delete_entry', { dirPath: journalDir, date });
          await invoke('delete_sync_base', { dirPath: journalDir, date });
          continue;
        }

        if (local.content.trim() === '') {
          console.log(`[Sync] Entry ${date}: Local is empty, remote doesn't exist. Deleting local entry...`);
          await invoke('delete_entry', { dirPath: journalDir, date });
          await invoke('delete_sync_base', { dirPath: journalDir, date });
          continue;
        }
        console.log(`[Sync] Entry ${date}: Local exists, remote doesn't. Uploading...`);
        const uploadResult = await uploadFile(folderId, fileName, local.content);
        const remoteTime = parseDriveTime(uploadResult.modifiedTime);
        await invoke('set_file_timestamp', { dirPath: journalDir, date, timestampMs: remoteTime });
        await invoke('write_sync_base', { dirPath: journalDir, date, content: local.content });
        console.log(`[Sync] Entry ${date}: Uploaded successfully.`);
      }
      else if (!local && remote) {
        const baseWhenNoLocal = await invoke<string>('read_sync_base', { dirPath: journalDir, date });

        // Local file was deleted but sync_base remains — user intentionally cleared this entry
        if (baseWhenNoLocal.trim() !== '') {
          console.log(`[Sync] Entry ${date}: Local deleted (base exists). Deleting remote...`);
          await deleteFile(remote.id);
          await invoke('delete_sync_base', { dirPath: journalDir, date });
          continue;
        }

        console.log(`[Sync] Entry ${date}: Remote exists, local doesn't. Downloading...`);
        if (remote.mimeType?.startsWith('application/vnd.google-apps.')) {
          console.warn(`[Sync] Entry ${date}: Remote file is a Google Doc. Content will be exported as plain text.`);
        }
        const content = await downloadFileContent(remote.id, remote.mimeType);
        if (content.trim() === '') {
          console.log(`[Sync] Entry ${date}: Remote is empty. Deleting from Google Drive and local...`);
          await deleteFile(remote.id);
          await invoke('delete_entry', { dirPath: journalDir, date });
          await invoke('delete_sync_base', { dirPath: journalDir, date });
          continue;
        }
        const remoteTime = parseDriveTime(remote.modifiedTime);
        console.log(`[Sync] Entry ${date}: Downloaded content length = ${content.length} characters.`);
        await invoke('write_entry_with_timestamp', {
          dirPath: journalDir,
          date,
          content,
          timestampMs: remoteTime
        });
        await invoke('write_sync_base', { dirPath: journalDir, date, content });
        downloadedDates.push(date);
        console.log(`[Sync] Entry ${date}: Local file written successfully.`);
      }
      else if (local && remote) {
        const localTime = local.last_modified;
        const remoteTime = parseDriveTime(remote.modifiedTime);
        const diff = Math.abs(localTime - remoteTime);
        const TIME_TOLERANCE = 5000; // 5 seconds

        console.log(`[Sync] Entry ${date}: Local = ${new Date(localTime).toISOString()}, Remote = ${new Date(remoteTime).toISOString()}, diff = ${diff}ms`);

        // Pre-read the base. We need it in both branches.
        const baseContent = await invoke<string>('read_sync_base', { dirPath: journalDir, date });

        // The TIME_TOLERANCE check below is only an optimization to avoid
        // the network call to download remote content. It is NOT a substitute
        // for content comparison. Two writes that happen within a few seconds
        // of each other can still produce different content; trusting mtime
        // over content is unsafe.
        const localAgreesWithBase = local.content === baseContent;
        // If mtime matches and local content matches the recorded base, we
        // can skip downloading remote content. Otherwise we must download to
        // make a proper decision.
        const canSkipRemoteDownload = diff <= TIME_TOLERANCE && localAgreesWithBase;

        if (local.content.trim() === '') {
          console.log(`[Sync] Entry ${date}: Local content is empty. Cleaning up...`);
          await deleteFile(remote.id);
          await invoke('delete_sync_base', { dirPath: journalDir, date });
          continue;
        }

        if (canSkipRemoteDownload) {
          console.log(`[Sync] Entry ${date}: In sync (mtime matches, local matches base).`);
          // Make sure the base is populated
          if (!baseContent) {
            await invoke('write_sync_base', { dirPath: journalDir, date, content: local.content });
          }
        } else {
          // We need the actual remote content to make a decision.
          // (Either mtimes differ, or local content disagrees with base.)
          if (remote.mimeType?.startsWith('application/vnd.google-apps.')) {
            console.warn(`[Sync] Entry ${date}: Remote file is a Google Doc. Content will be exported as plain text.`);
          }
          const remoteContent = await downloadFileContent(remote.id, remote.mimeType);

          if (local.content === remoteContent) {
            // Local and cloud agree. Update base to match (in case base was
            // stale) and align local mtime to cloud mtime.
            console.log(`[Sync] Entry ${date}: Local and cloud agree. Aligning...`);
            if (baseContent !== local.content) {
              await invoke('write_sync_base', { dirPath: journalDir, date, content: local.content });
            }
            await invoke('set_file_timestamp', { dirPath: journalDir, date, timestampMs: remoteTime });
          } else if (localAgreesWithBase) {
            // Local matches the recorded base, but cloud differs.
            // Cloud is the only thing that changed -> safely download it.
            console.log(`[Sync] Entry ${date}: Only cloud changed. Downloading cloud...`);
            await invoke('write_entry_with_timestamp', {
              dirPath: journalDir,
              date,
              content: remoteContent,
              timestampMs: remoteTime
            });
            await invoke('write_sync_base', { dirPath: journalDir, date, content: remoteContent });
            downloadedDates.push(date);
          } else if (remoteContent === baseContent) {
            // Cloud matches the recorded base, but local differs.
            // Only the local was edited (the base reflects an older sync
            // from when local = cloud = base, and the user has since edited
            // the local). Safely upload the local to the cloud.
            console.log(`[Sync] Entry ${date}: Only local changed. Uploading local...`);
            const updateResult = await updateFileContent(remote.id, local.content);
            const newRemoteTime = parseDriveTime(updateResult.modifiedTime);
            await invoke('set_file_timestamp', { dirPath: journalDir, date, timestampMs: newRemoteTime });
            await invoke('write_sync_base', { dirPath: journalDir, date, content: local.content });
            // local→cloud upload: do NOT push to downloadedDates (no modal needed)
          } else {
            // Both local and cloud differ from the base AND from each other.
            // We cannot tell which side is "right", so we surface the
            // conflict to the user instead of silently picking a side.
            // Write a conflict block to the local file (so the user sees
            // both versions in the editor) and leave the cloud untouched.
            console.log(`[Sync] Entry ${date}: CONFLICT - local and cloud disagree. Writing conflict block to local.`);
            const localLabel = `Desktop - ${new Date(localTime).toLocaleString()}`;
            const remoteLabel = `Cloud - ${new Date(remoteTime).toLocaleString()}`;
            const conflictBlock = buildConflictBlock(local.content, remoteContent, localLabel, remoteLabel);
            await invoke('write_entry_with_timestamp', {
              dirPath: journalDir,
              date,
              content: conflictBlock,
              timestampMs: remoteTime,
            });
            // Note: we do NOT call updateFileContent here. The cloud's
            // existing content is left intact so the user can choose
            // either side. We do NOT call write_sync_base either, so the
            // base still reflects the last agreed state and a future sync
            // can do a real 3-way merge after the user resolves.
            conflictedDates.push(date);
            console.log(`[Sync] Entry ${date}: Conflict written. Cloud preserved.`);
          }
        }
      }
    }

    localStorage.setItem('past_you_last_sync_time', Date.now().toString());

    onProgress({
      status: 'completed',
      message: 'Sync completed successfully!',
      filesProcessed: totalFiles,
      totalFiles
    });

    console.log(`[Sync] Sync completed. Downloaded dates: [${downloadedDates.join(', ')}], Conflicted dates: [${conflictedDates.join(', ')}]`);
    return { modifiedDates: downloadedDates, conflictedDates };
  } catch (error: any) {
    console.error('[Sync] Sync failed:', error);
    onProgress({
      status: 'error',
      message: error.message || 'An error occurred during synchronization.',
      filesProcessed: 0,
      totalFiles: 0
    });
    throw error;
  }
}
