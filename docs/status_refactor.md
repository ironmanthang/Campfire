# Campfire Codebase Refactoring Status

## Completed
- **Phase 1: Split ChatSettingsModal.tsx**
  - Path: `src/components/chat/settings/`
  - Created `ChatInterfaceSection.tsx` (interface pref toggles)
  - Created `ChatToolsSection.tsx` (diagnostics & third-party search APIs)
  - Created `ChatSystemSection.tsx` (instruction mode overrides & prompts template helper)
  - Created thin `ChatSettingsModal.tsx` orchestrator shell
  - Cleaned up obsolete files and updated `src/components/chat/index.ts` re-export.
  - Verified compilation via TypeScript type-checks (0 errors).

- **Phase 2: Split JournalEditorView.tsx**
  - Path: `src/views/journal/`
  - Created `useJournalEditor.ts` (orchestration hook)
  - Created `useJournalSearch.ts` (Ctrl+F panel, overlay query, scroll highlights)
  - Created `useJournalSave.ts` (Tauri read/write, auto-save timers, focus clicks, tags)
  - Created sub-components: `JournalEditorHeader.tsx`, `JournalEditorPane.tsx`, `JournalPreviewPane.tsx`, `JournalEditorFooter.tsx`
  - Created thin orchestrator `JournalEditorView.tsx`
  - Relocated view to new domain sub-directory, cleaned up imports and deleted original file.
  - Verified compilation via TypeScript type-checks (0 errors) and confirmed all hook/component files are under 200 lines.


- **Phase 3: Move ChatView.tsx context out**
  - Path: `src/views/chat/`
  - Created `ChatContext.tsx` (ChatContextType interface + createContext + useChatContext hook)
  - Created `ChatDragOverlay.tsx` (glassmorphic drag-and-drop overlay UI)
  - Created `ChatMessageList.tsx` (scrollable message log, scroll refs/effects, queued messages)
  - Created thin `ChatView.tsx` orchestrator (provider + layout shell)
  - Updated `useChatContext` imports in: `ChatHeader`, `ChatInputFooter`, `ChatMessageBubble`, `ChatInterfaceSection`, `ChatToolsSection`
  - Updated `App.tsx` import. Retired old `src/views/ChatView.tsx`.
  - Verified compilation via TypeScript type-checks (0 errors).

- **Phase 4: Sidebar split**
  - Path: `src/components/sidebar/`
  - Created `SidebarBrandHeader.tsx` (logo, inline-editable title/subtitle, collapse chevron)
  - Created `SidebarNavItem.tsx` (reusable nav button atom)
  - Created thin `Sidebar.tsx` orchestrator shell + hover-peek logic + footer actions
  - Created `index.ts` barrel export
  - Updated `App.tsx` import. Retired old `src/components/Sidebar.tsx`.
  - Verified compilation via TypeScript type-checks (0 errors).

- **Phase 5: Store slices**
  - Path: `src/store/slices/`
  - Created `configSlice.ts` (app configurations, loads, updates, theme changes, directory selectors, export actions)
  - Created `syncSlice.ts` (Google Drive connections, authentication flow, file sync handler loop, backup routines)
  - Created `navigationSlice.ts` (application view routing context and navigation history stack)
  - Created `uiSlice.ts` (status messages, journal refresh keys, active date markers, side-nav collapse state)
  - Composed the unified store in `src/store/useAppStore.ts` using Zustand slices composition
  - Verified compilation via TypeScript type-checks (0 errors).

- **Phase 6: Move useChatSession.ts to hooks/chat/**
  - Path: `src/hooks/chat/`
  - Moved `useChatSession.ts` to `src/hooks/chat/useChatSession.ts`
  - Cleaned up the old `src/hooks/useChatSession.ts` from disk
  - Updated importing references in `src/views/chat/ChatView.tsx`
  - Verified compilation via TypeScript type-checks (0 errors).

- **Phase 7: Refactor embeddings.ts into folder**
  - Path: `src/services/embeddings/`
  - Created `utils.ts` (prefix helpers, `dotProduct`, `runWithConcurrency`, model metadata)
  - Created `cache.ts` (`createEmptyCache`, `loadEmbeddingsCache`, `saveEmbeddingsCache`)
  - Created `search.ts` (`buildEmbeddingIndex`, `performSemanticSearch`)
  - Created `index.ts` barrel re-exporting the public surface
  - Removed monolithic `src/services/embeddings.ts`
  - Folder index keeps `import ... from "../services/embeddings"` stable across consumers
  - Verified compilation via TypeScript type-checks (0 errors).

- **Phase 8: Refactor Rust journal.rs into journal/ module**
  - Path: `src-tauri/src/commands/journal/`
  - Created `helpers.rs` (types + pure parsing: `is_valid_date_file`, `extract_tags`, `extract_preview`, `JournalEntryMetadata`, `ExportedEntry`)
  - Created `crud.rs` (CRUD + context + export)
  - Created `sync.rs` (sync commands: `list_local_entries_for_sync`, `write_entry_with_timestamp`, `set_file_timestamp`, `read/write/delete_sync_base`)
  - Created `sync_helpers.rs` (`set_file_timestamp_internal`, kept private)
  - Created `mod.rs` with flat re-exports so `lib.rs` `tauri::generate_handler!` paths and `commands::embeddings` / `commands::search` imports keep working unchanged
  - Removed monolithic `src-tauri/src/commands/journal.rs`
  - Verified compilation via `cargo check` (0 errors, 0 warnings).

- **Phase 9: Consolidate chatTools + toolExecutor into services/tools/**
  - Path: `src/services/tools/`
  - Created `definitions.ts` (tool schemas: `LOCAL_TOOLS`, `getWebSearchTool`)
  - Created `executor.ts` (runtime: `executeToolCall`, `findToolCallInput`, `ToolExecutionContext`)
  - Created `index.ts` barrel re-exporting the public surface
  - Updated 4 importers: `useChatSession.ts`, `ChatMessageList.tsx`, `toolExecutorPanel.tsx`, plus the dev panel
  - Removed `src/services/chatTools.ts` and `src/services/toolExecutor.ts`
  - Verified compilation via TypeScript type-checks (0 errors).

- **Phase 10: Split TimelineView into timeline/ subfolder**
  - Path: `src/views/timeline/`
  - Created `TimelineHeader.tsx` (header + selection toolbar + click-mode toggle, owns its own i18n label props)
  - Created `TimelineEntryList.tsx` (month grouping, sticky-header markup, lazy load-more, `TimelineEntryCard` mapping)
  - Created `TimelineView.tsx` orchestrator (state, data loading, scroll container, sticky-header fade)
  - Created `index.tsx` barrel re-exporting `TimelineView`
  - Removed monolithic `src/views/TimelineView.tsx`; `App.tsx` continues to use `./views/timeline` (resolves to the new `index.tsx`)
  - Sticky-header fade logic moved from the entry list into the orchestrator, which owns the actual scroll container, preserving behavior
  - Verified compilation via TypeScript type-checks (0 errors).
