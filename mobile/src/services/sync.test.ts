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
let mobileDBStore = new Map<string, any>();

function resetTestStores() {
  driveStore.clear();
  mobileDBStore.clear();
}

// 3. Mock ./db
vi.mock('./db', () => {
  return {
    db: {
      entries: {
        delete: vi.fn(async (date: string) => {
          mobileDBStore.delete(date);
        }),
        put: vi.fn(async (entry: any) => {
          mobileDBStore.set(entry.date, entry);
        }),
        update: vi.fn(async (date: string, updates: any) => {
          const entry = mobileDBStore.get(date);
          if (entry) {
            Object.assign(entry, updates);
          }
        }),
        get: vi.fn(async (date: string) => {
          return mobileDBStore.get(date);
        })
      }
    },
    listLocalEntries: vi.fn(async () => {
      return Array.from(mobileDBStore.values());
    })
  };
});

// 4. Mock ./googleDrive
vi.mock('./googleDrive', () => {
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

test('Mobile Create & Sync: local file is uploaded to drive', async () => {
  mobileDBStore.set('2026-07-17', {
    date: '2026-07-17',
    content: 'hello from mobile',
    lastModified: Date.now(),
    synced: false,
    baseContent: ''
  });

  const result = await runSync(mockProgressCallback);

  expect(result.modifiedDates).toEqual([]);
  expect(driveStore.has('2026-07-17.md')).toBe(true);
  expect(driveStore.get('2026-07-17.md')?.content).toBe('hello from mobile');
  expect(mobileDBStore.get('2026-07-17')?.baseContent).toBe('hello from mobile');
  expect(mobileDBStore.get('2026-07-17')?.synced).toBe(true);
});

test('Cloud Create & Sync: remote file is downloaded to local mobile db', async () => {
  driveStore.set('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'hello from cloud',
    modifiedTime: new Date().toISOString()
  });

  const result = await runSync(mockProgressCallback);

  expect(result.modifiedDates).toEqual(['2026-07-17']);
  expect(mobileDBStore.has('2026-07-17')).toBe(true);
  expect(mobileDBStore.get('2026-07-17')?.content).toBe('hello from cloud');
  expect(mobileDBStore.get('2026-07-17')?.baseContent).toBe('hello from cloud');
});

test('Remote Deletion Fix: local matches base, remote is deleted -> local deleted', async () => {
  mobileDBStore.set('2026-07-17', {
    date: '2026-07-17',
    content: 'entry 1',
    lastModified: Date.now(),
    synced: true,
    baseContent: 'entry 1'
  });
  // Remote deleted (driveStore is empty)

  const result = await runSync(mockProgressCallback);

  expect(mobileDBStore.has('2026-07-17')).toBe(false);
  expect(result.modifiedDates).toEqual([]);
});

test('Local Deletion: local content is empty, remote exists -> remote deleted', async () => {
  mobileDBStore.set('2026-07-17', {
    date: '2026-07-17',
    content: '  ',
    lastModified: Date.now(),
    synced: false,
    baseContent: 'entry 1'
  });
  driveStore.set('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'entry 1',
    modifiedTime: new Date().toISOString()
  });

  await runSync(mockProgressCallback);

  expect(driveStore.has('2026-07-17.md')).toBe(false);
  expect(mobileDBStore.has('2026-07-17')).toBe(false);
});

test('Conflict: both local and remote modified differently -> conflict markers written', async () => {
  const localTime = Date.now();
  const remoteTimeStr = new Date(localTime - 10000).toISOString();

  mobileDBStore.set('2026-07-17', {
    date: '2026-07-17',
    content: 'mobile version',
    lastModified: localTime,
    synced: false,
    baseContent: 'base version'
  });
  driveStore.set('2026-07-17.md', {
    id: 'drive-2026-07-17.md',
    name: '2026-07-17.md',
    content: 'cloud version',
    modifiedTime: remoteTimeStr
  });

  const result = await runSync(mockProgressCallback);

  expect(result.conflictedDates).toEqual(['2026-07-17']);
  const localContent = mobileDBStore.get('2026-07-17')?.content;
  expect(localContent).toContain('<<<<<<< Local');
  expect(localContent).toContain('mobile version');
  expect(localContent).toContain('=======');
  expect(localContent).toContain('Remote');
  expect(localContent).toContain('cloud version');
  expect(localContent).toContain('>>>>>>>');

  // Cloud remains untouched
  expect(driveStore.get('2026-07-17.md')?.content).toBe('cloud version');
});
