# Implementation Plan — Codebase Structure Modularization

Refactor codebase structure based on navigation audit recommendations to improve modularity, simplify code reading, and minimize token footprint for AI-agents.

## User Review Required

> [!NOTE]
> All changes are structural (splitting large components/modules into subfolders and cleanly exported submodules). There are no changes to existing app functionalities.

## Proposed Changes

---

### Rust Backend (`src-tauri/src/commands/`)

#### [NEW] [mod.rs](file:///d:/program/Campfire/src-tauri/src/commands/journal/mod.rs)
- Root of the `journal/` commands module. Declares and re-exports all commands and helper functions from submodules.

#### [NEW] [helpers.rs](file:///d:/program/Campfire/src-tauri/src/commands/journal/helpers.rs)
- Contains helper functions and types: `is_valid_date_file`, `extract_tags`, `extract_preview`, `set_file_timestamp_internal`, `JournalEntryMetadata`, `ExportedEntry`, and `LocalEntrySyncInfo`.

#### [NEW] [crud.rs](file:///d:/program/Campfire/src-tauri/src/commands/journal/crud.rs)
- Contains CRUD-related commands: `list_entries`, `read_entry`, `write_entry`, `delete_entry`, `delete_entries`, `get_journal_context`, and `get_journal_context_with_lines`.

#### [NEW] [sync.rs](file:///d:/program/Campfire/src-tauri/src/commands/journal/sync.rs)
- Contains sync-related commands: `list_local_entries_for_sync`, `write_entry_with_timestamp`, `set_file_timestamp`, `read_sync_base`, `write_sync_base`, and `delete_sync_base`.

#### [NEW] [export.rs](file:///d:/program/Campfire/src-tauri/src/commands/journal/export.rs)
- Contains the `export_journal` command.

#### [DELETE] [journal.rs](file:///d:/program/Campfire/src-tauri/src/commands/journal.rs)
- Original monolithic file containing all journal operations.

---

### AI Tools Consolidation (`src/services/tools/`)

Create a unified `tools` subdirectory to eliminate duplicate/overlapping files (`chatTools.ts` vs `toolExecutor.ts`).

#### [NEW] [index.ts](file:///d:/program/Campfire/src/services/tools/index.ts)
- Public interface for AI tools. Re-exports tool definitions, runtime executors, and context definitions.

#### [NEW] [definitions.ts](file:///d:/program/Campfire/src/services/tools/definitions.ts)
- Contains all tool schemas (`LOCAL_TOOLS`, `getWebSearchTool`). (Migrated from `src/services/chatTools.ts`).

#### [NEW] [executor.ts](file:///d:/program/Campfire/src/services/tools/executor.ts)
- Contains tool execution routing (`executeToolCall`, `findToolCallInput`, `ToolExecutionContext`). (Migrated from `src/services/toolExecutor.ts`).

#### [MODIFY] [toolExecutorPanel.tsx](file:///d:/program/Campfire/src/services/toolExecutorPanel.tsx)
- Update import paths to point to `./tools`.

#### [MODIFY] [useChatSession.ts](file:///d:/program/Campfire/src/hooks/chat/useChatSession.ts)
- Update imports of tools/executors to point to `../../services/tools`.

#### [MODIFY] [ChatMessageList.tsx](file:///d:/program/Campfire/src/views/chat/ChatMessageList.tsx)
- Update import of `findToolCallInput` to point to `../../services/tools`.

#### [DELETE] [chatTools.ts](file:///d:/program/Campfire/src/services/chatTools.ts)
- Removed in favor of `services/tools/`.

#### [DELETE] [toolExecutor.ts](file:///d:/program/Campfire/src/services/toolExecutor.ts)
- Removed in favor of `services/tools/`.

---

### Embeddings Refactoring (`src/services/embeddings/`)

Split the monolithic `embeddings.ts` file into a dedicated subfolder structure.

#### [NEW] [index.ts](file:///d:/program/Campfire/src/services/embeddings/index.ts)
- Main entry point that re-exports functions. Since imports throughout the codebase import from `services/embeddings`, referencing the folder index requires no path updates across other files.

#### [NEW] [utils.ts](file:///d:/program/Campfire/src/services/embeddings/utils.ts)
- Contains prefix utility helpers: `isEmbeddingModel`, `getDocumentPrefix`, `getQueryPrefix`, `getModelMetadata`, `dotProduct`, and `runWithConcurrency`.

#### [NEW] [cache.ts](file:///d:/program/Campfire/src/services/embeddings/cache.ts)
- Cache reading/writing helpers: `createEmptyCache`, `loadEmbeddingsCache`, `saveEmbeddingsCache`.

#### [NEW] [search.ts](file:///d:/program/Campfire/src/services/embeddings/search.ts)
- Index generation and semantic search logic: `fetchEmbeddings`, `buildEmbeddingIndex`, `performSemanticSearch`.

#### [DELETE] [embeddings.ts](file:///d:/program/Campfire/src/services/embeddings.ts)
- Removed in favor of `services/embeddings/`.

---

### Timeline View Refactoring (`src/views/timeline/`)

Split the monolithic `TimelineView.tsx` into a modularized view package.

#### [NEW] [index.tsx](file:///d:/program/Campfire/src/views/timeline/index.tsx)
- Export index for the view component.

#### [NEW] [TimelineHeader.tsx](file:///d:/program/Campfire/src/views/timeline/TimelineHeader.tsx)
- Contains the header section (filters, selections toolbar, click mode trigger).

#### [NEW] [TimelineView.tsx](file:///d:/program/Campfire/src/views/timeline/TimelineView.tsx)
- Contains the main timeline entries layout and scrolling logic.

#### [DELETE] [TimelineView.tsx](file:///d:/program/Campfire/src/views/TimelineView.tsx)
- Original root view component.

#### [MODIFY] [App.tsx](file:///d:/program/Campfire/src/App.tsx)
- Update timeline component import path.

---

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` on frontend to verify all TypeScript compiles cleanly.
- Run `cargo check` on Tauri backend to verify the Rust source code compiles cleanly.

### Manual Verification
- Ask the user to run the app using `npm run tauri dev` to verify that all parts (Timeline View, Search View, Ollama tool execution, config changes, etc.) work exactly as before.
