import Dexie, { type Table } from 'dexie';
import { type ScratchpadDocument, parseLegacyMarkdown } from '@campfire/core';

export interface LocalJournalEntry {
  date: string;       // YYYY-MM-DD
  content: string;    // markdown body
  lastModified: number; // local edit timestamp
  synced: boolean;    // local modifications synced?
  baseContent?: string; // Content at last successful sync (common ancestor)
  isLocked?: boolean; // Explicit lock state
}

export interface LocalScratchpadDoc {
  id: string; // 'scratchpad'
  document: ScratchpadDocument;
  lastModified: number;
  synced: boolean;
}

export class JournalDatabase extends Dexie {
  entries!: Table<LocalJournalEntry>;
  scratchpad!: Table<LocalScratchpadDoc>;

  constructor() {
    super('CampfireDatabase');
    this.version(1).stores({
      entries: 'date, lastModified, synced'
    });
    this.version(2).stores({
      entries: 'date, lastModified, synced',
      scratchpad: 'id, lastModified'
    });
  }
}

export const db = new JournalDatabase();

// Helper functions for entry operations
export async function getLocalEntry(date: string): Promise<LocalJournalEntry | undefined> {
  return await db.entries.get(date);
}

export async function getScratchpadDoc(): Promise<ScratchpadDocument> {
  const row = await db.scratchpad.get('scratchpad');
  if (row) {
    return row.document;
  }

  // One-time migration: check if legacy entry exists in entries table
  const legacyEntry = await db.entries.get('scratchpad');
  if (legacyEntry && legacyEntry.content) {
    const items = parseLegacyMarkdown(legacyEntry.content);
    const doc: ScratchpadDocument = {
      version: 1,
      items,
    };
    await db.scratchpad.put({
      id: 'scratchpad',
      document: doc,
      lastModified: legacyEntry.lastModified || Date.now(),
      synced: legacyEntry.synced ?? false,
    });
    await db.entries.delete('scratchpad');
    return doc;
  }

  return {
    version: 1,
    items: [],
  };
}

export async function saveScratchpadDoc(doc: ScratchpadDocument): Promise<void> {
  await db.scratchpad.put({
    id: 'scratchpad',
    document: doc,
    lastModified: Date.now(),
    synced: false,
  });
}

export async function saveLocalEntry(date: string, content: string): Promise<void> {
  const existing = await db.entries.get(date);
  // If the content hasn't actually changed, don't mark as unsynced
  if (existing && existing.content === content) {
    return;
  }
  
  await db.entries.put({
    date,
    content,
    lastModified: Date.now(),
    synced: false,
    baseContent: existing?.baseContent,
    isLocked: existing?.isLocked,
  });
}

export async function saveLocalEntryLockStatus(date: string, isLocked: boolean): Promise<void> {
  const existing = await db.entries.get(date);
  if (existing) {
    await db.entries.put({
      ...existing,
      isLocked,
    });
  } else {
    await db.entries.put({
      date,
      content: '',
      lastModified: Date.now(),
      synced: false,
      isLocked,
    });
  }
}


export async function deleteLocalEntry(date: string): Promise<void> {
  const existing = await db.entries.get(date);
  if (existing) {
    await db.entries.put({
      date,
      content: '',
      lastModified: Date.now(),
      synced: false,
      baseContent: existing.baseContent
    });
  }
}

export async function listLocalEntries(): Promise<LocalJournalEntry[]> {
  const all = await db.entries.orderBy('date').reverse().toArray();
  return all.filter(e => e.date !== 'scratchpad' && e.content.trim() !== '');
}

export async function resolveLocalConflict(date: string, choice: 'local' | 'remote' | 'both'): Promise<string | null> {
  const entry = await db.entries.get(date);
  if (!entry) return null;

  const { parseConflictBlock, resolveConflictKeepBoth } = await import('./merge');
  const parsed = parseConflictBlock(entry.content);
  if (!parsed) return null;

  let resolvedVal = "";
  if (choice === "both") {
    resolvedVal = resolveConflictKeepBoth(entry.content);
  } else {
    resolvedVal = choice === "local" ? parsed.localContent : parsed.remoteContent;
  }

  await db.entries.put({
    date,
    content: resolvedVal,
    lastModified: Date.now(),
    synced: false,
    baseContent: parsed.remoteContent
  });
  return resolvedVal;
}
