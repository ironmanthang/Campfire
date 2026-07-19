# Campfire: extract shared `core/` sync engine + full npm workspaces

**Status**: designed, signed off, not yet executed. Date: 2026-07-19.
**Goal**: Single source of truth for the sync algorithm, shared by desktop and mobile. Tests run in CI before deploy.
**Scope**: one big commit. Pages deploys will fail for the duration (~1-2 hours).

---

## 0. Background — why this exists

The mobile PWA (`mobile/`) and the Tauri desktop app (currently at repo root, will move to `desktop/`) both implement the same Google Drive ↔ local-file sync algorithm. The code is duplicated:

| File | Lines |
|---|---|
| `src/services/sync/sync.ts` (desktop) | 303 |
| `mobile/src/services/sync.ts` (mobile) | 297 |
| `src/services/merge.ts` (desktop) | 254 |
| `mobile/src/services/merge.ts` (mobile) | 254 — **byte-identical** to desktop |
| `src/services/googleDrive.ts` (desktop) | 163 |
| `mobile/src/services/googleDrive.ts` (mobile) | 216 — **byte-identical** to desktop (verified `diff` returns nothing) |

There are also two sync test files (`src/services/sync/sync.test.ts`, `mobile/src/services/sync.test.ts`) and a mobile export test (`mobile/src/lib/exportJournal.test.ts`). The mobile tests don't run anywhere because `vitest` is not in `mobile/package.json`. The Cloudflare Pages build for `mobile/` is currently failing because `tsc -b` typechecks `src/**/*.test.ts` and can't resolve `vitest`.

The two `runSync` functions differ in two ways:
- Desktop has Google Docs dedupe logic in the "group by date" step. Mobile doesn't.
- Conflict blocks use "Desktop" vs "Mobile" labels (cosmetic, must preserve).

The two implementations of the 4-way merge logic (`local && !remote`, `!local && remote`, `local && remote` with `localAgreesWithBase` checks, conflict branch) are semantically equivalent with minor reordering. The unified engine will use the desktop's stricter logic.

---

## 1. Signed-off decisions

| Question | Decision |
|---|---|
| Where does the engine live? | New `core/` package at repo root |
| Package layout? | **Full npm workspaces**: `core/`, `mobile/`, `desktop/` (desktop moves out of root) |
| How do adapters plug in? | `LocalStore` interface + 2 adapters (~30 lines each) |
| How to preserve "Desktop" vs "Mobile" conflict label? | New `SyncConfig` object passed alongside `store` and `logger` |
| CI? | Run `npm test` in `core/`, `mobile/`, and `desktop/` on every PR. Rename `sync-tests.yml` → `tests.yml`. |
| Commit strategy? | **One single commit** (user chose "refactor now, accept broken deploys" over "unblock first") |
| Who edits the Rust files? | **The user** — I will list them, not touch them |

---

## 2. Final repo layout

```
Campfire/
├── package.json                  # NEW: workspace root, devDeps only
├── pnpm-workspace.yaml           # NEW: list ["core", "mobile", "desktop"]
├── tsconfig.base.json            # NEW: shared compiler options
├── .github/
│   └── workflows/
│       ├── tests.yml             # RENAMED from sync-tests.yml
│       └── (any other workflows — leave alone)
├── docs/
│   └── plan.md                   # this file
├── core/                         # NEW
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts              # re-exports public API
│   │   ├── types.ts              # SyncProgress, SyncCallback, SyncConfig
│   │   ├── storage.ts            # LocalStore interface, LocalEntry type
│   │   ├── logger.ts             # SyncLogger interface + consoleLogger
│   │   ├── merge.ts              # buildConflictBlock, hasConflictMarkers
│   │   └── sync.ts               # runSync engine (moved from src/services/sync/sync.ts)
│   └── tests/
│       ├── sync.test.ts          # the *one* test file (merged from both sides)
│       └── exportJournal.test.ts # moved from mobile
├── mobile/                       # CHANGED
│   ├── package.json              # + vitest, + @campfire/core, + test script
│   ├── tsconfig.app.json         # + exclude ["src/**/*.test.ts", "src/**/*.test.tsx"]
│   ├── vite.config.ts            # + alias @campfire/core -> ../core/src
│   └── src/
│       └── services/
│           ├── sync.ts                       # thin wrapper (~12 lines)
│           ├── sync.test.ts                  # DELETED
│           ├── dexieLocalStore.ts            # NEW (~30 lines)
│           ├── localStorageLogger.ts         # NEW (~15 lines)
│           ├── merge.ts                      # re-export from @campfire/core
│           ├── db.ts                         # UNCHANGED
│           └── googleDrive.ts                # UNCHANGED
└── desktop/                      # NEW directory, was repo root
    ├── package.json              # moved from root, + @campfire/core, + test script
    ├── tsconfig.json             # moved from root
    ├── tsconfig.node.json        # moved from root
    ├── vite.config.ts            # moved from root
    ├── index.html                # moved from root
    ├── ask.html                  # moved from root
    ├── mojeek.html               # moved from root
    ├── Modelfile                 # moved from root
    ├── run_dev.bat               # moved from root (paths updated)
    ├── public/                   # moved from root
    ├── scripts/                  # moved from root
    ├── src/                      # moved from root
    │   └── services/
    │       ├── sync/
    │       │   ├── sync.ts                   # thin wrapper (~12 lines)
    │       │   ├── sync.test.ts              # DELETED
    │       │   └── tauriLocalStore.ts        # NEW (~40 lines)
    │       ├── googleDrive.ts                # UNCHANGED
    │       ├── merge.ts                      # DELETED (was at src/services/merge.ts, now re-exported from sync/merge.ts)
    │       └── (everything else in src/)     # UNCHANGED
    └── src-tauri/                # moved from root
        ├── Cargo.toml            # ⚠️ USER must update paths if needed
        ├── build.rs              # ⚠️ leave alone, USER verifies
        ├── tauri.conf.json       # ⚠️ USER must update frontendDist
        ├── capabilities/         # moved
        ├── gen/                  # moved
        ├── icons/                # moved
        └── src/                  # moved
```

