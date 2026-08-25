import { useState, useEffect, useRef, useCallback } from "react";
import {
  type ScratchpadItem,
  toDocument,
  toggleItemWithChildren as coreToggleItemWithChildren,
  addItem as coreAddItem,
  addChildItem as coreAddChildItem,
  addGroup as coreAddGroup,
  renameGroup as coreRenameGroup,
  updateItemText as coreUpdateItemText,
  removeItem as coreRemoveItem,
  clearCompleted as coreClearCompleted,
  togglePinItem as coreTogglePinItem,
  moveItem as coreMoveItem,
  moveChildItem as coreMoveChildItem,
  isRootDuplicate,
} from "@campfire/core";
import { readScratchpadDoc, writeScratchpadDoc } from "../services/scratchpad";
import { useAppStore } from "../store/useAppStore";

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
}

export function useScratchpad(isOpen: boolean = true): UseScratchpadReturn {
  const { config, journalRefreshKey, triggerDebouncedSync } = useAppStore();
  const [items, setItems] = useState<ScratchpadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (!isOpen || !config.journal_dir) return;

    let isMounted = true;
    if (isInitialLoadRef.current) {
      setLoading(true);
    }

    readScratchpadDoc(config.journal_dir)
      .then((doc) => {
        if (isMounted) {
          setItems(doc.items || []);
        }
      })
      .catch((err) => {
        console.error("Failed to read desktop scratchpad:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          isInitialLoadRef.current = false;
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, config.journal_dir, journalRefreshKey]);

  const saveAndSync = useCallback(
    (newItems: ScratchpadItem[]) => {
      if (!config.journal_dir) return;
      writeScratchpadDoc(config.journal_dir, toDocument(newItems))
        .then(() => triggerDebouncedSync())
        .catch((err) => console.error("Failed to save desktop scratchpad:", err));
    },
    [config.journal_dir, triggerDebouncedSync]
  );

  const toggleItemWithChildren = useCallback(
    (id: string, checked?: boolean) => {
      setItems((prev) => {
        const next = coreToggleItemWithChildren(prev, id, checked);
        saveAndSync(next);
        return next;
      });
    },
    [saveAndSync]
  );

  const addItem = useCallback(
    (text: string) => {
      setItems((prev) => {
        const next = coreAddItem(prev, text);
        if (next !== prev) {
          saveAndSync(next);
        }
        return next;
      });
    },
    [saveAndSync]
  );

  const addChildItem = useCallback(
    (parentId: string, text: string) => {
      setItems((prev) => {
        const next = coreAddChildItem(prev, parentId, text);
        saveAndSync(next);
        return next;
      });
    },
    [saveAndSync]
  );

  const addGroup = useCallback(
    (name: string) => {
      setItems((prev) => {
        const next = coreAddGroup(prev, name);
        if (next !== prev) {
          saveAndSync(next);
        }
        return next;
      });
    },
    [saveAndSync]
  );

  const renameGroup = useCallback(
    (id: string, name: string) => {
      setItems((prev) => {
        const next = coreRenameGroup(prev, id, name);
        if (next !== prev) {
          saveAndSync(next);
        }
        return next;
      });
    },
    [saveAndSync]
  );

  const updateItemText = useCallback(
    (id: string, text: string) => {
      setItems((prev) => {
        const next = coreUpdateItemText(prev, id, text);
        if (next !== prev) {
          saveAndSync(next);
        }
        return next;
      });
    },
    [saveAndSync]
  );

  const togglePinItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = coreTogglePinItem(prev, id);
        saveAndSync(next);
        return next;
      });
    },
    [saveAndSync]
  );

  const moveItem = useCallback(
    (id: string, direction: 'up' | 'down') => {
      setItems((prev) => {
        const next = coreMoveItem(prev, id, direction);
        if (next !== prev) {
          saveAndSync(next);
        }
        return next;
      });
    },
    [saveAndSync]
  );

  const moveChildItem = useCallback(
    (parentId: string, childId: string, direction: 'up' | 'down') => {
      setItems((prev) => {
        const next = coreMoveChildItem(prev, parentId, childId, direction);
        if (next !== prev) {
          saveAndSync(next);
        }
        return next;
      });
    },
    [saveAndSync]
  );

  const isDuplicate = useCallback(
    (text: string, excludeId?: string) => {
      return isRootDuplicate(items, text, excludeId);
    },
    [items]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = coreRemoveItem(prev, id);
        saveAndSync(next);
        return next;
      });
    },
    [saveAndSync]
  );

  const clearCompleted = useCallback(() => {
    setItems((prev) => {
      const next = coreClearCompleted(prev);
      saveAndSync(next);
      return next;
    });
  }, [saveAndSync]);

  return {
    items,
    loading,
    toggleItemWithChildren,
    addItem,
    addChildItem,
    addGroup,
    renameGroup,
    updateItemText,
    togglePinItem,
    moveItem,
    moveChildItem,
    isDuplicate,
    removeItem,
    clearCompleted,
  };
}
