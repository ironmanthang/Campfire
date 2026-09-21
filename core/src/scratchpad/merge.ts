import type { ScratchpadItem } from './types';
import { generateId } from './id';
import { fromDocument, toDocument } from './migration';

export interface ScratchpadMergeResult {
  merged: string;
  hasConflict: boolean;
}

function itemsEqual(a: ScratchpadItem, b: ScratchpadItem): boolean {
  return (
    a.text === b.text &&
    a.isChecked === b.isChecked &&
    Boolean(a.isGroup) === Boolean(b.isGroup) &&
    Boolean(a.isPinned) === Boolean(b.isPinned)
  );
}

function mergeItemList(
  baseList: ScratchpadItem[],
  localList: ScratchpadItem[],
  remoteList: ScratchpadItem[]
): { items: ScratchpadItem[]; hasConflict: boolean } {
  const baseMap = new Map<string, ScratchpadItem>();
  for (const item of baseList) baseMap.set(item.id, item);

  const localMap = new Map<string, ScratchpadItem>();
  for (const item of localList) localMap.set(item.id, item);

  const remoteMap = new Map<string, ScratchpadItem>();
  for (const item of remoteList) remoteMap.set(item.id, item);

  const allIds: string[] = [];
  const seenIds = new Set<string>();

  for (const item of localList) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      allIds.push(item.id);
    }
  }

  for (const item of remoteList) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      allIds.push(item.id);
    }
  }

  let hasConflict = false;
  const mergedItems: ScratchpadItem[] = [];

  for (const id of allIds) {
    const base = baseMap.get(id);
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    // Case 1: Exists only in local (added locally)
    if (local && !base && !remote) {
      mergedItems.push(local);
      continue;
    }

    // Case 2: Exists only in remote (added remotely)
    if (remote && !base && !local) {
      mergedItems.push(remote);
      continue;
    }

    // Case 3: Existed in base, deleted locally
    if (!local && base && remote) {
      if (remote.updatedAt > base.updatedAt || !itemsEqual(remote, base)) {
        mergedItems.push(remote);
      }
      continue;
    }

    // Case 4: Existed in base, deleted remotely
    if (local && base && !remote) {
      if (local.updatedAt > base.updatedAt || !itemsEqual(local, base)) {
        mergedItems.push(local);
      }
      continue;
    }

    // Case 5: Exists in both local and remote
    if (local && remote) {
      const childMerge = mergeItemList(
        base?.children || [],
        local.children || [],
        remote.children || []
      );
      if (childMerge.hasConflict) {
        hasConflict = true;
      }

      if (itemsEqual(local, remote)) {
        mergedItems.push({
          ...local,
          updatedAt: Math.max(local.updatedAt, remote.updatedAt),
          children: childMerge.items,
        });
      } else if (base && itemsEqual(remote, base) && !itemsEqual(local, base)) {
        mergedItems.push({
          ...local,
          children: childMerge.items,
        });
      } else if (base && itemsEqual(local, base) && !itemsEqual(remote, base)) {
        mergedItems.push({
          ...remote,
          children: childMerge.items,
        });
      } else {
        if (local.updatedAt > remote.updatedAt) {
          mergedItems.push({
            ...local,
            children: childMerge.items,
          });
        } else if (remote.updatedAt > local.updatedAt) {
          mergedItems.push({
            ...remote,
            children: childMerge.items,
          });
        } else {
          if (local.text === remote.text) {
            mergedItems.push({
              ...local,
              isChecked: local.isChecked || remote.isChecked,
              isPinned: Boolean(local.isPinned || remote.isPinned),
              isGroup: Boolean(local.isGroup || remote.isGroup),
              children: childMerge.items,
            });
          } else {
            hasConflict = true;
            mergedItems.push({
              ...local,
              children: childMerge.items,
            });
          }
        }
      }
    }
  }

  const pinned = mergedItems.filter((i) => Boolean(i.isPinned));
  const unpinned = mergedItems.filter((i) => !i.isPinned);

  return {
    items: [...pinned, ...unpinned],
    hasConflict,
  };
}

export function mergeScratchpadDocs(
  baseJson: string,
  localJson: string,
  remoteJson: string
): ScratchpadMergeResult {
  const baseItems = fromDocument(baseJson);
  const localItems = fromDocument(localJson);
  const remoteItems = fromDocument(remoteJson);

  const { items, hasConflict } = mergeItemList(baseItems, localItems, remoteItems);
  const doc = toDocument(items);

  return {
    merged: JSON.stringify(doc, null, 2),
    hasConflict,
  };
}

function cloneWithNewIds(item: ScratchpadItem): ScratchpadItem {
  return {
    ...item,
    id: generateId(),
    children: (item.children || []).map(cloneWithNewIds),
  };
}

export function mergeScratchpadKeepBoth(localJson: string, remoteJson: string): string {
  const localItems = fromDocument(localJson);
  const remoteItems = fromDocument(remoteJson);

  const localIds = new Set<string>();
  function collectIds(list: ScratchpadItem[]) {
    for (const item of list) {
      localIds.add(item.id);
      if (item.children) collectIds(item.children);
    }
  }
  collectIds(localItems);

  const mergedRemote: ScratchpadItem[] = [];
  for (const rItem of remoteItems) {
    if (localIds.has(rItem.id)) {
      mergedRemote.push(cloneWithNewIds(rItem));
    } else {
      mergedRemote.push(rItem);
    }
  }

  const combined = [...localItems, ...mergedRemote];
  const pinned = combined.filter((i) => Boolean(i.isPinned));
  const unpinned = combined.filter((i) => !i.isPinned);

  return JSON.stringify(toDocument([...pinned, ...unpinned]), null, 2);
}
