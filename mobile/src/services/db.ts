import Dexie, { type Table } from 'dexie';

export interface LocalJournalEntry {
  date: string;       // YYYY-MM-DD
  content: string;    // markdown body
  lastModified: number; // local edit timestamp
  synced: boolean;    // local modifications synced?
  baseContent?: string; // Content at last successful sync (common ancestor)
}

export class JournalDatabase extends Dexie {
  entries!: Table<LocalJournalEntry>;

  constructor() {
    super('PastYouDatabase');
    this.version(1).stores({
      entries: 'date, lastModified, synced'
    });
  }
}

export const db = new JournalDatabase();

// Helper functions for entry operations
export async function getLocalEntry(date: string): Promise<LocalJournalEntry | undefined> {
  return await db.entries.get(date);
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
    baseContent: existing?.baseContent
  });
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
  return all.filter(e => e.content.trim() !== '');
}
