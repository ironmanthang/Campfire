import { useState, useEffect, useRef } from 'react';
import { getLocalEntry, saveLocalEntry } from '../services/db';
import { getLocalYYYYMMDD } from '../lib/dateUtils';

interface UseJournalNavigationOptions {
  loadEntries: () => Promise<void> | void;
  onSyncTrigger?: () => void;
  syncProgressStatus?: string;
  setToastMessage?: (msg: string | null) => void;
}

export function useJournalNavigation({
  loadEntries,
  onSyncTrigger,
  syncProgressStatus: _syncProgressStatus,
  setToastMessage: _setToastMessage
}: UseJournalNavigationOptions) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorLoadedDate, setEditorLoadedDate] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorReloadKey, setEditorReloadKey] = useState(0);

  const editorContentRef = useRef(editorContent);
  useEffect(() => {
    editorContentRef.current = editorContent;
  }, [editorContent]);

  const activeDateRef = useRef(activeDate);
  useEffect(() => {
    activeDateRef.current = activeDate;
  }, [activeDate]);

  const editorLoadedDateRef = useRef(editorLoadedDate);
  useEffect(() => {
    editorLoadedDateRef.current = editorLoadedDate;
  }, [editorLoadedDate]);

  const editorCacheRef = useRef<Record<string, string>>({});

  const getAdjacentDate = (dateStr: string, offset: number): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const prefetchAdjacentDates = (centerDate: string) => {
    const offsets = [-2, -1, 1, 2];
    offsets.forEach(offset => {
      const adj = getAdjacentDate(centerDate, offset);
      if (adj && editorCacheRef.current[adj] === undefined) {
        getLocalEntry(adj).then(entry => {
          editorCacheRef.current[adj] = entry?.content || '';
        }).catch(() => {});
      }
    });
  };

  const saveCurrentEntry = async () => {
    if (editorLoadedDateRef.current) {
      await saveLocalEntry(editorLoadedDateRef.current, editorContentRef.current);
      await loadEntries();
    }
  };

  useEffect(() => {
    const handlePopState = async (e: PopStateEvent) => {
      const dateInState = e.state?.activeDate || null;
      if (dateInState !== activeDateRef.current) {
        const savePromise = saveCurrentEntry();
        
        // Immediately reset state to loading/blank
        setEditorContent('');
        setEditorLoadedDate(null);
        activeDateRef.current = dateInState;
        setActiveDate(dateInState);
        
        await savePromise;
        await loadEntries();
        
        if (dateInState) {
          if (editorCacheRef.current[dateInState] !== undefined) {
            setEditorContent(editorCacheRef.current[dateInState]);
            setEditorLoadedDate(dateInState);
            setEditorLoading(false);
            prefetchAdjacentDates(dateInState);
          } else {
            setEditorLoading(true);
            const entry = await getLocalEntry(dateInState);
            if (activeDateRef.current === dateInState) {
              const content = entry?.content || '';
              editorCacheRef.current[dateInState] = content;
              setEditorContent(content);
              setEditorLoadedDate(dateInState);
              setEditorLoading(false);
              prefetchAdjacentDates(dateInState);
            }
          }
        } else {
          setEditorContent('');
          setEditorLoadedDate(null);
          setEditorLoading(false);
        }

        if (onSyncTrigger) {
          onSyncTrigger();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadEntries, onSyncTrigger]);

  const loadEntryForEditor = async (date: string) => {
    activeDateRef.current = date;
    setActiveDate(date);

    if (editorCacheRef.current[date] !== undefined) {
      setEditorContent(editorCacheRef.current[date]);
      setEditorLoadedDate(date);
      setEditorLoading(false);
      prefetchAdjacentDates(date);
    } else {
      setEditorContent('');
      setEditorLoadedDate(null);

      const entry = await getLocalEntry(date);
      if (activeDateRef.current === date) {
        const content = entry?.content || '';
        editorCacheRef.current[date] = content;
        setEditorContent(content);
        setEditorLoadedDate(date);
        setEditorLoading(false);
        prefetchAdjacentDates(date);
      }
    }
  };

  const handleSelectEntry = async (date: string) => {
    setEditorLoading(true);
    if (window.history.state?.activeDate !== date) {
      window.history.pushState({ activeDate: date }, '');
    }
    await loadEntryForEditor(date);
  };

  const handleSwitchEntryDate = async (newDate: string) => {
    const savePromise = saveCurrentEntry();
    
    // Immediately show loading/blank state for the new date
    setEditorContent('');
    setEditorLoadedDate(null);
    activeDateRef.current = newDate;
    setActiveDate(newDate);
    
    window.history.replaceState({ activeDate: newDate }, '');
    
    await savePromise;
    
    // Check if cache has it, otherwise fetch
    if (editorCacheRef.current[newDate] !== undefined) {
      setEditorContent(editorCacheRef.current[newDate]);
      setEditorLoadedDate(newDate);
      setEditorLoading(false);
      prefetchAdjacentDates(newDate);
    } else {
      const entry = await getLocalEntry(newDate);
      if (activeDateRef.current === newDate) {
        const content = entry?.content || '';
        editorCacheRef.current[newDate] = content;
        setEditorContent(content);
        setEditorLoadedDate(newDate);
        setEditorLoading(false);
        prefetchAdjacentDates(newDate);
      }
    }
  };

  const handleCreateToday = () => {
    const today = getLocalYYYYMMDD();
    handleSelectEntry(today);
  };

  const handleEditorSave = async (content: string) => {
    if (!activeDate) return;
    setEditorContent(content);
    editorCacheRef.current[activeDate] = content;
  };

  const forceReloadEditor = (date: string, content: string) => {
    editorCacheRef.current[date] = content;
    setEditorContent(content);
    setEditorLoadedDate(date);
    setEditorReloadKey(prev => prev + 1);
    prefetchAdjacentDates(date);
  };

  const clearCache = () => {
    editorCacheRef.current = {};
  };

  return {
    activeDate,
    setActiveDate,
    editorContent,
    setEditorContent,
    editorLoadedDate,
    setEditorLoadedDate,
    editorLoading,
    editorReloadKey,
    setEditorReloadKey,
    saveCurrentEntry,
    handleSelectEntry,
    handleSwitchEntryDate,
    handleCreateToday,
    handleEditorSave,
    forceReloadEditor,
    clearCache
  };
}
