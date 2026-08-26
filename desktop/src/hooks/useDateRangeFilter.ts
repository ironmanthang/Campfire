import { useMemo, useCallback } from "react";
import { usePersistedState } from "./usePersistedState";
import { getDatePresets, getLocalYYYYMMDD } from "../lib/dateUtils";

interface UseDateRangeFilterOptions {
  keyPrefix: string;
  earliestDate?: string;
  defaultPreset?: string;
}

export function useDateRangeFilter({
  keyPrefix,
  earliestDate,
  defaultPreset = "All",
}: UseDateRangeFilterOptions) {
  const [activePresetLabel, setActivePresetLabel] = usePersistedState<string>(
    `${keyPrefix}_active_preset`,
    defaultPreset
  );
  const [customStartDate, setCustomStartDate] = usePersistedState<string>(
    `${keyPrefix}_filter_start`,
    earliestDate || getLocalYYYYMMDD()
  );
  const [customEndDate, setCustomEndDate] = usePersistedState<string>(
    `${keyPrefix}_filter_end`,
    getLocalYYYYMMDD
  );

  // If a preset is active, dynamically resolve start & end dates against current date and earliestDate
  const { startDate, endDate } = useMemo(() => {
    if (activePresetLabel) {
      const presets = getDatePresets(earliestDate);
      const match = presets.find((p) => p.label === activePresetLabel);
      if (match) {
        return { startDate: match.start, endDate: match.end };
      }
    }
    return { startDate: customStartDate, endDate: customEndDate };
  }, [activePresetLabel, earliestDate, customStartDate, customEndDate]);

  const handleStartChange = useCallback(
    (val: string) => {
      setActivePresetLabel("");
      setCustomStartDate(val);
    },
    [setActivePresetLabel, setCustomStartDate]
  );

  const handleEndChange = useCallback(
    (val: string) => {
      setActivePresetLabel("");
      setCustomEndDate(val);
    },
    [setActivePresetLabel, setCustomEndDate]
  );

  const handlePresetChange = useCallback(
    (presetLabel: string) => {
      setActivePresetLabel(presetLabel);
      if (presetLabel) {
        const presets = getDatePresets(earliestDate);
        const match = presets.find((p) => p.label === presetLabel);
        if (match) {
          setCustomStartDate(match.start);
          setCustomEndDate(match.end);
        }
      }
    },
    [setActivePresetLabel, setCustomStartDate, setCustomEndDate, earliestDate]
  );

  return {
    startDate,
    endDate,
    activePresetLabel,
    onStartChange: handleStartChange,
    onEndChange: handleEndChange,
    onPresetLabelChange: handlePresetChange,
    setStartDate: setCustomStartDate,
    setEndDate: setCustomEndDate,
    setActivePresetLabel,
  };
}
