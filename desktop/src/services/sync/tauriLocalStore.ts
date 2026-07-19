// Tauri-backed LocalStore. The desktop app stores journal entries as
// .md files in a user-chosen directory. The Rust side (in
// desktop/src-tauri/) exposes the file operations as Tauri commands; this
// adapter just calls them. The core sync engine never imports @tauri-apps
// directly — it sees only the LocalStore interface.

import { invoke } from '@tauri-apps/api/core';
import type { LocalEntry, LocalStore } from '@campfire/core';

interface RawEntry {
  date: string;
  content: string;
  last_modified: number;
}

export class TauriLocalStore implements LocalStore {
  constructor(private journalDir: string) {
    if (!journalDir) {
      throw new Error('Journal storage directory is not configured.');
    }
  }

  async list(): Promise<LocalEntry[]> {
    const rows = await invoke<RawEntry[]>('list_local_entries_for_sync', {
      dirPath: this.journalDir,
    });
    return rows.map((r) => ({
      date: r.date,
      content: r.content,
      lastModified: r.last_modified,
      synced: false,
    }));
  }

  async get(date: string): Promise<LocalEntry | undefined> {
    // No dedicated get_entry_for_sync command; list+filter is acceptable
    // because the engine only calls get() rarely (only for sync base reads,
    // which go through readSyncBase directly).
    const all = await this.list();
    return all.find((e) => e.date === date);
  }

  async put(entry: LocalEntry): Promise<void> {
    await invoke('write_entry_with_timestamp', {
      dirPath: this.journalDir,
      date: entry.date,
      content: entry.content,
      timestampMs: entry.lastModified,
    });
  }

  async update(date: string, patch: Partial<LocalEntry>): Promise<void> {
    if (patch.content !== undefined) {
      await invoke('write_entry_with_timestamp', {
        dirPath: this.journalDir,
        date,
        content: patch.content,
        timestampMs: patch.lastModified ?? Date.now(),
      });
    }
    if (patch.lastModified !== undefined && patch.content === undefined) {
      await invoke('set_file_timestamp', {
        dirPath: this.journalDir,
        date,
        timestampMs: patch.lastModified,
      });
    }
    // synced and baseContent are not stored as Tauri state on the desktop;
    // the engine tracks them via writeSyncBase.
  }

  async delete(date: string): Promise<void> {
    await invoke('delete_entry', { dirPath: this.journalDir, date });
  }

  // Sync base sidecar. The desktop stores the base as a separate file
  // (managed by Rust). The engine sees the same readSyncBase /
  // writeSyncBase / deleteSyncBase interface as mobile.
  async readSyncBase(date: string): Promise<string> {
    return await invoke<string>('read_sync_base', {
      dirPath: this.journalDir,
      date,
    });
  }

  async writeSyncBase(date: string, content: string): Promise<void> {
    await invoke('write_sync_base', {
      dirPath: this.journalDir,
      date,
      content,
    });
  }

  async deleteSyncBase(date: string): Promise<void> {
    await invoke('delete_sync_base', { dirPath: this.journalDir, date });
  }
}
