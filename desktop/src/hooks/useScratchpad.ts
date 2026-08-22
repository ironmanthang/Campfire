import { useState, useEffect, useRef, useCallback } from "react";
import {
  type ScratchpadItem,
  toDocument,
  toggleItemWithChildren as coreToggleItemWithChildren,
  addItem as coreAddItem,
  addChildItem as coreAddChildItem,
  addGroup as coreAddGroup,
  renameGroup as coreRenameGroup,
  removeItem as coreRemoveItem,
  clearCompleted as coreClearCompleted,
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
  removeItem: (id: string) => void;
  clearCompleted: () => void;
}

export function useScratchpad(isOpen: boolean = true): UseScratchpadReturn {
  const { config, handleSync, isDriveConnected } = useAppStore();
  const [items, setItems] = useState<ScratchpadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  const triggerDebouncedSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      if (config.google_drive_auto_sync && config.google_drive_client_id && isDriveConnected) {
        handleSync().catch(console.error);
      }
    }, 1000);
  }, [config.google_drive_auto_sync, config.google_drive_client_id, isDriveConnected, handleSync]);

  useEffect(() => {
    if (!isOpen || !config.journal_dir) return;

    let isMounted = true;
    setLoading(true);

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
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, config.journal_dir]);

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
        saveAndSync(next);
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
        saveAndSync(next);
        return next;
      });
    },
    [saveAndSync]
  );

  const renameGroup = useCallback(
    (id: string, name: string) => {
      setItems((prev) => {
        const next = coreRenameGroup(prev, id, name);
        saveAndSync(next);
        return next;
      });
    },
    [saveAndSync]
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
    removeItem,
    clearCompleted,
  };
}
