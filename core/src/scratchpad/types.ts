export type ItemCheckStatus = 'unchecked' | 'indeterminate' | 'checked';

export interface CompletedItemSummary {
  id: string;
  text: string;
  parentPath?: string;
}

export interface ScratchpadItem {
  id: string;
  text: string;
  isChecked: boolean;
  isGroup?: boolean;
  isPinned?: boolean;
  children: ScratchpadItem[];
  createdAt: number;
  updatedAt: number;
}

export interface ScratchpadDocument {
  version: 1;
  items: ScratchpadItem[];
}

export interface UseScratchpadReturn {
  items: ScratchpadItem[];
  loading: boolean;
  toggleItemWithChildren: (id: string, checked?: boolean) => void;
  addItem: (text: string) => void;
  addChildItem: (parentId: string, text: string) => void;
  addGroup: (name: string) => void;
  renameGroup: (id: string, name: string) => void;
  updateItemText: (id: string, text: string) => void;
  togglePinItem: (id: string) => void;
  moveItem: (id: string, direction: 'up' | 'down') => void;
  moveChildItem: (parentId: string, childId: string, direction: 'up' | 'down') => void;
  isDuplicate: (text: string, excludeId?: string) => boolean;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
  clearSelectedCompleted: (idsToDelete: Set<string>, idsToUncheck: Set<string>) => void;
}

