// Dexie-backed LocalStore. The mobile PWA uses IndexedDB (via Dexie) to
// store journal entries. The core sync engine sees only the LocalStore
// interface, so it never imports dexie directly.

import { db, type LocalJournalEntry } from './db';
import type { LocalEntry, LocalStore } from '@campfire/core';

export class DexieLocalStore implements LocalStore {
  async list(): Promise<LocalEntry[]> {
    const rows = await db.entries.orderBy('date').reverse().toArray();
    return rows.map(toCore);
  }

  async get(date: string): Promise<LocalEntry | undefined> {
    const row = await db.entries.get(date);
    return row ? toCore(row) : undefined;
  }

  async put(entry: LocalEntry): Promise<void> {
    await db.entries.put({
      date: entry.date,
      content: entry.content,
      lastModified: entry.lastModified,
      synced: entry.synced,
      baseContent: entry.baseContent,
    });
  }

  async update(date: string, patch: Partial<LocalEntry>): Promise<void> {
    const existing = await db.entries.get(date);
    if (!existing) return;
    const updates: Partial<LocalJournalEntry> = {};
    if (patch.content !== undefined) updates.content = patch.content;
    if (patch.lastModified !== undefined) updates.lastModified = patch.lastModified;
    if (patch.synced !== undefined) updates.synced = patch.synced;
    if (patch.baseContent !== undefined) updates.baseContent = patch.baseContent;
    await db.entries.update(date, updates);
  }

  async delete(date: string): Promise<void> {
    await db.entries.delete(date);
  }

  // Sync base sidecar. On mobile the base lives in the same row as the
  // entry (LocalJournalEntry.baseContent). The engine still calls
  // readSyncBase / writeSyncBase / deleteSyncBase uniformly, so the
  // desktop-vs-mobile storage difference is hidden behind this interface.
  async readSyncBase(date: string): Promise<string> {
    const row = await db.entries.get(date);
    return row?.baseContent ?? '';
  }

  async writeSyncBase(date: string, content: string): Promise<void> {
    await this.update(date, { baseContent: content });
  }

  async deleteSyncBase(date: string): Promise<void> {
    await this.update(date, { baseContent: '' });
  }
}

function toCore(row: LocalJournalEntry): LocalEntry {
  return {
    date: row.date,
    content: row.content,
    lastModified: row.lastModified,
    synced: row.synced,
    baseContent: row.baseContent,
  };
}
