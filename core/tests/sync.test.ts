import { expect, test, beforeEach } from 'vitest';
import {
  runSync,
  type LocalEntry,
  type LocalStore,
  type DriveAdapter,
  type DriveFileInfo,
  type SyncLogger,
} from '../src/index';

interface MockDriveFileInfo extends DriveFileInfo {
  content: string;
}

// ---------------------------------------------------------------------------
// In-memory mocks for LocalStore, DriveAdapter, and SyncLogger.
// ---------------------------------------------------------------------------

class MockLocalStore implements LocalStore {
  private entries = new Map<string, LocalEntry>();

  async list(): Promise<LocalEntry[]> {
    return Array.from(this.entries.values());
  }
  async get(date: string): Promise<LocalEntry | undefined> {
    return this.entries.get(date);
  }
  async put(entry: LocalEntry): Promise<void> {
    this.entries.set(entry.date, { ...entry });
  }
  async update(date: string, patch: Partial<LocalEntry>): Promise<void> {
    const existing = this.entries.get(date);
    if (!existing) return;
    this.entries.set(date, { ...existing, ...patch });
  }
  async delete(date: string): Promise<void> {
    this.entries.delete(date);
  }
  // The mock treats `baseContent` as a field on the entry (mobile style).
  // Real desktop adapters back this with a sidecar file; the engine sees
  // the same interface either way.
  async readSyncBase(date: string): Promise<string> {
    return this.entries.get(date)?.baseContent ?? '';
  }
  async writeSyncBase(date: string, content: string): Promise<void> {
    const existing = this.entries.get(date);
    if (existing) {
      this.entries.set(date, { ...existing, baseContent: content });
    } else {
      // Engine writes the base AFTER put() in the download path, but in
      // some code paths it might call writeSyncBase before the entry
      // exists. We tolerate that by storing it on a sentinel entry.
      this.entries.set(date, {
        date, content: '', lastModified: 0, synced: false, baseContent: content,
      });
    }
  }
  async deleteSyncBase(date: string): Promise<void> {
    const existing = this.entries.get(date);
    if (existing) {
      this.entries.set(date, { ...existing, baseContent: '' });
    }
  }

  // Test-only helpers
  __setEntry(entry: LocalEntry) { this.entries.set(entry.date, entry); }
  __setBase(date: string, content: string) {
    const existing = this.entries.get(date);
    if (existing) {
      this.entries.set(date, { ...existing, baseContent: content });
    } else {
      this.entries.set(date, {
        date, content: '', lastModified: 0, synced: false, baseContent: content,
      });
    }
  }
}

class MockDrive implements DriveAdapter {
  // Keyed by name (with .md). We support multiple files with the same
  // name suffix (e.g. for dedup tests) by keying on name+id internally.
  private files = new Map<string, MockDriveFileInfo>();

  async getOrCreateFolderId(): Promise<string> {
    return 'mock-folder-id';
  }
  async listDriveFiles(_folderId: string): Promise<DriveFileInfo[]> {
    return Array.from(this.files.values());
  }
  async downloadFileContent(id: string, mimeType?: string): Promise<string> {
    const file = Array.from(this.files.values()).find(f => f.id === id);
    if (!file) return '';
    if (mimeType?.startsWith('application/vnd.google-apps.')) {
      return `[Exported Doc] ${file.content}`;
    }
    return file.content;
  }
  async uploadFile(_folderId: string, name: string, content: string): Promise<DriveFileInfo> {
    const file: MockDriveFileInfo = {
      id: `drive-${name}-${Date.now()}`,
      name,
      content,
      modifiedTime: new Date().toISOString(),
    };
    this.files.set(name, file);
    return file;
  }
  async updateFileContent(id: string, content: string): Promise<DriveFileInfo> {
    const file = Array.from(this.files.values()).find(f => f.id === id);
    if (!file) throw new Error('File not found on drive');
    file.content = content;
    file.modifiedTime = new Date().toISOString();
    return file;
  }
  async deleteFile(id: string): Promise<void> {
    const key = Array.from(this.files.keys()).find(k => this.files.get(k)?.id === id);
    if (key) this.files.delete(key);
  }

