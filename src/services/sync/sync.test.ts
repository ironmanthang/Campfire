import { expect, test, vi, beforeEach } from 'vitest';

// 1. Mock globalThis.localStorage
globalThis.localStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
} as any;

// 2. Mock state maps
let driveStore = new Map<string, { id: string; name: string; content: string; modifiedTime: string }>();
let localStore = new Map<string, { date: string; content: string; last_modified: number }>();
let syncBaseStore = new Map<string, string>();

// Helper to reset stores
function resetTestStores() {
  driveStore.clear();
  localStore.clear();
  syncBaseStore.clear();
}

// 3. Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => {
  return {
    invoke: vi.fn(async (cmd: string, args: any) => {
      if (cmd === 'list_local_entries_for_sync') {
        return Array.from(localStore.values());
      }
      if (cmd === 'read_sync_base') {
        return syncBaseStore.get(args.date) || '';
      }
      if (cmd === 'write_sync_base') {
        syncBaseStore.set(args.date, args.content);
        return;
      }
      if (cmd === 'delete_sync_base') {
        syncBaseStore.delete(args.date);
        return;
      }
      if (cmd === 'delete_entry') {
        localStore.delete(args.date);
        return;
      }
      if (cmd === 'write_entry_with_timestamp') {
        localStore.set(args.date, {
          date: args.date,
          content: args.content,
          last_modified: args.timestampMs
        });
        return;
      }
      if (cmd === 'set_file_timestamp') {
        const entry = localStore.get(args.date);
        if (entry) {
          entry.last_modified = args.timestampMs;
        }
        return;
      }
      throw new Error(`Unhandled Tauri mock invoke command: ${cmd}`);
    })
  };
});

// 4. Mock ../googleDrive
vi.mock('../googleDrive', () => {
  return {
    getOrCreateFolderId: vi.fn(async () => 'mock-folder-id'),
    listDriveFiles: vi.fn(async () => Array.from(driveStore.values())),
    downloadFileContent: vi.fn(async (id: string) => {
      const file = Array.from(driveStore.values()).find(f => f.id === id);
      return file ? file.content : '';
    }),
    uploadFile: vi.fn(async (folderId: string, name: string, content: string) => {
      const file = {
        id: `drive-${name}`,
        name,
        content,
        modifiedTime: new Date().toISOString()
      };
      driveStore.set(name, file);
      return file;
    }),
    updateFileContent: vi.fn(async (id: string, content: string) => {
      const file = Array.from(driveStore.values()).find(f => f.id === id);
      if (!file) throw new Error('File not found on drive');
      file.content = content;
      file.modifiedTime = new Date().toISOString();
      return file;
    }),
    deleteFile: vi.fn(async (id: string) => {
      const key = Array.from(driveStore.keys()).find(k => driveStore.get(k)?.id === id);
      if (key) driveStore.delete(key);
    })
  };
});

// 5. Import runSync
import { runSync } from './sync';

const mockProgressCallback = () => {};

beforeEach(() => {
  resetTestStores();
});

test('Desktop Create & Sync: local file is uploaded to drive', async () => {
  localStore.set('2026-07-17', { date: '2026-07-17', content: 'hello from desktop', last_modified: Date.now() });

  const result = await runSync('mock-dir', mockProgressCallback);

  expect(result.modifiedDates).toEqual([]);
  expect(driveStore.has('2026-07-17.md')).toBe(true);
  expect(driveStore.get('2026-07-17.md')?.content).toBe('hello from desktop');
  expect(syncBaseStore.get('2026-07-17')).toBe('hello from desktop');
});

test('Cloud Create & Sync: remote file is downloaded to local', async () => {
  driveStore.set('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'hello from cloud',
    modifiedTime: new Date().toISOString()
  });

  const result = await runSync('mock-dir', mockProgressCallback);

  expect(result.modifiedDates).toEqual(['2026-07-17']);
  expect(localStore.has('2026-07-17')).toBe(true);
  expect(localStore.get('2026-07-17')?.content).toBe('hello from cloud');
  expect(syncBaseStore.get('2026-07-17')).toBe('hello from cloud');
});

test('Remote Deletion Fix: local matches base, remote is deleted -> local deleted', async () => {
  // Sync state initially
  localStore.set('2026-07-17', { date: '2026-07-17', content: 'entry 1', last_modified: Date.now() });
  syncBaseStore.set('2026-07-17', 'entry 1');
  // Remote deleted (driveStore is empty)

  const result = await runSync('mock-dir', mockProgressCallback);

  expect(localStore.has('2026-07-17')).toBe(false);
  expect(syncBaseStore.has('2026-07-17')).toBe(false);
  expect(result.modifiedDates).toEqual([]);
});

test('Local Deletion: local content is empty, remote exists -> remote deleted', async () => {
  localStore.set('2026-07-17', { date: '2026-07-17', content: '  ', last_modified: Date.now() });
  syncBaseStore.set('2026-07-17', 'entry 1');
  driveStore.set('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'entry 1',
    modifiedTime: new Date().toISOString()
  });

  await runSync('mock-dir', mockProgressCallback);

  expect(driveStore.has('2026-07-17.md')).toBe(false);
  expect(syncBaseStore.has('2026-07-17')).toBe(false);
});

test('Conflict: both local and remote modified differently -> conflict markers written', async () => {
  const localTime = Date.now();
  const remoteTimeStr = new Date(localTime - 10000).toISOString(); // 10s difference

  localStore.set('2026-07-17', { date: '2026-07-17', content: 'desktop version', last_modified: localTime });
  syncBaseStore.set('2026-07-17', 'base version');
  driveStore.set('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'cloud version',
    modifiedTime: remoteTimeStr
  });

  const result = await runSync('mock-dir', mockProgressCallback);

  expect(result.conflictedDates).toEqual(['2026-07-17']);
  const localContent = localStore.get('2026-07-17')?.content;
  expect(localContent).toContain('<<<<<<< Local');
  expect(localContent).toContain('desktop version');
  expect(localContent).toContain('=======');
  expect(localContent).toContain('Remote');
  expect(localContent).toContain('cloud version');
  expect(localContent).toContain('>>>>>>>');

  // Cloud remains unchanged
  expect(driveStore.get('2026-07-17.md')?.content).toBe('cloud version');
});
