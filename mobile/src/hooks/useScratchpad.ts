import { useState, useEffect, useCallback } from 'react';
import {
  type ScratchpadItem,
  toDocument,
  toggleItem as coreToggleItem,
  toggleItemWithChildren as coreToggleItemWithChildren,
  addItem as coreAddItem,
  addChildItem as coreAddChildItem,
  removeItem as coreRemoveItem,
  clearCompleted as coreClearCompleted,
} from '@campfire/core';
import { getScratchpadDoc, saveScratchpadDoc } from '../services/db';

export interface UseScratchpadReturn {
  items: ScratchpadItem[];
  loading: boolean;
  toggleItem: (id: string) => void;
  toggleItemWithChildren: (id: string, checked?: boolean) => void;
  addItem: (text: string) => void;
  addChildItem: (parentId: string, text: string) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
}

export function useScratchpad(isOpen: boolean = true): UseScratchpadReturn {
  const [items, setItems] = useState<ScratchpadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    getScratchpadDoc()
      .then((doc) => {
        if (isMounted) {
          setItems(doc.items || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load mobile scratchpad:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = coreToggleItem(prev, id);
      saveScratchpadDoc(toDocument(next)).catch((err) =>
        console.error('Failed to save mobile scratchpad:', err)
      );
      return next;
    });
  }, []);

  const toggleItemWithChildren = useCallback((id: string, checked?: boolean) => {
    setItems((prev) => {
      const next = coreToggleItemWithChildren(prev, id, checked);
      saveScratchpadDoc(toDocument(next)).catch((err) =>
        console.error('Failed to save mobile scratchpad:', err)
      );
      return next;
    });
  }, []);

  const addItem = useCallback((text: string) => {
    setItems((prev) => {
      const next = coreAddItem(prev, text);
      saveScratchpadDoc(toDocument(next)).catch((err) =>
        console.error('Failed to save mobile scratchpad:', err)
      );
      return next;
    });
  }, []);

  const addChildItem = useCallback((parentId: string, text: string) => {
    setItems((prev) => {
      const next = coreAddChildItem(prev, parentId, text);
      saveScratchpadDoc(toDocument(next)).catch((err) =>
        console.error('Failed to save mobile scratchpad:', err)
      );
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = coreRemoveItem(prev, id);
      saveScratchpadDoc(toDocument(next)).catch((err) =>
        console.error('Failed to save mobile scratchpad:', err)
      );
      return next;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((prev) => {
      const next = coreClearCompleted(prev);
      saveScratchpadDoc(toDocument(next)).catch((err) =>
        console.error('Failed to save mobile scratchpad:', err)
      );
      return next;
    });
  }, []);

  return {
    items,
    loading,
    toggleItem,
    toggleItemWithChildren,
    addItem,
    addChildItem,
    removeItem,
    clearCompleted,
  };
}
