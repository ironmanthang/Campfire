# Campfire Architecture

This document describes the design decisions, schemas, backend API contracts, and directory layouts implemented across the Campfire offline-first journaling application.

---

## Workspace Structure

Campfire is organized as a pnpm monorepo containing three primary packages:

- **`core` (`@campfire/core`)**: Pure TypeScript library containing platform-agnostic business logic, storage contracts, streak calculation, import/export transformations, and sync merging algorithms. Free of DOM and platform dependencies.
- **`desktop`**: Tauri v2 desktop application written in React 19 + TypeScript + Vite + Tailwind CSS v4, utilizing native Rust commands for filesystem I/O and local Ollama integrations.
- **`mobile`**: Mobile Progressive Web App (PWA) written in React 19 + TypeScript + Vite + Tailwind CSS v4, backed by Dexie.js (IndexedDB) for local-first storage and Google Drive OAuth REST sync.

---

## Storage Architecture & Schemas

### Journal Entries Storage

- **Desktop Storage**: Entries are saved directly as flat Markdown files in the user-selected journal directory. Filenames follow the strict ISO standard `YYYY-MM-DD.md`.
- **Mobile Storage**: Entries are persisted in IndexedDB via Dexie (`CampfireDatabase`, version 2). The `entries` table stores objects indexed by `date, lastModified, synced`:
  - `date`: String formatted as `YYYY-MM-DD`
  - `content`: String markdown body
  - `lastModified`: Unix timestamp in milliseconds
  - `synced`: Boolean sync flag
  - `baseContent`: Optional common ancestor string for 3-way merge conflict resolution
  - `isLocked`: Optional boolean entry privacy lock state

### Scratchpad & Hierarchical Tasks Storage

- **Data Model (`core/src/scratchpad/types.ts`)**:
  - `ScratchpadItem`:
    - `id`: Stable UUID string
    - `text`: Item title or markdown content
    - `isChecked`: Boolean completion state
    - `isGroup`: Optional boolean identifying named section containers
    - `children`: Recursive array of child `ScratchpadItem` nodes
    - `createdAt` / `updatedAt`: Milliseconds unix timestamps
  - `ScratchpadDocument`:
    - `version`: Version integer (currently `1`)
    - `items`: Array of root `ScratchpadItem` nodes
- **Desktop Scratchpad Backend**: Stored as a JSON-serialized `ScratchpadDocument` inside `scratchpad` file in the journal folder. `desktop/src/services/scratchpad.ts` automatically detects legacy flat markdown formats and migrates them transparently.
- **Mobile Scratchpad Backend**: Stored in a dedicated Dexie table (`scratchpad`, introduced in Dexie schema v2). Keyed by `'scratchpad'`, fully decoupled from journal entries.

---

## Scratchpad & Note Architecture

The scratchpad is promoted to a first-class routed view across both platforms:

- **Desktop View Navigation**: Added `"scratchpad"` to `useAppStore` view router. Rendered in `desktop/src/views/ScratchpadView.tsx` with hierarchical task rendering (`ScratchpadItemRow.tsx`), collapsible groups, inline task addition, and clear-completed capabilities.
- **Mobile View Navigation**: Swapped via header toggle between `"journal"` and `"scratchpad"` view states in `mobile/src/App.tsx`. Renders `mobile/src/components/scratchpad/ScratchpadView.tsx` with dedicated mobile touch interactions and `enterKeyHint="done"`.
- **Shared Hook Pattern**: Both platforms consume `useScratchpad()`, mapping canonical state actions (`toggleItemWithChildren`, `addItem`, `addChildItem`, `addGroup`, `renameGroup`, `removeItem`, `clearCompleted`) directly to pure functions in `@campfire/core`.

---

## Desktop Backend Command API (Rust/Tauri)

Registered in `src-tauri/src/lib.rs` and exposed to the desktop UI via `@tauri-apps/api/core`:

| Command Name | Arguments | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `load_config` | None | `Result<AppConfig, String>` | Reads and parses `config.json` from OS AppData folder. |
| `save_config` | `config: AppConfig` | `Result<(), String>` | Writes updated user settings to disk. |
| `list_entries` | `dirPath: String` | `Result<Vec<JournalEntryMetadata>, String>` | Scans folder, computes word counts and extracted tags. |
| `read_entry` | `dirPath: String`, `date: String` | `Result<String, String>` | Reads `[date].md` or `scratchpad` file contents. |
| `write_entry` | `dirPath: String`, `date: String`, `content: String` | `Result<(), String>` | Writes markdown or JSON content to target file. |
| `search_entries` | `dirPath: String`, `query: String` | `Result<Vec<SearchResult>, String>` | Scans date files case-insensitively for matches. |
| `export_journal` | `dirPath: String`, `exportType: String`, `savePath: String` | `Result<(), String>` | Exports concatenated entries to text, markdown, or JSON. |

---

## AI & Local LLM Integration (Ollama)

Desktop integrates directly with local models via Ollama at `http://localhost:11434`:

- **Client Services**: Exposed in `desktop/src/services/ollama/` for health checks, model pulling, embedding generation, and tokenization.
- **Streaming & Reasoning**: Streams both final text tokens and reasoning thought processes (`<think>` blocks) from `/api/chat`.
- **Token Metering**: Dynamically queries model context parameters (`num_ctx`) with fallbacks to avoid context overflow.

---

## Styling & Theme System

Built with Tailwind CSS v4 and vanilla CSS tokens:

- **Typography**: Google Fonts Outfit superfamily.
- **Color Palettes**:
  - Light mode: Low-contrast warm cream (`--color-bg-app: #FAF8F5`, `--color-bg-surface: #F0ECE3`).
  - Dark mode: Warm charcoal surfaces (`--color-bg-app: #141210`, `--color-bg-surface: #1C1917`).
- **Responsive Layout**: Resizable navigation panels and drag-handle bounds managed via `useResizer`.