**Files at repo root that stay (workspace root only):**
- `README.md`
- `.gitignore`
- `.github/`
- `docs/`
- `storage/` (user's journal files)
- `Modelfile` — actually this should move into `desktop/`, it's used by the desktop Ollama integration
- Anything else not in the move list

**Files to DELETE from root after move:**
- `package.json` (replaced by new workspace root `package.json`)
- `tsconfig.json` (moved to `desktop/`)
- `tsconfig.node.json` (moved to `desktop/`)
- `vite.config.ts` (moved to `desktop/`)
- `index.html`, `ask.html`, `mojeek.html` (moved to `desktop/`)
- `run_dev.bat` (moved to `desktop/`)
- `Modelfile` (moved to `desktop/`)
- `public/`, `scripts/`, `src/`, `src-tauri/`, `src/components/`, etc. (all moved to `desktop/`)

---

## 3. Step-by-step execution (Checkpoints A through E)

### Checkpoint A — create `core/` skeleton

**Create `core/package.json`:**
```json
{
  "name": "@campfire/core",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "~5.8.3",
    "vitest": "^4.1.10"
  }
}
```

**Create `core/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "tests"]
}
```

**Create `core/vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] }
});
```

**Create `core/src/index.ts`:**
```typescript
export * from './types';
export * from './storage';
export * from './logger';
export * from './merge';
export * from './sync';
```

**Create `core/src/types.ts`:**
```typescript
export interface SyncProgress {
  status: 'idle' | 'authenticating' | 'connecting' | 'syncing' | 'completed' | 'error';
  message: string;
  filesProcessed: number;
  totalFiles: number;
}

export type SyncCallback = (progress: SyncProgress) => void;

export interface SyncConfig {
  /** Label used in conflict blocks (e.g. "Desktop", "Mobile"). */
  conflictLabel: string;
}
```

**Create `core/src/storage.ts`:**
```typescript
export interface LocalEntry {
  date: string;          // YYYY-MM-DD
  content: string;
  lastModified: number;  // ms since UNIX epoch
  synced: boolean;
  baseContent?: string;  // common ancestor at last sync
}

export interface LocalStore {
  list(): Promise<LocalEntry[]>;
  get(date: string): Promise<LocalEntry | undefined>;
  put(entry: LocalEntry): Promise<void>;
  update(date: string, patch: Partial<LocalEntry>): Promise<void>;
  delete(date: string): Promise<void>;
  // Sync base sidecar (desktop: separate file; mobile: field on entry).
  // Hides that difference from the engine.
  readSyncBase(date: string): Promise<string>;
  writeSyncBase(date: string, content: string): Promise<void>;
  deleteSyncBase(date: string): Promise<void>;
}
```

**Create `core/src/logger.ts`:**
```typescript
export interface SyncLogger {
  log(message: string): void;
}

export const consoleLogger: SyncLogger = {
  log: (m) => console.log(m),
};
```

**Create `core/src/merge.ts`:** copy **byte-for-byte** from `src/services/merge.ts` (or `mobile/src/services/merge.ts` — they are identical). Add a top-of-file comment:
```typescript
// Shared merge helpers. Used by the core sync engine. Originally
// duplicated in src/services/merge.ts and mobile/src/services/merge.ts;
// this is the single source of truth.
```

### Checkpoint B — move the engine to `core/src/sync.ts` and write tests

**Create `core/src/sync.ts`** by copying `src/services/sync/sync.ts` and applying these substitutions:

| Original (desktop) | Replacement |
|---|---|
| `import { invoke } from '@tauri-apps/api/core';` | DELETE (handled by adapter) |
| `interface LocalEntrySyncInfo { ... }` | DELETE (use `LocalEntry` from `./storage`) |
| `await invoke<LocalEntrySyncInfo[]>('list_local_entries_for_sync', { dirPath: journalDir })` | `await store.list()` |
| `await invoke('delete_entry', { dirPath: journalDir, date })` | `await store.delete(date)` |
| `await invoke<string>('read_sync_base', { dirPath: journalDir, date })` | `await store.readSyncBase(date)` |
| `await invoke('write_sync_base', { dirPath: journalDir, date, content })` | `await store.writeSyncBase(date, content)` |
| `await invoke('delete_sync_base', { dirPath: journalDir, date })` | `await store.deleteSyncBase(date)` |
| `await invoke('set_file_timestamp', { dirPath: journalDir, date, timestampMs })` | `await store.update(date, { lastModified: timestampMs })` |
| `await invoke('write_entry_with_timestamp', { dirPath: journalDir, date, content, timestampMs })` | `await store.put({ date, content, lastModified: timestampMs, synced: true, baseContent: content })` |
| `console.log(\`[Sync] ...\`)` | `logger.log(\`[Sync] ...\`)` (strip the `[Sync]` prefix or keep it, agent's choice) |
| `if (!journalDir) throw new Error(...)` (caller's responsibility) | DELETE — moved to wrapper |
| Signature `runSync(journalDir, onProgress)` | `runSync(store: LocalStore, logger: SyncLogger, config: SyncConfig, onProgress: SyncCallback)` |
| Conflict labels: `const localLabel = \`Desktop - ...\`;` | `const localLabel = \`${config.conflictLabel} - ...\`;` |
| `import { buildConflictBlock, hasConflictMarkers } from '../merge';` | `import { buildConflictBlock, hasConflictMarkers } from './merge';` |
| `import { getOrCreateFolderId, listDriveFiles, downloadFileContent, uploadFile, updateFileContent, deleteFile, type DriveFileInfo } from '../googleDrive';` | `import { getOrCreateFolderId, listDriveFiles, downloadFileContent, uploadFile, updateFileContent, deleteFile, type DriveFileInfo } from './drive';` (and add `core/src/drive.ts` that re-exports — see below) |
| `import { invoke } from '@tauri-apps/api/core';` | DELETE |

**Add `core/src/drive.ts`** as a stub the engine imports. The actual Google Drive functions live in each platform's `googleDrive.ts` (they're byte-identical). The engine imports the `DriveFileInfo` type from `./types` and the rest as **function parameters** injected by the caller. **Decision**: simplest is to add a `Drive` interface mirroring the functions `getOrCreateFolderId`, `listDriveFiles`, etc. The caller passes it.

Updated `core/src/storage.ts` already done. **Add a new file `core/src/drive.ts`:**
```typescript
export interface DriveFileInfo {
  id: string;
  name: string;
  content: string;
  modifiedTime: string;
  mimeType?: string;
}

export interface DriveAdapter {
  getOrCreateFolderId(): Promise<string>;
  listDriveFiles(folderId: string): Promise<DriveFileInfo[]>;
  downloadFileContent(id: string, mimeType?: string): Promise<string>;
  uploadFile(folderId: string, name: string, content: string): Promise<DriveFileInfo>;
  updateFileContent(id: string, content: string): Promise<DriveFileInfo>;
  deleteFile(id: string): Promise<void>;
}
```

Update `core/src/sync.ts` signature:
```typescript
export async function runSync(
  store: LocalStore,
  drive: DriveAdapter,
  logger: SyncLogger,
  config: SyncConfig,
  onProgress: SyncCallback
): Promise<{ modifiedDates: string[]; conflictedDates: string[] }>
```

**Reasoning**: since `googleDrive.ts` is byte-identical between mobile and desktop, the cleanest is to make each platform pass its `googleDrive.ts` functions as a `DriveAdapter` literal. ~5 lines per wrapper. The alternative (moving `googleDrive.ts` into `core/`) was rejected because the Google Drive module imports from `googleapis` which is a heavy dep that mobile doesn't currently use — but actually, checking the current code, **both** desktop and mobile import from `googleapis` already. So a third option is to move `googleDrive.ts` into `core/` too. The executing agent should pick whichever is cleanest at the time. **My recommendation**: move `googleDrive.ts` to `core/src/googleDrive.ts` and have both platforms import from `@campfire/core`. This eliminates one more duplication.

**Create `core/tests/sync.test.ts`** by merging `src/services/sync/sync.test.ts` and `mobile/src/services/sync.test.ts`. Strategy:
- Use the `MockLocalStore` pattern (a `Map`-backed `LocalStore` impl).
- Use a `MockSyncLogger` that captures lines into an array (so tests can assert log content).
- Keep the Google Drive `vi.mock` as-is — the existing tests already mock it.
- Use `vi.mock('../src/googleDrive', ...)` to point at the new core path.
- Cover all the test cases from both files. The mobile test file has a smaller set; the desktop one is more comprehensive (Google Docs handling, regression tests for bulk delete, etc.). The unified test file should include all desktop tests (which are a superset).
- Use `runSync(mockStore, mockDrive, mockLogger, { conflictLabel: 'Desktop' }, mockProgressCallback)`.

**Create `core/tests/exportJournal.test.ts`** by moving `mobile/src/lib/exportJournal.test.ts` verbatim. Update the import path: `from '../src/exportJournal'` if the helper moves to `core/`, or keep it in `mobile/src/lib/` and have the test import via a relative path. **My recommendation**: keep `exportJournal.ts` in mobile for now (it's only used in mobile's `SettingsModal.tsx`). The test file in `core/tests/` can import from `../../mobile/src/lib/exportJournal.ts` if a path alias is set up, or the agent can copy the helpers (`buildMarkdown`, `buildJson`, `wordCount`, `defaultExportFilename`) into `core/src/exportJournal.ts` and have `mobile/src/lib/exportJournal.ts` re-export them. The latter is cleaner long-term.

### Checkpoint C — write the two adapters and rewire both `sync.ts` to be thin wrappers

**Create `mobile/src/services/dexieLocalStore.ts`:**
```typescript
import { db, type LocalJournalEntry } from './db';
import type { LocalEntry, LocalStore } from '@campfire/core';

export class DexieLocalStore implements LocalStore {
  async list(): Promise<LocalEntry[]> {
    const rows = await db.entries.orderBy('date').reverse().toArray();
    return rows.map(toCore);
  }
  async get(date: string) {
    const row = await db.entries.get(date);
    return row ? toCore(row) : undefined;
  }
  async put(entry: LocalEntry) {
    await db.entries.put({
      date: entry.date,
      content: entry.content,
      lastModified: entry.lastModified,
      synced: entry.synced,
      baseContent: entry.baseContent,
    });
  }
  async update(date: string, patch: Partial<LocalEntry>) {
    const existing = await db.entries.get(date);
    if (!existing) return;
    await db.entries.update(date, {
      ...(patch.content !== undefined ? { content: patch.content } : {}),
      ...(patch.lastModified !== undefined ? { lastModified: patch.lastModified } : {}),
      ...(patch.synced !== undefined ? { synced: patch.synced } : {}),
      ...(patch.baseContent !== undefined ? { baseContent: patch.baseContent } : {}),
    });
  }
  async delete(date: string) { await db.entries.delete(date); }
  async readSyncBase(date: string): Promise<string> {
    const row = await db.entries.get(date);
    return row?.baseContent ?? '';
  }
  async writeSyncBase(date: string, content: string) {
    await this.update(date, { baseContent: content });
  }
  async deleteSyncBase(date: string) {
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
```

**Create `mobile/src/services/localStorageLogger.ts`:**
```typescript
import type { SyncLogger } from '@campfire/core';

export const localStorageLogger: SyncLogger = {
  log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    try {
      const existing = localStorage.getItem('past_you_sync_logs');
      const logs = existing ? JSON.parse(existing) : [];
      logs.push(logLine);
      if (logs.length > 100) logs.shift();
      localStorage.setItem('past_you_sync_logs', JSON.stringify(logs));
    } catch { /* fallback */ }
  },
};
```

**Rewrite `mobile/src/services/sync.ts`** to be a thin wrapper:
```typescript
import { runSync as coreRunSync, type SyncCallback, type SyncProgress } from '@campfire/core';
import { DexieLocalStore } from './dexieLocalStore';
import { localStorageLogger } from './localStorageLogger';
import { getOrCreateFolderId, listDriveFiles, downloadFileContent, uploadFile, updateFileContent, deleteFile } from './googleDrive';

export type { SyncProgress };

export async function runSync(onProgress: SyncCallback) {
  const drive = { getOrCreateFolderId, listDriveFiles, downloadFileContent, uploadFile, updateFileContent, deleteFile };
  return coreRunSync(
    new DexieLocalStore(),
    drive,
    localStorageLogger,
    { conflictLabel: 'Mobile' },
    onProgress,
  );
}
```

**Replace `mobile/src/services/merge.ts`** with a re-export:
```typescript
export { buildConflictBlock, hasConflictMarkers } from '@campfire/core';
```

**Create `desktop/src/services/sync/tauriLocalStore.ts`:**
```typescript
import { invoke } from '@tauri-apps/api/core';
import type { LocalEntry, LocalStore } from '@campfire/core';

export class TauriLocalStore implements LocalStore {
  constructor(private journalDir: string) {
    if (!journalDir) throw new Error('Journal storage directory is not configured.');
  }
  async list(): Promise<LocalEntry[]> {
    const rows = await invoke<Array<{ date: string; content: string; last_modified: number }>>(
      'list_local_entries_for_sync', { dirPath: this.journalDir }
    );
    return rows.map(r => ({ date: r.date, content: r.content, lastModified: r.last_modified, synced: false }));
  }
  async get(date: string): Promise<LocalEntry | undefined> {
    // The Tauri side has no `get_entry` command in the sync hot path. Use list+filter.
    const all = await this.list();
    return all.find(e => e.date === date);
  }
  async put(entry: LocalEntry) {
    await invoke('write_entry_with_timestamp', {
      dirPath: this.journalDir,
      date: entry.date,
      content: entry.content,
      timestampMs: entry.lastModified,
    });
  }
  async update(date: string, patch: Partial<LocalEntry>) {
    if (patch.content !== undefined) {
      await invoke('write_entry_with_timestamp', {
        dirPath: this.journalDir,
        date,
        content: patch.content,
        timestampMs: patch.lastModified ?? Date.now(),
      });
    }
    if (patch.lastModified !== undefined) {
      await invoke('set_file_timestamp', { dirPath: this.journalDir, date, timestampMs: patch.lastModified });
    }
  }
  async delete(date: string) {
    await invoke('delete_entry', { dirPath: this.journalDir, date });
  }
  async readSyncBase(date: string) {
    return await invoke<string>('read_sync_base', { dirPath: this.journalDir, date });
  }
  async writeSyncBase(date: string, content: string) {
    await invoke('write_sync_base', { dirPath: this.journalDir, date, content });
  }
  async deleteSyncBase(date: string) {
    await invoke('delete_sync_base', { dirPath: this.journalDir, date });
  }
}
```

**Rewrite `desktop/src/services/sync/sync.ts`** to be a thin wrapper:
```typescript
import { runSync as coreRunSync, type SyncCallback, type SyncProgress } from '@campfire/core';
import { TauriLocalStore } from './tauriLocalStore';
import { getOrCreateFolderId, listDriveFiles, downloadFileContent, uploadFile, updateFileContent, deleteFile } from '../googleDrive';

export type { SyncProgress };

export async function runSync(journalDir: string, onProgress: SyncCallback) {
  const drive = { getOrCreateFolderId, listDriveFiles, downloadFileContent, uploadFile, updateFileContent, deleteFile };
  return coreRunSync(
    new TauriLocalStore(journalDir),
    drive,
    console, // log -> console.log
    { conflictLabel: 'Desktop' },
    onProgress,
  );
}
```

**Delete `desktop/src/services/sync/sync.test.ts`** (moved to `core/tests/sync.test.ts`).

**Delete `desktop/src/services/merge.ts`** (replaced by `desktop/src/services/sync/merge.ts` which re-exports from core):
```typescript
export { buildConflictBlock, hasConflictMarkers } from '@campfire/core';
```

### Checkpoint D — move root files into `desktop/`

**The moving strategy**: use `git mv` so file history is preserved. The agent should run these from the repo root.

**Step 1: create `desktop/` and `core/` directories.**

**Step 2: move files (use `git mv <old> <new>` for each):**
```bash
# Configs
git mv package.json desktop/package.json
git mv tsconfig.json desktop/tsconfig.json
git mv tsconfig.node.json desktop/tsconfig.node.json
git mv vite.config.ts desktop/vite.config.ts
git mv index.html desktop/index.html
git mv ask.html desktop/ask.html
git mv mojeek.html desktop/mojeek.html
git mv Modelfile desktop/Modelfile
git mv run_dev.bat desktop/run_dev.bat
git mv public desktop/public
git mv scripts desktop/scripts
git mv src desktop/src
git mv src-tauri desktop/src-tauri
```

**Step 3: update each moved file's internal references.** The agent needs to grep each file for relative paths and update them. Known places to update:
- `desktop/vite.config.ts` — any reference to `../` paths (probably none, the desktop doesn't reach outside itself)
- `desktop/run_dev.bat` — references `npm run dev`, which now lives in `desktop/package.json`. Should be updated or kept absolute.
- `desktop/index.html`, `desktop/ask.html`, `desktop/mojeek.html` — `<script src="/src/main.tsx">` paths. These are usually absolute for the dev server, so probably fine.
- `desktop/src-tauri/tauri.conf.json` — **`frontendDist: "../dist"`** must become **`frontendDist: "../../dist"`** (relative to `desktop/src-tauri/tauri.conf.json`, the dist is at `desktop/dist/`, which is `../../dist` from `src-tauri/`).

  Wait — let me recompute. `tauri.conf.json` is at `desktop/src-tauri/tauri.conf.json`. The frontend dist is at `desktop/dist/`. The relative path from `tauri.conf.json` to `desktop/dist/` is `../dist` (one level up out of `src-tauri/` lands in `desktop/`). So **`frontendDist` should stay `"../dist"`**! No change needed.
- `desktop/src-tauri/Cargo.toml` — should not need changes (Cargo doesn't reference external paths in this file)
- `desktop/src-tauri/src/main.rs` and other Rust files — agent should `grep` for `include_str!`, `include_bytes!`, or any path literals and update if needed. Most likely none, since Tauri embeds resources via the config.

**Step 4: create the new workspace root `package.json`:**
```json
{
  "name": "campfire",
  "private": true,
  "version": "0.1.0",
  "workspaces": ["core", "mobile", "desktop"],
  "scripts": {
    "test": "npm test --workspaces --if-present",
    "build:mobile": "npm run build -w mobile",
    "build:desktop": "npm run build -w desktop",
    "dev:mobile": "npm run dev -w mobile",
    "dev:desktop": "npm run dev -w desktop"
  },
  "devDependencies": {
    "typescript": "~5.8.3"
  }
}
```

**Step 5: create `tsconfig.base.json` at the repo root** with shared compiler options that get extended by each package's `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

Then each package's `tsconfig.json` extends this:
- `core/tsconfig.json`: `"extends": "../tsconfig.base.json"`, add `"include": ["src", "tests"]`
- `mobile/tsconfig.json`: `"extends": "../tsconfig.base.json"`, keep the existing structure
- `desktop/tsconfig.json`: `"extends": "../tsconfig.base.json"`, keep the existing structure

**Step 6: add a path alias for `@campfire/core` everywhere it's needed.** Two ways:
- (A) `tsconfig.json` paths: `"paths": { "@campfire/core": ["../core/src"] }` in each consuming package's `tsconfig.json`
- (B) `vite.config.ts` `resolve.alias`: `path.resolve(__dirname, '../core/src')`

Both must be set. TypeScript uses (A) for type checking, Vite uses (B) at build time.

**Step 7: update `mobile/package.json`:**
- Add `"vitest": "^4.1.10"` to `devDependencies`
- Add `"@campfire/core": "*"` to `dependencies` (the `*` means "use the workspace version", npm workspaces handles this)
- Add `"test": "vitest run"` to `scripts`

**Step 8: update `desktop/package.json`** (the file moved from root):
- Add `"@campfire/core": "*"` to `dependencies`
- The root `package.json` already has `"test": "vitest run"`, but after move it's in `desktop/package.json`. Make sure scripts are correct.

**Step 9: update `mobile/tsconfig.app.json`**:
```json
{
  "compilerOptions": { /* ... existing ... */ },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

This is the **immediate fix** for the Cloudflare Pages build failure. `tsc -b` will now skip test files.

### Checkpoint E — delete the duplicate mobile test files and update CI

**Delete `mobile/src/services/sync.test.ts`** (moved to `core/tests/sync.test.ts`).

**Delete `mobile/src/lib/exportJournal.test.ts`** (moved to `core/tests/exportJournal.test.ts`).

**Update `.github/workflows/sync-tests.yml` → rename to `tests.yml`:**
```yaml
name: Tests

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install workspace dependencies
        run: npm ci

      - name: Run core tests
        run: npm test -w @campfire/core

      - name: Run mobile tests
        run: npm test -w mobile

      - name: Run desktop tests
        run: npm test -w desktop

      - name: Build mobile (smoke test)
        run: npm run build -w mobile

      - name: Type-check desktop
        run: npm run typecheck -w desktop
```

Note: the **Cloudflare Pages build itself is separate from this workflow**. The user has a separate Pages project pointed at `mobile/` (the project root for the Pages build is `mobile/`). Pages does `npm install && npm run build` in `mobile/`. After the refactor, that build should succeed because (a) `vitest` is in mobile's devDeps so the typecheck passes, and (b) tests are excluded from the app typecheck.

**Verify locally before committing:**

```bash
# From repo root
npm install                          # installs all workspaces
npm test -w @campfire/core           # runs core tests
npm test -w mobile                   # runs mobile tests (now empty suite is fine)
npm test -w desktop                  # runs desktop tests
npm run build -w mobile              # the Pages build command
npm run typecheck -w desktop         # desktop typecheck
```

All should pass before commit.

---

## 4. Tauri files — DO NOT TOUCH, list for the user

The executing agent MUST NOT edit these files. After committing, the agent should produce a hand-off message listing these for the user to verify and update:

1. **`desktop/src-tauri/tauri.conf.json`** — `build.frontendDist` is currently `"../dist"`. Relative to `desktop/src-tauri/tauri.conf.json`, this resolves to `desktop/dist/` (one level up). Verify this is what `vite build` produces when run from `desktop/`. If `vite build` outputs to `desktop/dist/`, no change needed. If it outputs elsewhere, update.

2. **`desktop/src-tauri/Cargo.toml`** — verify `[lib] name = "tauri_app_lib"` still resolves correctly. No external paths in this file. Likely needs no change.

3. **`desktop/src-tauri/build.rs`** — just `tauri_build::build()`. No change.

4. **`desktop/src-tauri/src/main.rs`** and **`lib.rs`** — these are the Rust entry points. They reference `tauri.conf.json` by path. The Tauri build system resolves this relative to the crate root (`desktop/src-tauri/`), so the move shouldn't break anything. But the user should run `cargo check` (or just `tauri dev`) to confirm.

5. **`desktop/src-tauri/capabilities/`** and **`gen/`** — Tauri generates these. Should be fine after move.

6. **`run_dev.bat`** — the user runs this to start the desktop dev server. It's at `desktop/run_dev.bat` after the move. Update any hardcoded paths inside (it probably has `cd /d %~dp0\..\` or similar that might need tweaking).

The user should:
- Run `npm install` from the new repo root
- Run `npm run dev -w desktop` to launch the Tauri app
- Confirm Google Drive auth + sync works end-to-end
- Run `npm run tauri dev` or `tauri dev` from `desktop/` to launch the full Tauri shell

---

## 5. Risks and edge cases

| Risk | Mitigation |
|---|---|
| `tsconfig.app.json` exclude pattern doesn't match `*.test.ts` files in subdirs | Use `src/**/*.test.ts` (the `**` is glob for any depth) |
| Path alias `@campfire/core` doesn't resolve in Vitest | Add `resolve.alias` to `core/vitest.config.ts` too |
| Tauri commands have different names than expected | The agent should `grep` `src-tauri/src/commands/journal/` for `#[tauri::command]` and cross-check against the `TauriLocalStore` adapter |
| The `local && !remote` branch has different behavior in the two originals | Use the desktop's stricter logic (reads base first, then decides). Mobile's old behavior was a subset. |
| Conflict block labels lost | Verified handled via `SyncConfig.conflictLabel` |
| `googleDrive.ts` has a `mtime` field in the type that's a `string` (ISO), but the engine calls `new Date().getTime()` on it | This is existing behavior. Preserve as-is. |
| The `LocalStore.put` in mobile needs `synced: false` initially, but the engine passes `synced: true` after upload | The engine sets `synced: true` explicitly via `update()` after `put()`. The Tauri adapter's `put` doesn't set `synced`. The Dexie adapter's `put` does set it from the engine's value. Verify by running the desktop "Create & Sync" test post-refactor. |
| `tsc -b` in mobile still picks up `src/lib/exportJournal.ts` even after we exclude tests | The exclude only affects `*.test.ts` files, not the source files. Source files compile fine. |

---

## 6. What success looks like

After commit + user verifies Tauri files:

1. `npm install` at repo root installs all three workspaces.
2. `npm test -w @campfire/core` runs the unified sync + export tests, all pass.
3. `npm test -w mobile` runs (empty suite or no-op, exits 0).
4. `npm test -w desktop` runs (empty suite or no-op, exits 0). Original sync tests are gone from here, moved to core.
5. `npm run build -w mobile` succeeds — **this fixes the Cloudflare Pages build**.
6. `tauri dev` from `desktop/` launches the desktop app, Google Drive auth works, sync to/from a journal entry works.
7. The phone's PWA at `campfire-71w.pages.dev` reloads with the new bundle and the "Export MD" button works (no more "Export TXT").

---

## 7. Files created / modified / deleted (full list)

**New files (in `core/`):**
- `core/package.json`
- `core/tsconfig.json`
- `core/vitest.config.ts`
- `core/src/index.ts`
- `core/src/types.ts`
- `core/src/storage.ts`
- `core/src/logger.ts`
- `core/src/merge.ts`
- `core/src/sync.ts`
- `core/src/drive.ts`
- `core/tests/sync.test.ts`
- `core/tests/exportJournal.test.ts`

**New files (in `mobile/src/services/`):**
- `mobile/src/services/dexieLocalStore.ts`
- `mobile/src/services/localStorageLogger.ts`

**New files (in `desktop/src/services/sync/`):**
- `desktop/src/services/sync/tauriLocalStore.ts`

**New files (workspace root):**
- `package.json` (replaces root package.json)
- `tsconfig.base.json`

**Modified files (engine rewrites):**
- `mobile/src/services/sync.ts` (rewritten as thin wrapper)
- `mobile/src/services/merge.ts` (rewritten as re-export)
- `mobile/src/services/googleDrive.ts` (unchanged, but `mobile/src/services/merge.ts` now re-exports)
- `desktop/src/services/sync/sync.ts` (rewritten as thin wrapper)
- `desktop/src/services/sync/merge.ts` (rewritten as re-export, replaces `desktop/src/services/merge.ts`)
- `mobile/package.json` (+ vitest, + @campfire/core, + test script)
- `mobile/tsconfig.app.json` (+ exclude)
- `mobile/vite.config.ts` (+ @campfire/core alias)
- `mobile/tsconfig.json` (+ @campfire/core paths, extends base)
- `desktop/package.json` (the moved file, + @campfire/core)
- `desktop/tsconfig.json` (extends base, + @campfire/core paths)
- `desktop/tsconfig.node.json` (extends base)
- `desktop/vite.config.ts` (+ @campfire/core alias)
- `core/vitest.config.ts` (+ resolve.alias for tests)

**Renamed / moved files (via `git mv`):**
- `package.json` → `desktop/package.json`
- `tsconfig.json` → `desktop/tsconfig.json`
- `tsconfig.node.json` → `desktop/tsconfig.node.json`
- `vite.config.ts` → `desktop/vite.config.ts`
- `index.html` → `desktop/index.html`
- `ask.html` → `desktop/ask.html`
- `mojeek.html` → `desktop/mojeek.html`
- `Modelfile` → `desktop/Modelfile`
- `run_dev.bat` → `desktop/run_dev.bat`
- `public/` → `desktop/public/`
- `scripts/` → `desktop/scripts/`
- `src/` → `desktop/src/`
- `src-tauri/` → `desktop/src-tauri/`
- `.github/workflows/sync-tests.yml` → `.github/workflows/tests.yml`

**Deleted files:**
- `mobile/src/services/sync.test.ts`
- `mobile/src/lib/exportJournal.test.ts`
- `desktop/src/services/sync/sync.test.ts`
- `desktop/src/services/merge.ts` (replaced by `desktop/src/services/sync/merge.ts`)

**Files the USER must review (not touched by the agent):**
- `desktop/src-tauri/Cargo.toml`
- `desktop/src-tauri/tauri.conf.json`
- `desktop/src-tauri/build.rs`
- `desktop/src-tauri/src/main.rs`
- `desktop/src-tauri/src/lib.rs`
- `desktop/src-tauri/capabilities/` (generated, should be fine)
- `desktop/src-tauri/gen/` (generated, should be fine)
- `desktop/run_dev.bat` (paths may need updating)

---

## 8. Commit message template

```
refactor: extract shared core/ sync engine, migrate to npm workspaces

The mobile PWA and the Tauri desktop app both implement the same Google
Drive <-> local-file sync algorithm. The code was duplicated across
src/services/sync/sync.ts (303 lines) and mobile/src/services/sync.ts
(297 lines), with merge.ts and googleDrive.ts also duplicated (the latter
two were byte-identical).

This refactor extracts the sync algorithm into a new @campfire/core
package and migrates the repo to a full npm workspaces layout
(core, mobile, desktop).

Key changes:
- New core/ package: LocalStore interface, SyncConfig (with
  conflictLabel), DriveAdapter interface, consoleLogger, plus the
  runSync engine.
- New DexieLocalStore adapter for mobile (wraps Dexie).
- New TauriLocalStore adapter for desktop (wraps Tauri invoke()).
- Both sync.ts files become ~12-line thin wrappers that inject their
  adapter into the core engine.
- Both merge.ts files become re-exports from @campfire/core.
- Desktop moves from repo root into desktop/.
- Both sync.test.ts files merge into core/tests/sync.test.ts using
  a MockLocalStore + MockSyncLogger.
- CI updated to run npm test in all three workspaces on every PR.
- mobile/tsconfig.app.json excludes *.test.ts files so Cloudflare
  Pages can type-check without vitest types (the immediate build
  failure this PR also fixes).

The Pages mobile build is unblocked as a side effect: vitest is now
a real devDep in mobile/, and tests are excluded from tsc -b.

Known follow-ups (for the user):
- Verify desktop/src-tauri/tauri.conf.json frontendDist path
- Verify desktop/src-tauri/Cargo.toml still resolves
- Run tauri dev from desktop/ to confirm the desktop app boots
- Update desktop/run_dev.bat paths if needed
```
