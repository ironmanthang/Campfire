// Re-export from @campfire/core. The actual merge engine lives in
// core/src/merge.ts. Both platforms share the same implementation; this
// file exists so existing imports of './merge' keep working.
export { buildConflictBlock, hasConflictMarkers } from '@campfire/core';
