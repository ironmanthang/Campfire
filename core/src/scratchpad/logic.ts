import type { ScratchpadItem, ScratchpadDocument } from './types';

function generateId(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function sanitizeItems(rawItems: any[]): ScratchpadItem[] {
  const now = Date.now();
  return rawItems
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id : generateId(),
      text: typeof item.text === 'string' ? item.text : '',
      isChecked: Boolean(item.isChecked),
      isGroup: Boolean(item.isGroup),
      isPinned: Boolean(item.isPinned),
      children: Array.isArray(item.children) ? sanitizeItems(item.children) : [],
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : now,
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : now,
    }));
}

export function parseLegacyMarkdown(md: string): ScratchpadItem[] {
  if (!md || !md.trim()) return [];

  const lines = md.split('\n');
  const items: ScratchpadItem[] = [];
  const now = Date.now();

  for (const line of lines) {
    if (!line.trim()) continue;

    const taskMatch = line.match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const indentStr = taskMatch[1];
      const isChecked = taskMatch[3].toLowerCase() === 'x';
      const text = taskMatch[4].trim();
      const indent = Math.floor(indentStr.length / 2);

      const item: ScratchpadItem = {
        id: generateId(),
        text,
        isChecked,
        children: [],
        createdAt: now,
        updatedAt: now,
      };

      if (indent > 0 && items.length > 0) {
        items[items.length - 1].children.push(item);
      } else {
        items.push(item);
      }
    } else {
      const item: ScratchpadItem = {
        id: generateId(),
        text: line.trim(),
        isChecked: false,
        children: [],
        createdAt: now,
        updatedAt: now,
      };
      items.push(item);
    }
  }

  return items;
}

export function toDocument(items: ScratchpadItem[]): ScratchpadDocument {
  return {
    version: 1,
    items,
  };
}

export function fromDocument(raw: string): ScratchpadItem[] {
  if (!raw || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.items)) {
        return sanitizeItems(parsed.items);
      }
      if (Array.isArray(parsed)) {
        return sanitizeItems(parsed);
      }
    }
    return parseLegacyMarkdown(raw);
  } catch {
    return parseLegacyMarkdown(raw);
  }
}

export function toggleItem(items: ScratchpadItem[], id: string): ScratchpadItem[] {
  const now = Date.now();
  return items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        isChecked: !item.isChecked,
        updatedAt: now,
      };
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: toggleItem(item.children, id),
      };
    }
    return item;
  });
}

function setCheckedRecursively(item: ScratchpadItem, checked: boolean, now: number): ScratchpadItem {
  return {
    ...item,
    isChecked: checked,
    updatedAt: now,
    children: (item.children || []).map((child) => setCheckedRecursively(child, checked, now)),
  };
}

export function toggleItemWithChildren(items: ScratchpadItem[], id: string, checked?: boolean): ScratchpadItem[] {
  const now = Date.now();
  return items.map((item) => {
    if (item.id === id) {
      const targetChecked = checked !== undefined ? checked : !item.isChecked;
      return setCheckedRecursively(item, targetChecked, now);
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: toggleItemWithChildren(item.children, id, checked),
      };
    }
    return item;
  });
}

export function removeItem(items: ScratchpadItem[], id: string): ScratchpadItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: removeItem(item.children, id),
        };
      }
      return item;
    });
}

export function isRootDuplicate(items: ScratchpadItem[], text: string, excludeId?: string): boolean {
  const candidate = text.trim().toLowerCase();
  if (!candidate) return false;
  return items.some((item) => item.id !== excludeId && item.text.trim().toLowerCase() === candidate);
}

export function addItem(items: ScratchpadItem[], text: string): ScratchpadItem[] {
  const trimmed = text.trim();
  if (!trimmed) return items;
  if (isRootDuplicate(items, trimmed)) return items;

  const now = Date.now();
  const newItem: ScratchpadItem = {
    id: generateId(),
    text: trimmed,
    isChecked: false,
    children: [],
    createdAt: now,
    updatedAt: now,
  };

  const firstUnpinnedIndex = items.findIndex((item) => !item.isPinned);
  if (firstUnpinnedIndex === -1) {
    return [...items, newItem];
  }

  const next = [...items];
  next.splice(firstUnpinnedIndex, 0, newItem);
  return next;
}