  // Test-only helpers. The dedup test stores two files under different
  // keys but with the same display name. We key the Map by id here to
  // allow that, and __setFile takes both the storage key and the file.
  __setFile(key: string, file: MockDriveFileInfo) { this.files.set(key, file); }
  __getFileByName(name: string): MockDriveFileInfo | undefined {
    return this.files.get(name);
  }
  __hasFileByName(name: string): boolean {
    return this.files.has(name);
  }
  __listFiles(): MockDriveFileInfo[] {
    return Array.from(this.files.values());
  }
  __getById(id: string): MockDriveFileInfo | undefined {
    return this.files.get(id);
  }
}

class MockSyncLogger implements SyncLogger {
  messages: string[] = [];
  log(message: string): void {
    this.messages.push(message);
  }
}

const mockProgressCallback = () => {};

let store: MockLocalStore;
let drive: MockDrive;
let logger: MockSyncLogger;

beforeEach(() => {
  store = new MockLocalStore();
  drive = new MockDrive();
  logger = new MockSyncLogger();
});

// ---------------------------------------------------------------------------
// Tests (unified from desktop + mobile test files; desktop is the superset).
// ---------------------------------------------------------------------------

test('Desktop Create & Sync: local file is uploaded to drive', async () => {
  store.__setEntry({ date: '2026-07-17', content: 'hello from desktop', lastModified: Date.now(), synced: false });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  expect(result.modifiedDates).toEqual([]);
  expect(drive.__hasFileByName('2026-07-17.md')).toBe(true);
  expect(drive.__getFileByName('2026-07-17.md')?.content).toBe('hello from desktop');
  expect(await store.readSyncBase('2026-07-17')).toBe('hello from desktop');
});

test('Mobile Create & Sync: local file is uploaded to drive (covers `synced` flag flow)', async () => {
  store.__setEntry({ date: '2026-07-17', content: 'hello from mobile', lastModified: Date.now(), synced: false });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Mobile' }, mockProgressCallback);

  expect(result.modifiedDates).toEqual([]);
  expect(drive.__hasFileByName('2026-07-17.md')).toBe(true);
  expect(drive.__getFileByName('2026-07-17.md')?.content).toBe('hello from mobile');
  expect(await store.readSyncBase('2026-07-17')).toBe('hello from mobile');
  // The local entry's synced flag should now be true.
  expect((await store.get('2026-07-17'))?.synced).toBe(true);
});

test('Cloud Create & Sync: remote file is downloaded to local', async () => {
  drive.__setFile('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'hello from cloud',
    modifiedTime: new Date().toISOString(),
  });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  expect(result.modifiedDates).toEqual(['2026-07-17']);
  expect((await store.get('2026-07-17'))?.content).toBe('hello from cloud');
  expect(await store.readSyncBase('2026-07-17')).toBe('hello from cloud');
});

test('Remote Deletion Fix: local matches base, remote is deleted -> local deleted', async () => {
  // Sync state initially
  store.__setEntry({ date: '2026-07-17', content: 'entry 1', lastModified: Date.now(), synced: true });
  store.__setBase('2026-07-17', 'entry 1');
  // Remote deleted (drive is empty)

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  expect(await store.get('2026-07-17')).toBeUndefined();
  expect(await store.readSyncBase('2026-07-17')).toBe('');
  expect(result.modifiedDates).toEqual([]);
});

test('Local Deletion: local content is empty, remote exists -> remote deleted', async () => {
  store.__setEntry({ date: '2026-07-17', content: '  ', lastModified: Date.now(), synced: true });
  store.__setBase('2026-07-17', 'entry 1');
  drive.__setFile('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'entry 1',
    modifiedTime: new Date().toISOString(),
  });

  await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  expect(drive.__hasFileByName('2026-07-17.md')).toBe(false);
  expect(await store.readSyncBase('2026-07-17')).toBe('');
});

test('Regression: Timeline/Search delete (local gone, sync_base kept) -> remote deleted', async () => {
  // The frontend now leaves `sync_base` intact (only the local .md is
  // removed) so that runSync recognises the deletion as intentional and
  // calls `deleteFile` on Drive. Previously the hook also wiped
  // `sync_base`, which made the sync engine fall into the "download"
  // branch and re-pull the cloud file.
  store.__setBase('2026-07-17', 'entry 1');
  drive.__setFile('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'entry 1',
    modifiedTime: new Date().toISOString(),
  });
  // Note: store is intentionally empty (the .md was deleted).

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  // The cloud file must be gone, not downloaded back to the user.
  expect(drive.__hasFileByName('2026-07-17.md')).toBe(false);
  expect(await store.readSyncBase('2026-07-17')).toBe('');
  expect(result.modifiedDates).toEqual([]);
});

