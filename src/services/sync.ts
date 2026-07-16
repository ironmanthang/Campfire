import { invoke } from '@tauri-apps/api/core';
import { 
  getOrCreateFolderId, 
  listDriveFiles, 
  downloadFileContent, 
  uploadFile, 
  updateFileContent,
  deleteFile,
  type DriveFileInfo 
} from './googleDrive';
import { merge3Way } from './merge';

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

export async function runSync(journalDir: string, onProgress: SyncCallback): Promise<string[]> {
  if (!journalDir) {
    throw new Error('Journal storage directory is not configured.');
  }

  const modifiedDates: string[] = [];
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
        // Sort descending by modifiedTime (newest first)
        files.sort((a, b) => parseDriveTime(b.modifiedTime) - parseDriveTime(a.modifiedTime));
        // Keep the newest one
        driveFiles.push(files[0]);
        // Delete older duplicates on Drive
        for (let i = 1; i < files.length; i++) {
          try {
            console.log(`[Sync] Deleting older duplicate file: ID ${files[i].id}, modified ${files[i].modifiedTime}`);
            await deleteFile(files[i].id);
          } catch (err) {
            console.error(`[Sync] Failed to delete duplicate file ${files[i].id} for date ${date}:`, err);
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

      if (local && !remote) {
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
        console.log(`[Sync] Entry ${date}: Remote exists, local doesn't. Downloading...`);
        const content = await downloadFileContent(remote.id);
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
        modifiedDates.push(date);
        console.log(`[Sync] Entry ${date}: Local file written successfully.`);
      } 
      else if (local && remote) {
        const localTime = local.last_modified;
        const remoteTime = parseDriveTime(remote.modifiedTime);
        const diff = Math.abs(localTime - remoteTime);
        const TIME_TOLERANCE = 5000; // 5 seconds

        console.log(`[Sync] Entry ${date}: Local = ${new Date(localTime).toISOString()}, Remote = ${new Date(remoteTime).toISOString()}, diff = ${diff}ms`);

        if (diff <= TIME_TOLERANCE) {
          console.log(`[Sync] Entry ${date}: In sync (within 5s tolerance).`);
          if (local.content.trim() === '') {
            console.log(`[Sync] Entry ${date}: Contents are empty. Cleaning up...`);
            await deleteFile(remote.id);
            await invoke('delete_entry', { dirPath: journalDir, date });
            await invoke('delete_sync_base', { dirPath: journalDir, date });
            continue;
          }
          // Ensure base content is populated
          const baseContent = await invoke<string>('read_sync_base', { dirPath: journalDir, date });
          if (!baseContent) {
            await invoke('write_sync_base', { dirPath: journalDir, date, content: local.content });
          }
        } else {
          // Only download and check content if timestamps actually differ
          const baseContent = await invoke<string>('read_sync_base', { dirPath: journalDir, date });
          const remoteContent = await downloadFileContent(remote.id);

          if (local.content !== remoteContent) {
            const localLabel = `Desktop - ${new Date(localTime).toLocaleString()}`;
            const remoteLabel = `Cloud - ${new Date(remoteTime).toLocaleString()}`;

            const localChanged = local.content !== baseContent;
            const remoteChanged = remoteContent !== baseContent;

            if (localChanged && remoteChanged) {
              console.log(`[Sync] Entry ${date}: Both local and remote have changed. Merging...`);
              const { merged, hasConflict } = merge3Way(baseContent, local.content, remoteContent, localLabel, remoteLabel);
              
              // Overwrite locally and remotely with merged content
              const updateResult = await updateFileContent(remote.id, merged);
              const newRemoteTime = parseDriveTime(updateResult.modifiedTime);
              await invoke('write_entry_with_timestamp', { 
                dirPath: journalDir, 
                date, 
                content: merged, 
                timestampMs: newRemoteTime 
              });
              await invoke('write_sync_base', { dirPath: journalDir, date, content: merged });
              modifiedDates.push(date);
              console.log(`[Sync] Entry ${date}: 3-way merge completed. Conflict: ${hasConflict}`);
            } 
            else if (localChanged && !remoteChanged) {
              console.log(`[Sync] Entry ${date}: Only local changed (external edit or unsynced). Uploading local content...`);
              const updateResult = await updateFileContent(remote.id, local.content);
              const newRemoteTime = parseDriveTime(updateResult.modifiedTime);
              await invoke('set_file_timestamp', { dirPath: journalDir, date, timestampMs: newRemoteTime });
              await invoke('write_sync_base', { dirPath: journalDir, date, content: local.content });
            } 
            else {
              console.log(`[Sync] Entry ${date}: Only remote changed. Downloading remote content...`);
              await invoke('write_entry_with_timestamp', { 
                dirPath: journalDir, 
                date, 
                content: remoteContent, 
                timestampMs: remoteTime 
              });
              await invoke('write_sync_base', { dirPath: journalDir, date, content: remoteContent });
              modifiedDates.push(date);
            }
          } else {
            // Contents match, align timestamps
            console.log(`[Sync] Entry ${date}: Contents match, aligning timestamps.`);
            await invoke('set_file_timestamp', { dirPath: journalDir, date, timestampMs: remoteTime });
            if (baseContent !== local.content) {
              await invoke('write_sync_base', { dirPath: journalDir, date, content: local.content });
            }
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

    console.log(`[Sync] Sync completed. Modified dates: [${modifiedDates.join(', ')}]`);
    return modifiedDates;
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