export function addChildItem(items: ScratchpadItem[], parentId: string, text: string): ScratchpadItem[] {
  const trimmed = text.trim();
  if (!trimmed) return items;

  const now = Date.now();
  const newChild: ScratchpadItem = {
    id: generateId(),
    text: trimmed,
    isChecked: false,
    children: [],
    createdAt: now,
    updatedAt: now,
  };

  return items.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        updatedAt: now,
        children: [...(item.children || []), newChild],
      };
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: addChildItem(item.children, parentId, text),
      };
    }
    return item;
  });
}

export function addGroup(items: ScratchpadItem[], name: string): ScratchpadItem[] {
  const trimmed = name.trim();
  if (!trimmed) return items;
  if (isRootDuplicate(items, trimmed)) return items;

  const now = Date.now();
  const newGroup: ScratchpadItem = {
    id: generateId(),
    text: trimmed,
    isChecked: false,
    isGroup: true,
    children: [],
    createdAt: now,
    updatedAt: now,
  };

  const firstUnpinnedIndex = items.findIndex((item) => !item.isPinned);
  if (firstUnpinnedIndex === -1) {
    return [...items, newGroup];
  }

  const next = [...items];
  next.splice(firstUnpinnedIndex, 0, newGroup);
  return next;
}

function updateTextRecursively(items: ScratchpadItem[], id: string, text: string, now: number): ScratchpadItem[] {
  return items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        text,
        updatedAt: now,
      };
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: updateTextRecursively(item.children, id, text, now),
      };
    }
    return item;
  });
}

export function updateItemText(items: ScratchpadItem[], id: string, text: string): ScratchpadItem[] {
  const trimmed = text.trim();
  if (!trimmed) return items;

  const isRoot = items.some((item) => item.id === id);
  if (isRoot && isRootDuplicate(items, trimmed, id)) {
    return items;
  }

  const now = Date.now();
  return updateTextRecursively(items, id, trimmed, now);
}

export function renameGroup(items: ScratchpadItem[], id: string, name: string): ScratchpadItem[] {
  return updateItemText(items, id, name);
}

export function togglePinItem(items: ScratchpadItem[], id: string): ScratchpadItem[] {
  const now = Date.now();
  return items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        isPinned: !item.isPinned,
        updatedAt: now,
      };
    }
    return item;
  });
}

export function moveItem(items: ScratchpadItem[], id: string, direction: 'up' | 'down'): ScratchpadItem[] {
  const targetIndex = items.findIndex((item) => item.id === id);
  if (targetIndex === -1) return items;

  const isTargetPinned = Boolean(items[targetIndex].isPinned);

  if (direction === 'up') {
    let swapIndex = -1;
    for (let i = targetIndex - 1; i >= 0; i--) {
      if (Boolean(items[i].isPinned) === isTargetPinned) {
        swapIndex = i;
        break;
      }
    }
    if (swapIndex === -1) return items;

    const next = [...items];
    const temp = next[targetIndex];
    next[targetIndex] = next[swapIndex];
    next[swapIndex] = temp;
    return next;
  } else {
    let swapIndex = -1;
    for (let i = targetIndex + 1; i < items.length; i++) {
      if (Boolean(items[i].isPinned) === isTargetPinned) {
        swapIndex = i;
        break;
      }
    }
    if (swapIndex === -1) return items;

    const next = [...items];
    const temp = next[targetIndex];
    next[targetIndex] = next[swapIndex];
    next[swapIndex] = temp;
    return next;
  }
}

export function moveChildItem(
  items: ScratchpadItem[],
  parentId: string,
  childId: string,
  direction: 'up' | 'down'
): ScratchpadItem[] {
  const now = Date.now();
  return items.map((item) => {
    if (item.id === parentId && item.children && item.children.length > 0) {
      const childIndex = item.children.findIndex((c) => c.id === childId);
      if (childIndex === -1) return item;

      const targetSwapIndex = direction === 'up' ? childIndex - 1 : childIndex + 1;
      if (targetSwapIndex < 0 || targetSwapIndex >= item.children.length) {
        return item;
      }

      const newChildren = [...item.children];
      const temp = newChildren[childIndex];
      newChildren[childIndex] = newChildren[targetSwapIndex];
      newChildren[targetSwapIndex] = temp;

      return {
        ...item,
        children: newChildren,
        updatedAt: now,
      };
    }

    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: moveChildItem(item.children, parentId, childId, direction),
      };
    }

    return item;
  });
}

export function clearCompleted(items: ScratchpadItem[]): ScratchpadItem[] {
  return items
    .filter((item) => item.isGroup || !item.isChecked)
    .map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: clearCompleted(item.children),
        };
      }
      return item;
    });
}