test('Regression: Timeline/Search bulk delete -> all remote copies deleted', async () => {
  // Two entries selected and deleted at once. sync_base is kept for both,
  // local .md files are gone.
  store.__setBase('2026-07-17', 'a');
  store.__setBase('2026-07-18', 'b');
  drive.__setFile('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'a',
    modifiedTime: new Date().toISOString(),
  });
  drive.__setFile('2026-07-18.md', {
    id: 'drive-2026-07-18.md',
    name: '2026-07-18.md',
    content: 'b',
    modifiedTime: new Date().toISOString(),
  });

  await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  expect(drive.__hasFileByName('2026-07-17.md')).toBe(false);
  expect(drive.__hasFileByName('2026-07-18.md')).toBe(false);
  expect(await store.readSyncBase('2026-07-17')).toBe('');
  expect(await store.readSyncBase('2026-07-18')).toBe('');
});

test('Conflict: both local and remote modified differently -> conflict markers written', async () => {
  const localTime = Date.now();
  const remoteTimeStr = new Date(localTime - 10000).toISOString(); // 10s difference

  store.__setEntry({ date: '2026-07-17', content: 'desktop version', lastModified: localTime, synced: false });
  store.__setBase('2026-07-17', 'base version');
  drive.__setFile('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'cloud version',
    modifiedTime: remoteTimeStr,
  });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  expect(result.conflictedDates).toEqual(['2026-07-17']);
  const localContent = (await store.get('2026-07-17'))?.content;
  expect(localContent).toContain('<<<<<<< Local');
  expect(localContent).toContain('desktop version');
  expect(localContent).toContain('=======');
  expect(localContent).toContain('Remote');
  expect(localContent).toContain('cloud version');
  expect(localContent).toContain('>>>>>>>');

  // Cloud remains unchanged
  expect(drive.__getFileByName('2026-07-17.md')?.content).toBe('cloud version');
});

test('Conflict label: uses config.conflictLabel in the conflict block', async () => {
  // Re-run the conflict test with `conflictLabel: 'Mobile'` to make sure
  // the label is parameterised, not hard-coded to 'Desktop'.
  const localTime = Date.now();
  const remoteTimeStr = new Date(localTime - 10000).toISOString();

  store.__setEntry({ date: '2026-07-17', content: 'mobile version', lastModified: localTime, synced: false });
  store.__setBase('2026-07-17', 'base version');
  drive.__setFile('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'cloud version',
    modifiedTime: remoteTimeStr,
  });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Mobile' }, mockProgressCallback);

  expect(result.conflictedDates).toEqual(['2026-07-17']);
  const localContent = (await store.get('2026-07-17'))?.content;
  expect(localContent).toContain('Mobile - ');
  expect(localContent).not.toContain('Desktop - ');
});

test('Google Doc Deduplication: prefers native file over Google Doc', async () => {
  // Mock two files on Drive with the same name (Google Docs duplicate).
  // We key them by id here so the Map can hold both.
  drive.__setFile('drive-native', {
    id: 'drive-native',
    name: '2026-07-17.md',
    content: 'native content',
    modifiedTime: new Date(Date.now() - 5000).toISOString(), // older
    mimeType: 'text/markdown',
  });
  drive.__setFile('drive-doc', {
    id: 'drive-doc',
    name: '2026-07-17.md',
    content: 'google doc content',
    modifiedTime: new Date().toISOString(), // newer
    mimeType: 'application/vnd.google-apps.document',
  });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  // Should select the native file and download it
  expect(result.modifiedDates).toEqual(['2026-07-17']);
  expect((await store.get('2026-07-17'))?.content).toBe('native content');

  // Should delete the Google Doc duplicate
  const driveFiles = drive.__listFiles();
  expect(driveFiles.find(f => f.id === 'drive-doc')).toBeUndefined();
  expect(driveFiles.find(f => f.id === 'drive-native')).toBeDefined();
});

