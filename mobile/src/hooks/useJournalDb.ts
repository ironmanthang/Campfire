import { useState, useEffect, useRef } from 'react';
import { listLocalEntries, saveLocalEntry, type LocalJournalEntry } from '../services/db';

export function useJournalDb(
  editorContent: string,
  activeDate: string | null,
  editorLoadedDate: string | null
) {
  const [entries, setEntries] = useState<LocalJournalEntry[]>([]);
  const latestRef = useRef({ editorContent, activeDate, editorLoadedDate, isDirty: false });

  // Keep ref synchronized with latest state
  useEffect(() => {
    latestRef.current.editorContent = editorContent;
    latestRef.current.activeDate = activeDate;
    latestRef.current.editorLoadedDate = editorLoadedDate;
  }, [editorContent, activeDate, editorLoadedDate]);

  const loadEntries = async () => {
    try {
      const all = await listLocalEntries();
      setEntries(all);
    } catch (err) {
      console.error('Failed to load local journal entries from IndexedDB:', err);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Debounced DB writer
  useEffect(() => {
    if (!editorLoadedDate || editorLoadedDate !== activeDate) return;
    
    latestRef.current.isDirty = true;

    const t = setTimeout(async () => {
      try {
        await saveLocalEntry(editorLoadedDate, editorContent);
        latestRef.current.isDirty = false;
        loadEntries();
      } catch (err) {
        console.error('Failed to save local entry to IndexedDB:', err);
      }
    }, 400); // 400ms debounce
    
    return () => clearTimeout(t);
  }, [editorContent, activeDate, editorLoadedDate]);

  // Immediately flush pending dirty content to IndexedDB when backgrounded or hidden
  useEffect(() => {
    const handleFlush = () => {
      const { editorContent, activeDate, editorLoadedDate, isDirty } = latestRef.current;
      if (isDirty && editorLoadedDate && editorLoadedDate === activeDate) {
        saveLocalEntry(editorLoadedDate, editorContent).catch((err) => {
          console.error('Failed emergency flush to IndexedDB on visibilitychange/pagehide:', err);
        });
        latestRef.current.isDirty = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', handleFlush);

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', handleFlush);
    };
  }, []);

  return { entries, loadEntries };
}

