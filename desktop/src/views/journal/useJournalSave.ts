import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { extractTags } from "../../lib/tagUtils";

type SaveStatus = "idle" | "saving";

export function useJournalSave({
  config,
  currentDate,
  view,
  showNotification,
  isDriveConnected,
  handleSync,
  journalRefreshKey,
  textareaRef,
}: {
  config: any;
  currentDate: string;
  view: string;
  showNotification: (msg: string, type: "success" | "error") => void;
  isDriveConnected: boolean;
  handleSync: (force?: boolean) => Promise<void>;
  journalRefreshKey: number;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const { t } = useTranslation();
  const prevDateRef = useRef(currentDate);

  const [entryContent, setEntryContent] = useState("");
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [editorTags, setEditorTags] = useState<string[]>([]);

  const isSavingRef = useRef(false);
  const isDirtyRef = useRef(isDirty);
  const currentDateRef = useRef(currentDate);
  const entryContentRef = useRef(entryContent);
  const saveEntryImmediateRef = useRef<(date: string, content: string) => void>(() => {});

  isDirtyRef.current = isDirty;
  currentDateRef.current = currentDate;
  entryContentRef.current = entryContent;

  const saveEntryImmediate = useCallback(
    async (dateToSave: string, contentToSave: string) => {
      if (!config.journal_dir) return;
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus("saving");
      try {
        await invoke("write_entry", {
          dirPath: config.journal_dir,
          date: dateToSave,
          content: contentToSave,
        });
        setIsDirty(false);
        isDirtyRef.current = false;

        if (config.google_drive_auto_sync && config.google_drive_client_id && isDriveConnected) {
          handleSync().catch(console.error);
        }
      } catch (err) {
        console.error(err);
        showNotification(t("journalEditor.failedToSaveEntry"), "error");
      } finally {
        isSavingRef.current = false;
        setSaveStatus("idle");
      }
    },
    [
      config.journal_dir,
      config.google_drive_auto_sync,
      config.google_drive_client_id,
      isDriveConnected,
      handleSync,
      showNotification,
      t,
    ]
  );

  saveEntryImmediateRef.current = saveEntryImmediate;

  // Load entry
  useEffect(() => {
    if (!config.journal_dir) return;

    if (isDirty && prevDateRef.current !== currentDate) {
      saveEntryImmediate(prevDateRef.current, entryContent);
    }

    prevDateRef.current = currentDate;

    let active = true;
    async function loadEntry() {
      setLoadingEntry(true);
      setEntryContent("");
      entryContentRef.current = "";
      setEditorTags([]);
      try {
        const text = await invoke<string>("read_entry", {
          dirPath: config.journal_dir,
          date: currentDate,
        });
        if (active) {
          setEntryContent(text);
          setEditorTags(extractTags(text));
          setIsDirty(false);
          isDirtyRef.current = false;
          entryContentRef.current = text;
        }
      } catch (err) {
        console.error("Error loading entry:", err);
        showNotification(t("journalEditor.failedToLoadEntry"), "error");
      } finally {
        if (active) setLoadingEntry(false);
      }
    }

    loadEntry();
    return () => {
      active = false;
    };
  }, [currentDate, config.journal_dir, journalRefreshKey]);

  // Focus textarea when done loading
  useEffect(() => {
    if (!loadingEntry && view === "journal" && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [loadingEntry, view, textareaRef]);

  // Keep focus on "do-nothing" clicks if no text is selected
  useEffect(() => {
    if (view !== "journal") return;
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("textarea, input, select, button, [role='button']")) return;

      const selection = window.getSelection()?.toString();
      if (selection && selection.trim().length > 0) return;

      textareaRef.current?.focus();
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [view, textareaRef]);

  // Auto-save debouncer
  useEffect(() => {
    if (!config.journal_dir || loadingEntry || !isDirty) return;
    if (config.autosave_interval === 0) return;

    const delay = config.autosave_interval * 1000;
    const timer = setTimeout(() => {
      saveEntryImmediateRef.current(currentDate, entryContent);
    }, delay);

    return () => clearTimeout(timer);
  }, [entryContent, config.autosave_interval, isDirty, loadingEntry, currentDate]);

  const handleTextChange = (text: string) => {
    setEntryContent(text);
    setEditorTags(extractTags(text));
    setIsDirty(true);
    isDirtyRef.current = true;
    entryContentRef.current = text;
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        saveEntryImmediateRef.current(currentDateRef.current, entryContentRef.current);
      }
    };
  }, []);

  return {
    entryContent,
    setEntryContent,
    loadingEntry,
    isDirty,
    saveStatus,
    editorTags,
    saveEntryImmediate,
    handleTextChange,
  };
}