test('Google Doc export fallback: syncs Google Doc if only Workspace native document exists', async () => {
  // Only Google Doc file on Drive
  drive.__setFile('2026-07-17.md', {
    id: 'drive-doc-only',
    name: '2026-07-17.md',
    content: 'google doc content',
    modifiedTime: new Date().toISOString(),
    mimeType: 'application/vnd.google-apps.document',
  });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  // Should fall back to exporting the Google Doc and download it
  expect(result.modifiedDates).toEqual(['2026-07-17']);
  expect((await store.get('2026-07-17'))?.content).toBe('[Exported Doc] google doc content');
});

test('Logger: messages are captured for inspection', async () => {
  // Light smoke test that logger.log is called, not console.log.
  store.__setEntry({ date: '2026-07-17', content: 'log me', lastModified: Date.now(), synced: false });

  await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  // At least the startup line and the upload line should be logged.
  const joined = logger.messages.join('\n');
  expect(joined).toContain('Starting sync');
  expect(joined).toContain('Uploaded successfully');
});

test('Scratchpad 3-Way Auto-Merge on Sync: merges local and remote changes cleanly', async () => {
  const baseJson = JSON.stringify({
    version: 1,
    items: [
      { id: '1', text: 'Base Task', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
    ],
  }, null, 2);

  const localJson = JSON.stringify({
    version: 1,
    items: [
      { id: '1', text: 'Base Task', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      { id: 'loc', text: 'Local Task', isChecked: false, children: [], createdAt: 2000, updatedAt: 2000 },
    ],
  }, null, 2);

  const remoteJson = JSON.stringify({
    version: 1,
    items: [
      { id: '1', text: 'Base Task', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      { id: 'rem', text: 'Remote Task', isChecked: false, children: [], createdAt: 2000, updatedAt: 2000 },
    ],
  }, null, 2);

  store.__setEntry({ date: 'scratchpad', content: localJson, lastModified: 2000, synced: false });
  store.__setBase('scratchpad', baseJson);

  drive.__setFile('scratchpad.md', {
    id: 'drive-scratchpad.md',
    name: 'scratchpad.md',
    content: remoteJson,
    modifiedTime: new Date(2000).toISOString(),
  });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  expect(result.conflictedDates).toEqual([]);
  expect(result.scratchpadConflict).toBeNull();
  expect(result.scratchpadModified).toBe(true);
  expect(result.modifiedDates).toContain('scratchpad');

  const localSaved = (await store.get('scratchpad'))?.content;
  expect(localSaved).toBeDefined();
  const parsed = JSON.parse(localSaved!);
  expect(parsed.items).toHaveLength(3);
  expect(parsed.items.map((i: any) => i.id)).toEqual(['1', 'loc', 'rem']);

  // Cloud should also be updated with merged content
  const remoteSaved = drive.__getFileByName('scratchpad.md')?.content;
  expect(remoteSaved).toBe(localSaved);
});

test('Scratchpad Conflict on Sync: surfaces ambiguous conflict without corrupting local JSON', async () => {
  const baseJson = JSON.stringify({
    version: 1,
    items: [
      { id: '1', text: 'Base Task', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
    ],
  }, null, 2);

  const localJson = JSON.stringify({
    version: 1,
    items: [
      { id: '1', text: 'Local Task Text', isChecked: false, children: [], createdAt: 1000, updatedAt: 2000 },
    ],
  }, null, 2);

  const remoteJson = JSON.stringify({
    version: 1,
    items: [
      { id: '1', text: 'Remote Task Text', isChecked: false, children: [], createdAt: 1000, updatedAt: 2000 },
    ],
  }, null, 2);

  store.__setEntry({ date: 'scratchpad', content: localJson, lastModified: 2000, synced: false });
  store.__setBase('scratchpad', baseJson);

  drive.__setFile('scratchpad.md', {
    id: 'drive-scratchpad.md',
    name: 'scratchpad.md',
    content: remoteJson,
    modifiedTime: new Date(2000).toISOString(),
  });

  const result = await runSync(store, drive, logger, { conflictLabel: 'Desktop' }, mockProgressCallback);

  expect(result.conflictedDates).toEqual(['scratchpad']);
  expect(result.scratchpadConflict).toEqual({
    local: localJson,
    remote: remoteJson,
  });

  // Local content should NOT have raw markdown conflict markers injected
  const localSaved = (await store.get('scratchpad'))?.content;
  expect(localSaved).not.toContain('<<<<<<<');
  expect(() => JSON.parse(localSaved!)).not.toThrow();
});
