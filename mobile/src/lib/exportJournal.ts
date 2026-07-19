// Re-export from @campfire/core. The actual helpers (buildMarkdown,
// buildJson, wordCount, defaultExportFilename, etc.) live in
// core/src/exportJournal.ts. This file exists so existing imports of
// './lib/exportJournal' keep working on mobile.
export {
  buildJson,
  buildMarkdown,
  wordCount,
  exportAsMarkdown,
  exportAsJson,
  downloadBlob,
  defaultExportFilename,
  type ExportableEntry,
  type ExportedJsonEntry,
} from '@campfire/core';
