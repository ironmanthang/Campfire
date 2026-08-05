import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getLocalYYYYMMDD } from "../lib/dateUtils";
import { useAppStore } from "../store/useAppStore";
import { JournalEntryMetadata } from "../types";

export function useEarliestEntryDate(): string {
  const { config, journalRefreshKey } = useAppStore();
  const [earliestDate, setEarliestDate] = useState<string>(getLocalYYYYMMDD());

  useEffect(() => {
    let isMounted = true;
    async function fetchEarliest() {
      if (!config.journal_dir) {
        if (isMounted) setEarliestDate(getLocalYYYYMMDD());
        return;
      }
      try {
        const entries: JournalEntryMetadata[] = await invoke("list_entries", {
          dirPath: config.journal_dir,
        });
        if (isMounted) {
          if (entries && entries.length > 0) {
            // list_entries returns entries sorted descending by date.
            // Using reduce to find minimum date string for guaranteed accuracy.
            const earliest = entries.reduce(
              (min, e) => (e.date < min ? e.date : min),
              entries[0].date
            );
            setEarliestDate(earliest);
          } else {
            setEarliestDate(getLocalYYYYMMDD());
          }
        }
      } catch (err) {
        console.error("Failed to fetch earliest entry date:", err);
        if (isMounted) {
          setEarliestDate(getLocalYYYYMMDD());
        }
      }
    }

    fetchEarliest();

    return () => {
      isMounted = false;
    };
  }, [config.journal_dir, journalRefreshKey]);

  return earliestDate;
}
