import type { ScratchpadItem, ScratchpadDocument } from './types';
import { generateId } from './id';
import { syncParentCheckStates } from './tree';

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
        return syncParentCheckStates(sanitizeItems(parsed.items));
      }
      if (Array.isArray(parsed)) {
        return syncParentCheckStates(sanitizeItems(parsed));
      }
    }
    return syncParentCheckStates(parseLegacyMarkdown(raw));
  } catch {
    return syncParentCheckStates(parseLegacyMarkdown(raw));
  }
}
