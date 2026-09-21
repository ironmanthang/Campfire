import type { ScratchpadItem, ItemCheckStatus, CompletedItemSummary } from './types';

export function syncParentCheckStates(items: ScratchpadItem[], now: number = Date.now()): ScratchpadItem[] {
  return items.map((item) => {
    if (!item.children || item.children.length === 0) {
      return item;
    }

    const updatedChildren = syncParentCheckStates(item.children, now);
    if (item.isGroup) {
      return {
        ...item,
        children: updatedChildren,
      };
    }

    const checkableChildren = updatedChildren.filter((c) => !c.isGroup);
    if (checkableChildren.length === 0) {
      return {
        ...item,
        children: updatedChildren,
      };
    }

    const allChecked = checkableChildren.every((c) => c.isChecked);
    const hasChanged = item.isChecked !== allChecked;

    return {
      ...item,
      isChecked: allChecked,
      updatedAt: hasChanged ? now : item.updatedAt,
      children: updatedChildren,
    };
  });
}

export function getItemCheckStatus(item: ScratchpadItem): ItemCheckStatus {
  if (item.isGroup) return 'unchecked';

  const checkableChildren = (item.children || []).filter((c) => !c.isGroup);
  if (checkableChildren.length === 0) {
    return item.isChecked ? 'checked' : 'unchecked';
  }

  let hasCheckedOrIndeterminate = false;
  let hasUncheckedOrIndeterminate = false;

  for (const child of checkableChildren) {
    const childStatus = getItemCheckStatus(child);
    if (childStatus === 'checked') {
      hasCheckedOrIndeterminate = true;
    } else if (childStatus === 'unchecked') {
      hasUncheckedOrIndeterminate = true;
    } else if (childStatus === 'indeterminate') {
      hasCheckedOrIndeterminate = true;
      hasUncheckedOrIndeterminate = true;
    }
  }

  if (hasCheckedOrIndeterminate && !hasUncheckedOrIndeterminate) {
    return 'checked';
  }
  if (hasCheckedOrIndeterminate && hasUncheckedOrIndeterminate) {
    return 'indeterminate';
  }
  return 'unchecked';
}

export function getCompletedItems(items: ScratchpadItem[], currentPath: string = ''): CompletedItemSummary[] {
  const result: CompletedItemSummary[] = [];

  for (const item of items) {
    const path = currentPath ? `${currentPath} > ${item.text}` : item.text;

    if (!item.isGroup && item.isChecked) {
      result.push({
        id: item.id,
        text: item.text,
        parentPath: currentPath || undefined,
      });
    }

    if (item.children && item.children.length > 0) {
      result.push(...getCompletedItems(item.children, item.isGroup ? currentPath : path));
    }
  }

  return result;
}

export function countCompletedTasks(items: ScratchpadItem[]): number {
  let count = 0;
  for (const item of items) {
    if (!item.isGroup && item.isChecked) {
      count++;
    }
    if (item.children && item.children.length > 0) {
      count += countCompletedTasks(item.children);
    }
  }
  return count;
}
