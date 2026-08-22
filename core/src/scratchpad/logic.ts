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

export function addItem(items: ScratchpadItem[], text: string): ScratchpadItem[] {
  const trimmed = text.trim();
  if (!trimmed) return items;

  const now = Date.now();
  const newItem: ScratchpadItem = {
    id: generateId(),
    text: trimmed,
    isChecked: false,
    children: [],
    createdAt: now,
    updatedAt: now,
  };

  return [...items, newItem];
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

  return [...items, newGroup];
}

export function renameGroup(items: ScratchpadItem[], id: string, name: string): ScratchpadItem[] {
  const trimmed = name.trim();
  if (!trimmed) return items;

  const now = Date.now();
  return items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        text: trimmed,
        updatedAt: now,
      };
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: renameGroup(item.children, id, name),
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
