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
