// Re-export from @campfire/core. The actual merge engine lives in
// core/src/merge.ts. Both platforms share the same implementation.
export { buildConflictBlock, hasConflictMarkers, parseConflictBlock, resolveConflictKeepBoth } from '@campfire/core';
