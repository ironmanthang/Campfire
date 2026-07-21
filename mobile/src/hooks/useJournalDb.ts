import { useState, useEffect } from 'react';
import { listLocalEntries, saveLocalEntry, type LocalJournalEntry } from '../services/db';

export function useJournalDb(
  editorContent: string,
  activeDate: string | null,
  editorLoadedDate: string | null
) {
  const [entries, setEntries] = useState<LocalJournalEntry[]>([]);

  const loadEntries = async () => {
    const all = await listLocalEntries();
    setEntries(all);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Debounced DB writer
  useEffect(() => {
    if (!editorLoadedDate || editorLoadedDate !== activeDate) return;
    
    const t = setTimeout(async () => {
      await saveLocalEntry(editorLoadedDate, editorContent);
      loadEntries();
    }, 400); // 400ms debounce
    
    return () => clearTimeout(t);
  }, [editorContent, activeDate, editorLoadedDate]);

  return { entries, loadEntries };
}
